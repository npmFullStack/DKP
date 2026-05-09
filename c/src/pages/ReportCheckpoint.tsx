// src/pages/ReportCheckpoint.tsx (UPDATED - no emojis)
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ChevronRight,
    MapPin,
    Camera,
    Send,
    X,
    AlertCircle,
    Info,
    Crosshair,
    Clock,
    HelpCircle,
    CheckCircle,
    Image,
    Navigation,
    Award,
    Bell
} from "lucide-react";
import Button from "@/components/Button";
import LocationSearch from "@/components/LocationSearch";
import MiniMapRadar from "@/components/MiniMapRadar";

const ReportCheckpoint = () => {
    const [formData, setFormData] = useState({
        location: "",
        address: "",
        images: [] as File[],
        locationData: {
            province: null,
            municipality: null,
            barangay: null,
            street: "",
            fullAddress: "",
            coordinates: null as { lat: number; lng: number } | null
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(5 * 60 * 60); // 5 hours in seconds

    // Countdown timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleLocationChange = (locationData: any) => {
        setFormData(prev => ({
            ...prev,
            locationData,
            address: locationData.fullAddress,
            location: `${locationData.barangay?.label || ''}, ${locationData.municipality?.label || ''}, ${locationData.province?.label || ''}`.replace(/^,|, ,/g, '').trim()
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + formData.images.length > 5) {
            alert("You can upload up to 5 images");
            return;
        }

        const newUrls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(prev => [...prev, ...newUrls]);
        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.locationData.fullAddress) {
            alert("Please fill in the location details");
            return;
        }

        setIsSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            console.log("Checkpoint reported:", {
                location: formData.location,
                address: formData.address,
                images: formData.images.length,
                locationData: formData.locationData,
                timeReported: new Date().toISOString(),
                expiresIn: "5 hours",
                expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
            });
            setIsSubmitting(false);
            alert("Checkpoint reported successfully!\n\nIt will remain active for 5 hours.");
            
            // Reset form
            setFormData({
                location: "",
                address: "",
                images: [],
                locationData: {
                    province: null,
                    municipality: null,
                    barangay: null,
                    street: "",
                    fullAddress: "",
                    coordinates: null
                }
            });
            setPreviewUrls([]);
        }, 1500);
    };

    // Format time remaining
    const formatTimeRemaining = () => {
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
                <Link to="/checkpoint" className="text-gray-400 hover:text-primary transition-colors">
                    Checkpoints
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <span className="text-white font-medium">Report</span>
            </nav>

            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Report a Checkpoint
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                    Help the community by reporting new checkpoint locations you encounter.
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Location Search Component */}
                        <LocationSearch onChange={handleLocationChange} />

                        {/* Hidden fields to store address and location name */}
                        <input type="hidden" name="address" value={formData.address} />
                        <input type="hidden" name="location" value={formData.location} />

                        {/* Image Upload - Made Optional */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Upload Images <span className="text-gray-400 text-sm">(Optional, Max 5)</span>
                            </label>
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <Image className="w-6 h-6 text-gray-400" />
                                    <span className="text-gray-400 text-sm">
                                        Click to upload or drag and drop
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        PNG, JPG up to 5MB each
                                    </span>
                                </label>
                            </div>

                            {/* Image Previews */}
                            {previewUrls.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Preview ${index + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border border-white/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 p-0.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4">
                            <Link to="/checkpoint">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                >
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                variant="primary"
                                icon={<Send className="w-4 h-4" />}
                                className="rounded-full"
                                disabled={isSubmitting || !formData.locationData.fullAddress}
                            >
                                {isSubmitting ? "Submitting..." : "Submit Report"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right Column - Mini Map Radar & Instructions */}
                <div className="space-y-6">
                    {/* Mini Map Radar */}
                    <div className="bg-secondary/30 rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="text-white font-semibold flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                Location Radar Preview
                            </h3>
                            <p className="text-gray-400 text-xs mt-1">
                                Real-time preview of your reported location
                            </p>
                        </div>
                        <div className="p-4">
                            <MiniMapRadar 
                                location={formData.locationData.fullAddress ? {
                                    province: formData.locationData.province?.label || '',
                                    municipality: formData.locationData.municipality?.label || '',
                                    barangay: formData.locationData.barangay?.label || '',
                                    street: formData.locationData.street,
                                    fullAddress: formData.locationData.fullAddress
                                } : null}
                                coordinates={formData.locationData.coordinates}
                            />
                        </div>
                    </div>

                    {/* Instructions Card */}
                    <div className="bg-secondary/30 rounded-xl border border-white/10 p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Info className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-semibold mb-2">
                                    Important Information
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                        <span className="text-yellow-400 flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            Active Duration:
                                        </span>
                                        <span className="text-yellow-400 font-mono font-bold">{formatTimeRemaining()}</span>
                                    </div>
                                    <p className="text-gray-300">
                                        This report will remain <span className="text-primary font-semibold">active for 5 hours</span> from the time of submission.
                                        After 5 hours, the checkpoint will be automatically marked as inactive.
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <p className="text-gray-400 text-xs flex items-start gap-2">
                                            <CheckCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                            <span><span className="text-gray-300">Why 5 hours?</span> Checkpoint operations are typically temporary. 
                                            This ensures our community gets timely and accurate information.</span>
                                        </p>
                                        <p className="text-gray-400 text-xs flex items-start gap-2 mt-2">
                                            <Navigation className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                            <span><span className="text-gray-300">Be accurate:</span> Double-check your location before submitting 
                                            to help fellow motorists avoid unexpected checkpoints.</span>
                                        </p>
                                        <p className="text-gray-400 text-xs flex items-start gap-2 mt-2">
                                            <Camera className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                            <span><span className="text-gray-300">Optional images:</span> While not required, photos help verify 
                                            the checkpoint location and operation status.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex items-start gap-2 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">
                            <span className="text-gray-300">Community-driven reports:</span> Information is contributed by users and may not be 100% accurate. 
                            Always verify and drive safely. False reports may be penalized.
                        </p>
                    </div>

                    {/* Report Tips */}
                    <div className="bg-primary/5 rounded-xl border border-primary/20 p-4">
                        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            Tips for Accurate Reporting:
                        </h4>
                        <ul className="space-y-2">
                            {[
                                "Use the search bar or 'My Location' button for precise location",
                                "Add specific landmarks or street names for better accuracy",
                                "Upload clear photos if possible (helps verification)",
                                "Report only active checkpoints you personally encountered",
                                "Your report helps other drivers plan their routes better"
                            ].map((tip, index) => (
                                <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                                    <HelpCircle className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCheckpoint;