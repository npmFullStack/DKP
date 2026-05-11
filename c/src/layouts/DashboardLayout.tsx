// src/layouts/DashboardLayout.tsx
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
    Menu,
    X,
    LayoutDashboard,
    MapPin,
    Settings,
    LogOut,
    Bell,
    Sidebar
} from "lucide-react";
import logo from "@/assets/images/logo.png";
import NotificationMenu from "@/components/NotificationMenu";
import WarningModal from "@/components/WarningModal";
import { authService } from "@/services/authService";

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Check authentication on mount
    useEffect(() => {
        if (!authService.isAuthenticated()) {
            navigate('/signin');
        }
    }, [navigate]);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    }, [location, isMobile]);

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        setIsLoggingOut(true);
        
        // Simulate API call delay for better UX
        setTimeout(() => {
            // Perform logout
            authService.logout();
            setIsLoggingOut(false);
            setIsLogoutModalOpen(false);
            // Navigate to signin page
            navigate('/signin');
        }, 500);
    };

    const navItems = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/checkpoint", icon: MapPin, label: "Checkpoints" },
        { path: "/settings", icon: Settings, label: "Settings" }
    ];

    // Get user information
    const user = authService.getUser();
    const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-1">
                    {/* Logo image - only visible when sidebar is open */}
                    {isSidebarOpen && (
                        <img src={logo} alt="DAKOP Logo" className="w-8 h-8" />
                    )}

                    {/* Logo text - only visible when sidebar is open */}
                    {isSidebarOpen && (
                        <span className="text-3xl font-heading text-primary transition-opacity duration-200">
                            DAKOP
                        </span>
                    )}
                </div>

                {/* Sidebar Toggle Button - Only visible on desktop */}
                {!isMobile && (
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                        aria-label="Toggle Sidebar"
                    >
                        <Sidebar className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6">
                <ul className="space-y-2 px-4">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                        isActive
                                            ? "bg-primary text-white "
                                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    } ${!isSidebarOpen && "justify-center"}`}
                                    title={
                                        !isSidebarOpen ? item.label : undefined
                                    }
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 ${
                        !isSidebarOpen && "justify-center"
                    }`}
                    title={!isSidebarOpen ? "Logout" : undefined}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span>Logout</span>}
                </button>
            </div>
        </div>
    );

    // Don't render anything while checking authentication
    if (!authService.isAuthenticated()) {
        return null;
    }

    return (
        <div className="min-h-screen bg-bgColor">
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Desktop: always visible, Mobile: drawer */}
            <aside
                className={`fixed top-0 left-0 h-full bg-secondary z-50 transition-all duration-300 ${
                    isSidebarOpen ? "w-64" : "w-20"
                } ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}`}
            >
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div
                className={`transition-all duration-300 ${
                    !isMobile && isSidebarOpen
                        ? "ml-64"
                        : !isMobile && !isSidebarOpen
                          ? "ml-20"
                          : "ml-0"
                }`}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 bg-secondary">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Left section with burger icon and logo */}
                        <div className="flex items-center gap-3">
                            {/* Mobile menu button */}
                            {isMobile && (
                                <button
                                    onClick={() =>
                                        setIsSidebarOpen(!isSidebarOpen)
                                    }
                                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                                    aria-label="Toggle Menu"
                                >
                                    {isSidebarOpen ? (
                                        <X className="w-6 h-6" />
                                    ) : (
                                        <Menu className="w-6 h-6" />
                                    )}
                                </button>
                            )}

                            {/* Mobile logo (visible when sidebar is closed on mobile) */}
                            {isMobile && !isSidebarOpen && (
                                <div className="flex items-center gap-2">
                                    <img
                                        src={logo}
                                        alt="DAKOP Logo"
                                        className="w-8 h-8"
                                    />
                                    <span className="text-lg font-heading text-primary">
                                        DAKOP
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Right section with notification and user avatar */}
                        <div className="flex items-center gap-4">
                            {/* Notification Bell */}
                            <NotificationMenu />

                            {/* User Avatar - shows first letter of username */}
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-semibold text-sm">
                                    {userInitial}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 bg-bgColor">
                    <Outlet />
                </main>
            </div>

            <WarningModal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="Logout"
                message="Are you sure you want to logout from DAKOP?"
                isLoading={isLoggingOut}
                submitIcon={<LogOut className="w-4 h-4" />}
                submitText="Logout"
            />
        </div>
    );
};

export default DashboardLayout;