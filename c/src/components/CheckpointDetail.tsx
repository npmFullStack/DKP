// src/components/CheckpointDetail.tsx
import { useState, useEffect } from "react";
import {
    X,
    ThumbsUp,
    ThumbsDown,
    MessageCircle,
    Clock,
    MapPin,
    Flag,
    Send
} from "lucide-react";

interface Comment {
    id: number;
    user: string;
    text: string;
    timestamp: string;
    avatar: string;
}

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
    comments: Comment[];
}

interface CheckpointDetailProps {
    checkpoint: CheckpointData | null;
    isOpen: boolean;
    onClose: () => void;
    variant?: "sidebar" | "inline";
}

const CheckpointDetail = ({
    checkpoint,
    isOpen,
    onClose,
    variant = "sidebar"
}: CheckpointDetailProps) => {
    const [likes, setLikes] = useState(checkpoint?.likes || 0);
    const [dislikes, setDislikes] = useState(checkpoint?.dislikes || 0);
    const [userLiked, setUserLiked] = useState(false);
    const [userDisliked, setUserDisliked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<Comment[]>(
        checkpoint?.comments || []
    );

    useEffect(() => {
        if (checkpoint) {
            setLikes(checkpoint.likes);
            setDislikes(checkpoint.dislikes);
            setComments(checkpoint.comments);
            setUserLiked(false);
            setUserDisliked(false);
        }
    }, [checkpoint]);

    const handleLike = () => {
        if (userLiked) {
            setLikes(likes - 1);
            setUserLiked(false);
        } else {
            setLikes(likes + 1);
            setUserLiked(true);
            if (userDisliked) {
                setDislikes(dislikes - 1);
                setUserDisliked(false);
            }
        }
    };

    const handleDislike = () => {
        if (userDisliked) {
            setDislikes(dislikes - 1);
            setUserDisliked(false);
        } else {
            setDislikes(dislikes + 1);
            setUserDisliked(true);
            if (userLiked) {
                setLikes(likes - 1);
                setUserLiked(false);
            }
        }
    };

    const handleAddComment = () => {
        if (newComment.trim()) {
            const comment: Comment = {
                id: Date.now(),
                user: "Current User",
                text: newComment,
                timestamp: new Date().toISOString(),
                avatar: "https://i.pravatar.cc/150?img=37"
            };
            setComments([...comments, comment]);
            setNewComment("");
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
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

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
                    />
                    <div>
                        <p className="text-white font-medium">
                            Reported by
                        </p>
                        <p className="text-gray-300 text-sm">
                            {checkpoint?.uploader.name}
                        </p>
                    </div>
                </div>

                {/* Likes and Dislikes */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${
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
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${
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

                    {/* Add Comment */}
                    <div className="flex gap-3">
                        <img
                            src="https://i.pravatar.cc/150?img=37"
                            alt="Your avatar"
                            className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 relative">
                            <textarea
                                value={newComment}
                                onChange={e =>
                                    setNewComment(e.target.value)
                                }
                                onKeyPress={handleKeyPress}
                                placeholder="Write a comment..."
                                className="w-full px-3 py-2 pr-12 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                                rows={2}
                            />
                            <button
                                onClick={handleAddComment}
                                className="absolute right-1 bottom-3 p-2 text-primary hover:text-primary/80 transition-colors"
                                disabled={!newComment.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

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
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white text-sm">
                                            {comment.user}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatTimeAgo(
                                                comment.timestamp
                                            )}
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