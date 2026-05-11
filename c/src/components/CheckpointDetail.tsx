// src/components/CheckpointDetail.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    X,
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Clock,
    MapPin,
    Flag,
    Send,
    AlertCircle,
    CheckCircle
} from "lucide-react";
import { checkpointService } from "@/services/checkpointService";
import { useAuth } from "@/contexts/AuthContext";

interface Comment {
    id: number;
    user: string;
    text: string;
    timestamp: string;
    avatar: string;
}

export interface CheckpointDetailData {
    id?: string;
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
    comments: Comment[];
    reported_by?: string;
}

interface CheckpointDetailProps {
    checkpoint: CheckpointDetailData | null;
    isOpen: boolean;
    onClose: () => void;
    variant?: "sidebar" | "inline";
    onCheckpointUpdate?: () => void;
}

const CheckpointDetail = ({
    checkpoint,
    isOpen,
    onClose,
    variant = "sidebar",
    onCheckpointUpdate
}: CheckpointDetailProps) => {
    const { user, isAuthenticated } = useAuth();
    const [likes, setLikes] = useState(checkpoint?.likes || 0);
    const [dislikes, setDislikes] = useState(checkpoint?.dislikes || 0);
    const [userLiked, setUserLiked] = useState(false);
    const [userDisliked, setUserDisliked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<Comment[]>(checkpoint?.comments || []);
    const [loadingReaction, setLoadingReaction] = useState(false);
    const [loadingComment, setLoadingComment] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    // Fetch user's reaction on mount
    useEffect(() => {
        if (checkpoint?.id && isAuthenticated) {
            fetchUserReaction();
        }
    }, [checkpoint?.id, isAuthenticated]);

    // Update local state when checkpoint changes
    useEffect(() => {
        if (checkpoint) {
            setLikes(checkpoint.likes);
            setDislikes(checkpoint.dislikes);
            setComments(checkpoint.comments);
        }
    }, [checkpoint]);

    const fetchUserReaction = async () => {
        if (!checkpoint?.id) return;
        try {
            const reaction = await checkpointService.getUserReaction(checkpoint.id);
            if (reaction.reaction === 'like') {
                setUserLiked(true);
                setUserDisliked(false);
            } else if (reaction.reaction === 'dislike') {
                setUserLiked(false);
                setUserDisliked(true);
            } else {
                setUserLiked(false);
                setUserDisliked(false);
            }
        } catch (err) {
            console.error('Failed to fetch user reaction:', err);
        }
    };

    const handleLike = async () => {
        if (!checkpoint?.id || loadingReaction || !isAuthenticated) return;
        setLoadingReaction(true);
        try {
            const result = await checkpointService.addReaction(checkpoint.id, 'like');
            if (result.reaction === 'like') {
                if (!userLiked) {
                    setLikes(likes + 1);
                    if (userDisliked) {
                        setDislikes(dislikes - 1);
                        setUserDisliked(false);
                    }
                }
                setUserLiked(true);
            } else if (result.reaction === null) {
                setLikes(likes - 1);
                setUserLiked(false);
            }
        } catch (err) {
            console.error('Failed to add reaction:', err);
        } finally {
            setLoadingReaction(false);
        }
    };

    const handleDislike = async () => {
        if (!checkpoint?.id || loadingReaction || !isAuthenticated) return;
        setLoadingReaction(true);
        try {
            const result = await checkpointService.addReaction(checkpoint.id, 'dislike');
            if (result.reaction === 'dislike') {
                if (!userDisliked) {
                    setDislikes(dislikes + 1);
                    if (userLiked) {
                        setLikes(likes - 1);
                        setUserLiked(false);
                    }
                }
                setUserDisliked(true);
            } else if (result.reaction === null) {
                setDislikes(dislikes - 1);
                setUserDisliked(false);
            }
        } catch (err) {
            console.error('Failed to add reaction:', err);
        } finally {
            setLoadingReaction(false);
        }
    };

    const handleAddComment = async () => {
        if (!checkpoint?.id || !newComment.trim() || loadingComment || !isAuthenticated) return;
        setLoadingComment(true);
        try {
            const comment = await checkpointService.addComment(checkpoint.id, newComment.trim());
            const newCommentObj: Comment = {
                id: comment.id,
                user: comment.username,
                text: comment.content,
                timestamp: comment.created_at,
                avatar: comment.avatar || `https://i.pravatar.cc/150?u=${comment.user_id}`
            };
            setComments([newCommentObj, ...comments]);
            setNewComment("");
        } catch (err) {
            console.error('Failed to add comment:', err);
        } finally {
            setLoadingComment(false);
        }
    };

    const handleReport = async () => {
        if (!checkpoint?.id || !reportReason.trim() || reporting || !isAuthenticated) return;
        setReporting(true);
        setReportError(null);
        try {
            await checkpointService.reportCheckpoint(checkpoint.id, reportReason.trim());
            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportSuccess(false);
                setReportReason("");
            }, 2000);
            if (onCheckpointUpdate) onCheckpointUpdate();
        } catch (err: any) {
            console.error('Failed to report checkpoint:', err);
            setReportError(err.message || 'Failed to report checkpoint');
        } finally {
            setReporting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    };

    // Check if current user is the reporter
    const isReporter = user?.id === checkpoint?.reported_by;

    // Render content (shared between sidebar and inline)
    const renderContent = () => (
        <>
            {/* Image Section with Badge */}
            <div className="relative">
                <img
                    src={checkpoint?.image}
                    alt={checkpoint?.title}
                    className="w-full h-64 object-cover"
                    onError={e => {
                        (e.target as HTMLImageElement).src =
                            "https://via.placeholder.com/800x400?text=No+Image";
                    }}
                />
                {/* Checkpoint Badge - Top Right */}
                <div className="absolute top-4 right-4">
                    <div
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full 
                            ${checkpoint?.status === "active" ? "bg-red-500" : "bg-orange-500"}
                            shadow-lg
                        `}
                    >
                        <Flag className="w-4 h-4 text-white" />
                        <span className="text-white font-semibold text-sm">
                            {checkpoint?.status === "active"
                                ? "ACTIVE CHECKPOINT"
                                : "REPORTED CHECKPOINT"}
                        </span>
                    </div>
                </div>
                {/* Report button - only show if not reporter and authenticated */}
                {checkpoint?.status === "active" && !isReporter && isAuthenticated && (
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white text-sm transition-colors shadow-lg"
                    >
                        <Flag className="w-4 h-4" />
                        Report
                    </button>
                )}
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {checkpoint?.title}
                    </h2>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-gray-300 mb-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                            {checkpoint?.address}
                        </span>
                    </div>

                    {/* Time Reported */}
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>
                            Reported{" "}
                            {formatTimeAgo(checkpoint?.timeReported || "")}
                        </span>
                    </div>
                </div>

                {/* Uploader Info */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <img
                        src={checkpoint?.uploader.avatar}
                        alt={checkpoint?.uploader.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={e => {
                            (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150";
                        }}
                    />
                    <div>
                        <p className="text-white font-medium">
                            Reported by
                        </p>
                        <p className="text-gray-300 text-sm">
                            {checkpoint?.uploader.name}
                            {isReporter && <span className="ml-2 text-xs text-primary">(You)</span>}
                        </p>
                    </div>
                </div>

                {/* Likes and Dislikes */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLike}
                        disabled={loadingReaction || !isAuthenticated}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                            userLiked
                                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                                : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                    >
                        <ThumbsUp className="w-5 h-5" />
                        <span className="font-semibold">{likes}</span>
                    </button>
                    <button
                        onClick={handleDislike}
                        disabled={loadingReaction || !isAuthenticated}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                            userDisliked
                                ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                : "bg-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                    >
                        <ThumbsDown className="w-5 h-5" />
                        <span className="font-semibold">
                            {dislikes}
                        </span>
                    </button>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-white">
                            Comments ({comments.length})
                        </h3>
                    </div>

                    {/* Add Comment - only if logged in */}
                    {isAuthenticated ? (
                        <div className="flex gap-3">
                            <img
                                src={user?.avatar || "https://i.pravatar.cc/150"}
                                alt="Your avatar"
                                className="w-8 h-8 rounded-full object-cover"
                                onError={e => {
                                    (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150";
                                }}
                            />
                            <div className="flex-1 relative">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Write a comment..."
                                    className="w-full px-3 py-2 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                                    rows={2}
                                    disabled={loadingComment}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!newComment.trim() || loadingComment}
                                    className="absolute right-1 bottom-3 p-2 text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-3 text-gray-400 text-sm bg-white/5 rounded-lg">
                            <Link to="/login" className="text-primary hover:underline">Login</Link> to join the discussion
                        </div>
                    )}

                    {/* Comments List */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {comments.map(comment => (
                            <div
                                key={comment.id}
                                className="flex gap-3 p-3 bg-white/5 rounded-lg"
                            >
                                <img
                                    src={comment.avatar}
                                    alt={comment.user}
                                    className="w-8 h-8 rounded-full object-cover"
                                    onError={e => {
                                        (e.target as HTMLImageElement).src = "https://i.pravatar.cc/150";
                                    }}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white text-sm">
                                            {comment.user}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatTimeAgo(comment.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                        {comment.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {comments.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No comments yet. Be the first to share!
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-secondary border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
                        {reportSuccess ? (
                            <div className="text-center py-4">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-xl font-semibold text-white mb-2">Report Submitted</h3>
                                <p className="text-gray-400">Thank you for helping keep the community safe.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-white">Report Checkpoint</h3>
                                    <button
                                        onClick={() => {
                                            setShowReportModal(false);
                                            setReportError(null);
                                            setReportReason("");
                                        }}
                                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                                <p className="text-gray-300 text-sm mb-4">
                                    Why are you reporting this checkpoint?
                                </p>
                                <textarea
                                    value={reportReason}
                                    onChange={e => setReportReason(e.target.value)}
                                    placeholder="Please provide a reason..."
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                                    rows={4}
                                />
                                {reportError && (
                                    <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {reportError}
                                    </p>
                                )}
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            setShowReportModal(false);
                                            setReportError(null);
                                            setReportReason("");
                                        }}
                                        className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        disabled={!reportReason.trim() || reporting}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                        {reporting ? "Submitting..." : "Submit Report"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );

    if (!checkpoint) return null;

    // Inline variant - used in ViewMap, fills container completely
    if (variant === "inline") {
        return (
            <div className="relative w-full h-full bg-secondary/95 backdrop-blur-xl overflow-y-auto rounded-xl">
                {/* Close button inside the card */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>
                {renderContent()}
            </div>
        );
    }

    // Sidebar variant - original sliding sidebar behavior
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    fixed top-0 right-0 h-full w-full max-w-[480px] bg-secondary/95 backdrop-blur-xl 
                    shadow-2xl z-[2001] transform transition-transform duration-300 ease-out
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                    border-l border-white/10
                `}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* Scrollable content */}
                <div className="h-full overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </>
    );
};

export default CheckpointDetail;