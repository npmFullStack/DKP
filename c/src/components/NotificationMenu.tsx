// src/components/NotificationMenu.tsx
import { useState, useEffect, useRef } from "react";
import { Bell, AlertTriangle, Clock, CheckCircle, X } from "lucide-react";
import { Link } from "react-router-dom";

interface Notification {
    id: string;
    type: "new_checkpoint" | "checkpoint_expired" | "route_update" | "community_alert";
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    checkpointId?: string;
}

interface NotificationMenuProps {
    onNotificationClick?: (notification: Notification) => void;
}

const NotificationMenu = ({ onNotificationClick }: NotificationMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: "1",
            type: "new_checkpoint",
            title: "New Checkpoint Reported",
            message: "Active checkpoint reported on Commonwealth Ave, Quezon City",
            timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
            read: false,
            checkpointId: "cp_123"
        },
        {
            id: "2",
            type: "route_update",
            title: "Alternative Route Found",
            message: "Avoid EDSA traffic - take C5 instead",
            timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
            read: false
        },
        {
            id: "3",
            type: "checkpoint_expired",
            title: "Checkpoint Expired",
            message: "Checkpoint at MacArthur Highway has been cleared",
            timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
            read: true
        },
        {
            id: "4",
            type: "community_alert",
            title: "Community Alert",
            message: "Heavy police presence reported near SM North EDSA",
            timestamp: new Date(Date.now() - 5 * 3600000), // 5 hours ago
            read: true
        }
    ]);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        setNotifications(prev =>
            prev.map(n =>
                n.id === notification.id ? { ...n, read: true } : n
            )
        );
        
        if (onNotificationClick) {
            onNotificationClick(notification);
        }
        
        setIsOpen(false);
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const clearAll = () => {
        setNotifications([]);
        setIsOpen(false);
    };

    const getNotificationIcon = (type: Notification["type"]) => {
        switch (type) {
            case "new_checkpoint":
                return <AlertTriangle className="w-4 h-4 text-red-400" />;
            case "checkpoint_expired":
                return <CheckCircle className="w-4 h-4 text-green-400" />;
            case "route_update":
                return <Clock className="w-4 h-4 text-blue-400" />;
            case "community_alert":
                return <Bell className="w-4 h-4 text-orange-400" />;
            default:
                return <Bell className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hr ago`;
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    };

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-80 md:w-96 bg-secondary/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <h3 className="text-white font-semibold">Notifications</h3>
                        <div className="flex gap-2">
                            {notifications.length > 0 && (
                                <>
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-xs text-gray-400 hover:text-primary transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                    <span className="text-gray-600">•</span>
                                    <button
                                        onClick={clearAll}
                                        className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                <Bell className="w-8 h-8 text-gray-600 mb-2" />
                                <p className="text-gray-400 text-sm">No notifications yet</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    When you get alerts, they'll appear here
                                </p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${
                                        !notification.read ? "bg-primary/5" : ""
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        {/* Icon */}
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-white text-sm font-medium">
                                                    {notification.title}
                                                </p>
                                                <span className="text-xs text-gray-500 flex-shrink-0">
                                                    {getTimeAgo(notification.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            
                                            {/* Action link for new checkpoint */}
                                            {notification.type === "new_checkpoint" && notification.checkpointId && (
                                                <Link
                                                    to={`/checkpoint/${notification.checkpointId}`}
                                                    className="text-primary text-xs mt-2 inline-block hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    View checkpoint →
                                                </Link>
                                            )}
                                        </div>
                                        
                                        {/* Unread indicator */}
                                        {!notification.read && (
                                            <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                            <Link
                                to="/notifications"
                                className="block text-center text-xs text-gray-400 hover:text-primary transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationMenu;