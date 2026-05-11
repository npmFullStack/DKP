// src/pages/ReportCheckpoint.tsx (updated for fullstack)
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ChevronRight,
    Send,
    X,
    AlertCircle,
    Clock,
    CheckCircle,
    Image,
    Crosshair,
    ShieldAlert,
    Info,
    Loader2
} from "lucide-react";
import Button from "@/components/Button";
import LocationSearch from "@/components/LocationSearch";
import MiniMapRadar from "@/components/MiniMapRadar";
import { checkpointService } from "@/services/checkpointService";

interface LocationData {
    title: string;
    province: { value: string; label: string } | null;
    municipality: { value: string; label: string } | null;
    barangay: { value: string; label: string } | null;
    street: string;
    fullAddress: string;
    coordinates: { lat: number; lng: number } | null;
}

const ReportCheckpoint = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<LocationData>({
        title: "",
        province: null,
        municipality: null,
        barangay: null,
        street: "",
        fullAddress: "",
        coordinates: null
    });
    const [images, setImages] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleLocationChange = (
        locationData: LocationData & { fullAddress: string }
    ) => {
        setFormData({
            title: locationData.title,
            province: locationData.province,
            municipality: locationData.municipality,
            barangay: locationData.barangay,
            street: locationData.street,
            fullAddress: locationData.fullAddress,
            coordinates: locationData.coordinates || null
        });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 5) {
            setError("You can upload up to 5 images");
            return;
        }

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isValidType = file.type.startsWith("image/");
            const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
            if (!isValidType) setError(`${file.name} is not an image file`);
            if (!isValidSize) setError(`${file.name} exceeds 5MB limit`);
            return isValidType && isValidSize;
        });

        if (validFiles.length > 0) {
            setPreviewUrls(prev => [
                ...prev,
                ...validFiles.map(f => URL.createObjectURL(f))
            ]);
            setImages(prev => [...prev, ...validFiles]);
            setError("");
        }
    };

    const removeImage = (index: number) => {
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            setError("Please enter a checkpoint title");
            return false;
        }
        if (!formData.province) {
            setError("Please select a province");
            return false;
        }
        if (!formData.municipality) {
            setError("Please select a municipality/city");
            return false;
        }
        if (!formData.barangay) {
            setError("Please select a barangay");
            return false;
        }
        if (!formData.street.trim()) {
            setError("Please enter a street or landmark");
            return false;
        }
        if (!formData.coordinates) {
            setError("Please select a location on the map or use GPS");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await checkpointService.createCheckpoint(
                {
                    title: formData.title,
                    province: formData.province.label,
                    municipality: formData.municipality.label,
                    barangay: formData.barangay.label,
                    street: formData.street,
                    fullAddress: formData.fullAddress,
                    latitude: formData.coordinates!.lat,
                    longitude: formData.coordinates!.lng
                },
                images.length > 0 ? images : undefined
            );

            setShowSuccess(true);
            setError("");

            // Reset form
            setFormData({
                title: "",
                province: null,
                municipality: null,
                barangay: null,
                street: "",
                fullAddress: "",
                coordinates: null
            });
            setImages([]);
            setPreviewUrls([]);

            // Navigate back to checkpoints after 2 seconds
            setTimeout(() => {
                setShowSuccess(false);
                navigate("/checkpoint");
            }, 2000);
        } catch (err) {
            console.error("Submit error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to submit checkpoint report"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const radarLocation = formData.province
        ? {
              province: formData.province?.label || "",
              municipality: formData.municipality?.label || "",
              barangay: formData.barangay?.label || "",
              street: formData.street || "",
              fullAddress: formData.fullAddress || ""
          }
        : null;

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
                <Link
                    to="/checkpoint"
                    className="text-gray-400 hover:text-primary transition-colors"
                >
                    Checkpoints
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-500" />
                <span className="text-white font-medium">Report</span>
            </nav>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {showSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                            <h3 className="text-green-400 font-semibold">
                                Reported Successfully!
                            </h3>
                            <p className="text-green-300/80 text-sm">
                                Your checkpoint has been submitted and will be
                                visible to other users.
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
                        <LocationSearch
                            onChange={handleLocationChange}
                            initialData={{
                                title: formData.title,
                                province: formData.province || undefined,
                                municipality:
                                    formData.municipality || undefined,
                                barangay: formData.barangay || undefined,
                                street: formData.street,
                                coordinates: formData.coordinates || undefined
                            }}
                        />

                        {/* Image Upload */}
                        <div>
                            <label className="block text-white font-medium mb-2">
                                Photos{" "}
                                <span className="text-gray-400 text-sm font-normal">
                                    (Optional, max 5)
                                </span>
                            </label>
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                    disabled={isSubmitting}
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <Image className="w-6 h-6 text-gray-400" />
                                    <span className="text-gray-400 text-sm">
                                        Click to upload
                                    </span>
                                    <span className="text-gray-500 text-xs">
                                        PNG, JPG up to 5 MB each
                                    </span>
                                </label>
                            </div>

                            {previewUrls.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {previewUrls.map((url, i) => (
                                        <div key={i} className="relative group">
                                            <img
                                                src={url}
                                                alt={`Preview ${i + 1}`}
                                                className="w-16 h-16 object-cover rounded-lg border border-white/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute -top-2 -right-2 p-0.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                disabled={isSubmitting}
                                            >
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
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                variant="primary"
                                icon={
                                    isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )
                                }
                                className="rounded-full"
                                disabled={isSubmitting || !formData.fullAddress}
                            >
                                {isSubmitting
                                    ? "Submitting..."
                                    : "Submit Report"}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right – Map + Info */}
                <div className="space-y-4">
                    {/* Map Preview */}
                    <div className="bg-secondary/30 rounded-xl border border-white/10 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-semibold text-sm">
                                Location Preview
                            </h3>
                            {radarLocation?.fullAddress && (
                                <span className="text-xs text-gray-400 truncate max-w-[200px]">
                                    {radarLocation.fullAddress}
                                </span>
                            )}
                        </div>
                        <MiniMapRadar
                            location={radarLocation}
                            coordinates={formData.coordinates}
                        />
                    </div>

                    {/* Active Duration Info */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 rounded-xl border border-white/10">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Clock className="w-4 h-4 text-gray-300" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-medium">
                                Active for 5 hours
                            </p>
                            <p className="text-gray-400 text-xs">
                                Checkpoint expires automatically after 5 hours
                            </p>
                        </div>
                    </div>

                    {/* Reporting Tips */}
                    <div className="bg-secondary/30 rounded-xl border border-white/10 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                            <Info className="w-4 h-4 text-gray-400" />
                            <h3 className="text-white font-semibold text-sm">
                                Reporting Tips
                            </h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            <div className="flex items-start gap-3 px-4 py-3">
                                <Crosshair className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">
                                    Use the GPS button for the most accurate pin
                                    on the map
                                </p>
                            </div>
                            <div className="flex items-start gap-3 px-4 py-3">
                                <Image className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">
                                    Add clear photos showing the checkpoint
                                    location
                                </p>
                            </div>
                            <div className="flex items-start gap-3 px-4 py-3">
                                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <p className="text-gray-300 text-sm">
                                    Only report checkpoints you personally
                                    observed
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="flex items-start gap-3 px-4 py-3.5 bg-red-500/10 rounded-xl border border-red-500/20">
                        <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-300 text-sm font-medium mb-0.5">
                                Community Reports Only
                            </p>
                            <p className="text-red-300/70 text-sm">
                                Reports may not always be accurate. Drive safely
                                and responsibly. False or misleading reports may
                                result in account penalties.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportCheckpoint;
