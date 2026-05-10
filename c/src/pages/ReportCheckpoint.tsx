// src/pages/ReportCheckpoint.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronRight,
    Send,
    X,
    AlertCircle,
    Clock,
    CheckCircle,
    Image,
    Flag
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
            title: "",
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
    const [showSuccess, setShowSuccess] = useState(false);

    const handleLocationChange = (locationData: any) => {
        setFormData(prev => ({
            ...prev,
            locationData,
            address: locationData.fullAddress,
            location: `${locationData.barangay?.label || ''}, ${locationData.municipality?.label || ''}, ${locationData.province?.label || ''}`
                .replace(/^,\s*|,\s*,/g, '').trim()
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + formData.images.length > 5) {
            alert("You can upload up to 5 images");
            return;
        }
        setPreviewUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.locationData.fullAddress) {
            alert("Please fill in the location details");
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setShowSuccess(true);
            setTimeout(() => {
                setFormData({
                    location: "",
                    address: "",
                    images: [],
                    locationData: {
                        title: "",
                        province: null,
                        municipality: null,
                        barangay: null,
                        street: "",
                        fullAddress: "",
                        coordinates: null
                    }
                });
                setPreviewUrls([]);
                setShowSuccess(false);
            }, 3000);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                    Report a Checkpoint
                </h1>
                <p className="text-gray-400 text-sm">
                    Help the community stay informed about active checkpoints.
                </p>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
                <Link to="/checkpoint" className="text-gray-400 hover:text-primary transition-colors">
                    Checkpoints
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <span className="text-white font-medium">Report</span>
            </nav>

            {/* Success */}
            {showSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <h3 className="text-green-400 font-semibold">Reported Successfully!</h3>
                            <p className="text-green-300/80 text-sm">
                                This checkpoint will remain active for 5 hours.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left – Form */}
                <div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <LocationSearch onChange={handleLocationChange} />

                        {/* Image Upload */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Photos <span className="text-gray-400 text-sm font-normal">(Optional, max 5)</span>
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
                                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Image className="w-6 h-6 text-gray-400" />
                                    <span className="text-gray-400 text-sm">Click to upload</span>
                                    <span className="text-gray-500 text-xs">PNG, JPG up to 5 MB each</span>
                                </label>
                            </div>

                            {previewUrls.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {previewUrls.map((url, i) => (
                                        <div key={i} className="relative group">
                                            <img src={url} alt={`Preview ${i + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                                            <button type="button" onClick={() => removeImage(i)}
                                                className="absolute -top-2 -right-2 p-0.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-2">
                            <Link to="/checkpoint">
                                <Button type="button" variant="outline" className="rounded-full">
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

                {/* Right – Radar + Info */}
                <div className="space-y-6">
                    {/* Radar */}
                    <div className="bg-secondary/30 rounded-xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                            <h3 className="text-white font-semibold text-sm">Location Preview</h3>
                        </div>
                        <div className="p-6 flex justify-center">
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

                    {/* Quick info */}
                    <div className="bg-secondary/30 rounded-xl border border-white/10 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Active for 5 hours after submission
                        </div>
                        <div className="h-px bg-white/10" />
                        <ul className="space-y-2 text-xs text-gray-400">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                Use the GPS button for the most accurate location
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                Add a landmark or street name to help others
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                Only report checkpoints you personally saw
                            </li>
                        </ul>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex items-start gap-2 p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-400">
                            Reports are community-contributed and may not always be accurate. Drive safely. False reports may be penalized.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCheckpoint;