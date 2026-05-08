// src/layouts/DashboardLayout.tsx
import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    LayoutDashboard,
    Users,
    Settings,
    LogOut
} from "lucide-react";
import logo from "@/assets/images/logo.png";

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
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

    const navItems = [
        { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/users", icon: Users, label: "Users" },
        { path: "/settings", icon: Settings, label: "Settings" }
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="flex items-center justify-center gap-1 py-3 border-b border-white/10">
                <img src={logo} alt="DAKOP Logo" className="w-8 h-8" />
                <span className="text-3xl font-heading text-primary">
                    DAKOP
                </span>
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
                                            ? "bg-primary text-white shadow-lg"
                                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => console.log("Logout")}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );

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
                className={`fixed top-0 left-0 h-full w-64 bg-secondary/95 backdrop-blur-sm border-r border-white/10 z-50 transition-transform duration-300 ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div
                className={`transition-all duration-300 ${
                    !isMobile && isSidebarOpen ? "ml-64" : "ml-0"
                }`}
            >
                {/* Header */}
                <header className="sticky top-0 z-30 bg-secondary/80 backdrop-blur-sm border-b border-white/10">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Left section with burger icon and logo */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                                aria-label="Toggle Menu"
                            >
                                {isSidebarOpen && isMobile ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>

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

                        {/* Right section - can add user menu, notifications, etc. */}
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <span className="text-primary font-semibold">
                                    JD
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
        </div>
    );
};

export default DashboardLayout;
