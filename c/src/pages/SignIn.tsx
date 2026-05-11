// src/pages/SignIn.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/Button";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2 } from "lucide-react";
import logo from "@/assets/images/logo.png";

const SignIn = () => {
    const navigate = useNavigate();
    const { signin, isLoading, error } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");
        
        try {
            await signin({ username, password });
            navigate("/dashboard");
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Sign in failed");
        }
    };

    const displayError = localError || error;

    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-1 mb-4">
                        <img
                            src={logo}
                            alt="DAKOP Logo"
                            className="w-12 h-12"
                        />
                        <span className="text-5xl font-heading text-primary">
                            DAKOP
                        </span>
                    </div>
                    <p className="text-gray-400">
                        Sign in to continue to DAKOP
                    </p>
                </div>

                {/* Error Message */}
                {displayError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-500 text-sm text-center">
                        {displayError}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Username
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                                placeholder="Enter your username"
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                                placeholder="Enter your password"
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="text-right">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full rounded-full"
                        icon={
                            isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <LogIn className="w-5 h-5" />
                            )
                        }
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                </form>

                {/* Sign Up Link */}
                <p className="text-center text-gray-400 mt-6">
                    Don't have an account?{" "}
                    <Link
                        to="/signup"
                        className="text-primary hover:text-primary/80 transition-colors"
                    >
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignIn;