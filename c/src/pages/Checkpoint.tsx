// src/pages/Checkpoint.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, MapPin, PlusCircle } from "lucide-react";
import Button from "@/components/Button";
import CheckPointMap from "@/components/CheckPointMap";
import CheckpointDetail from "@/components/CheckpointDetail";

interface CheckpointData {
    lat: number;
    lng: number;
    title: string;
    status: "active" | "reported";
    image: string;
    address: string;
    timeReported: string;
    uploader: { name: string; avatar: string };
    likes: number;
    dislikes: number;
    comments: Array<{
        id: number;
        user: string;
        text: string;
        timestamp: string;
        avatar: string;
    }>;
}

const Checkpoint = () => {
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleCheckpointSelect = (checkpoint: CheckpointData) => {
        setSelectedCheckpoint(checkpoint);
    };

    const handleCloseDetail = () => {
        setSelectedCheckpoint(null);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Checkpoints
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        View and manage active checkpoint locations across the Philippines.
                    </p>
                </div>
                <Link to="/checkpoint/report">
                    <Button
                        variant="primary"
                        icon={<PlusCircle className="w-4 h-4" />}
                        className="rounded-full whitespace-nowrap"
                    >
                        Report Checkpoint
                    </Button>
                </Link>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
                {/* Left Column - Checkpoint Details */}
                <div className="h-full w-full">
                    {selectedCheckpoint ? (
                        <div className="h-full w-full rounded-xl overflow-hidden border border-white/10 bg-secondary/30 backdrop-blur-sm">
                            <CheckpointDetail
                                checkpoint={selectedCheckpoint}
                                isOpen={true}
                                onClose={handleCloseDetail}
                                variant="inline"
                            />
                        </div>
                    ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-center bg-secondary/30 backdrop-blur-sm rounded-xl border border-white/10 p-8">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                <MapPin className="w-10 h-10 text-primary/50" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                No Checkpoint Selected
                            </h3>
                            <p className="text-gray-400 max-w-sm">
                                Click on any{" "}
                                <span className="text-primary font-medium">
                                    red pulsing marker
                                </span>{" "}
                                on the map to view checkpoint details, comments, and community reports.
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span>Active checkpoints are marked with pulsing red dots</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Map with Search */}
                <div className="flex flex-col gap-4 h-full">
                    {/* Search Bar */}
                    <div className={`relative transition-all duration-200 ${isSearchFocused ? "scale-[1.01]" : "scale-100"}`}>
                        <div className="relative">
                            <Search
                                className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-50 duration-200 ${
                                    isSearchFocused ? "text-primary" : "text-white"
                                }`}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                                placeholder="Search checkpoint locations..."
                                className="w-full pl-11 pr-12 py-3 bg-secondary/80 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Search suggestions */}
                        {searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-secondary/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-10 max-h-64 overflow-y-auto">
                                <div className="p-2">
                                    <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10">
                                        Suggested locations
                                    </div>
                                    {["Quezon City", "Manila", "Cebu", "Davao", "Baguio"].map((location) => (
                                        <button
                                            key={location}
                                            onClick={() => setSearchQuery(location)}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <MapPin className="w-3 h-3 text-primary" />
                                            {location}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10">
                        <CheckPointMap
                            onCheckpointSelect={handleCheckpointSelect}
                            searchQuery={searchQuery}
                        />
                    </div>

                    {/* Map Legend */}
                    <div className="flex items-center gap-4 px-3 py-2 bg-secondary/50 rounded-lg border border-white/10 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-gray-300">Active Checkpoint</span>
                        </div>
                        <div className="ml-auto text-gray-400">
                            {searchQuery ? `Filtered by: "${searchQuery}"` : "Showing all active checkpoints"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkpoint;