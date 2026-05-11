// src/pages/Checkpoint.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X, MapPin, PlusCircle, AlertCircle } from "lucide-react";
import Button from "@/components/Button";
import CheckPointMap from "@/components/CheckPointMap";
import CheckpointDetail from "@/components/CheckpointDetail";
import { checkpointService } from "@/services/checkpointService";
import type { CheckpointData, CheckpointComment } from "@/services/checkpointService";

const Checkpoint = () => {
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointData | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [checkpoints, setCheckpoints] = useState<CheckpointData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch checkpoints on mount
    useEffect(() => {
        fetchCheckpoints();
    }, []);

    const fetchCheckpoints = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await checkpointService.getCheckpoints({ status: 'active', limit: 100 });
            setCheckpoints(response.checkpoints);
        } catch (err) {
            console.error('Failed to fetch checkpoints:', err);
            setError('Failed to load checkpoints. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckpointSelect = (checkpoint: any) => {
        setSelectedCheckpoint(checkpoint);
    };

    const handleCloseDetail = () => {
        setSelectedCheckpoint(null);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    // Convert backend checkpoint data to map-compatible format
    const mapCheckpoints = checkpoints.map(cp => ({
        id: cp.id,
        lat: cp.latitude,
        lng: cp.longitude,
        title: cp.title,
        status: cp.status === 'active' ? 'active' as const : 'reported' as const,
        image: cp.image_urls && cp.image_urls.length > 0 
            ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${cp.image_urls[0]}`
            : 'https://via.placeholder.com/800x400?text=No+Image',
        address: cp.full_address,
        timeReported: cp.created_at || new Date().toISOString(),
        uploader: {
            name: cp.reporter_name || 'Anonymous',
            avatar: cp.reporter_avatar || `https://i.pravatar.cc/150?u=${cp.reported_by}`
        },
        likes: cp.likes,
        dislikes: cp.dislikes,
        reported_by: cp.reported_by,
        comments: cp.comments?.map(comment => ({
            id: comment.id,
            user: comment.username,
            text: comment.content,
            timestamp: comment.created_at,
            avatar: comment.avatar || `https://i.pravatar.cc/150?u=${comment.user_id}`
        })) || []
    }));

    // Filter checkpoints based on search query
    const filteredCheckpoints = searchQuery
        ? mapCheckpoints.filter(
            cp => cp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  cp.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : mapCheckpoints;

    // Find selected checkpoint in filtered list
    const getSelectedCheckpointData = () => {
        if (!selectedCheckpoint) return null;
        const found = filteredCheckpoints.find(cp => cp.id === selectedCheckpoint.id);
        return found || selectedCheckpoint;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Checkpoints</h1>
                        <p className="text-gray-400 text-sm md:text-base">Loading checkpoint locations...</p>
                    </div>
                </div>
                <div className="h-[calc(100vh-200px)] min-h-[600px] bg-secondary/30 rounded-xl border border-white/10 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400">Loading checkpoints...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Checkpoints</h1>
                        <p className="text-gray-400 text-sm md:text-base">View and manage active checkpoint locations across the Philippines.</p>
                    </div>
                    <Link to="/checkpoint/report">
                        <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />} className="rounded-full">
                            Report Checkpoint
                        </Button>
                    </Link>
                </div>
                <div className="h-[calc(100vh-200px)] min-h-[600px] bg-secondary/30 rounded-xl border border-white/10 flex items-center justify-center">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-400">{error}</p>
                        <Button variant="outline" onClick={fetchCheckpoints} className="mt-4">
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

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
                                checkpoint={getSelectedCheckpointData()}
                                isOpen={true}
                                onClose={handleCloseDetail}
                                variant="inline"
                                onCheckpointUpdate={fetchCheckpoints}
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

                        {/* Search suggestions - only show when no results */}
                        {searchQuery && filteredCheckpoints.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-secondary/95 backdrop-blur-md border border-white/10 rounded-xl shadow-xl z-10">
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    No checkpoints found for "{searchQuery}"
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10">
                        <CheckPointMap
                            checkpoints={filteredCheckpoints}
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
                            {searchQuery 
                                ? `${filteredCheckpoints.length} result${filteredCheckpoints.length !== 1 ? 's' : ''} for "${searchQuery}"`
                                : `${checkpoints.length} active checkpoint${checkpoints.length !== 1 ? 's' : ''} • Philippines`
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkpoint;