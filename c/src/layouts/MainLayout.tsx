// src/layouts/MainLayout.tsx
import { Link, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import { LogIn, AlertTriangle } from "lucide-react";
import logo from "@/assets/images/logo.png";

const MainLayout = () => {
    const currentYear = new Date().getFullYear();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 0);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-bgColor">
            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? "bg-secondary border-b border-white/10"
                        : "bg-transparent"
                }`}
            >
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link
                        to="/"
                        className="flex items-center gap-2 font-logo text-primary"
                    >
                        <img src={logo} alt="DAKOP Logo" className="w-8 h-8" />
                        <span className="text-3xl font-bold">DAKOP</span>
                    </Link>

                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            icon={<LogIn className="w-4 h-4" />}
                        >
                            Sign In
                        </Button>
                        <Button
                            variant="primary"
                            icon={<AlertTriangle className="w-4 h-4" />}
                        >
                            Report
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-16">
                <Outlet />
            </main>

            <footer className="border-t border-white/10 py-6 mt-auto">
                <div className="container mx-auto px-4 text-center text-gray-400">
                    <p>
                        © {currentYear} Developed by Nordev. All rights
                        reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
