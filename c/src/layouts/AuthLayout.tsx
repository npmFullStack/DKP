// src/layouts/AuthLayout.tsx
import { Link, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";

const AuthLayout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-bgColor">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <Link to="/">
                        <Button
                            variant="ghost"
                            icon={<ArrowLeft className="w-4 h-4" />}
                        >
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 pt-20">
                <Outlet />
            </main>
        </div>
    );
};

export default AuthLayout;
