// src/pages/SignUp.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/Button";
import { Eye, EyeOff, User, Lock, UserPlus, Loader2 } from "lucide-react";
import logo from "@/assets/images/logo.png";

const SignUp = () => {
    const navigate = useNavigate();
    const { signup, isLoading, error } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [localPasswordError, setLocalPasswordError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (password !== confirmPassword) {
            setLocalPasswordError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setLocalPasswordError("Password must be at least 6 characters");
            return;
        }

        if (username.length < 3) {
            setLocalPasswordError("Username must be at least 3 characters");
            return;
        }

        setLocalPasswordError("");
        
        try {
            await signup({ username, password });
            navigate("/dashboard");
        } catch (err) {
            // Error is handled by auth context
            console.error("Signup error:", err);
        }
    };

    const displayError = localPasswordError || error;

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
                    <p className="text-gray-400">Join DAKOP to get started</p>
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
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 bg-secondary border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                                placeholder="Choose a username (min. 3 characters)"
                                disabled={isLoading}
                                required
                                minLength={3}
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
                                placeholder="Create a password (min. 6 characters)"
                                disabled={isLoading}
                                required
                                minLength={6}
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

                    {/* Confirm Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className={`w-full pl-10 pr-10 py-2 bg-secondary border rounded-lg focus:outline-none focus:border-primary text-white ${
                                    localPasswordError && localPasswordError.includes("match")
                                        ? "border-red-500"
                                        : "border-white/10"
                                }`}
                                placeholder="Confirm your password"
                                disabled={isLoading}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
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
                                <UserPlus className="w-5 h-5" />
                            )
                        }
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating Account..." : "Sign Up"}
                    </Button>
                </form>

                {/* Sign In Link */}
                <p className="text-center text-gray-400 mt-6">
                    Already have an account?{" "}
                    <Link
                        to="/signin"
                        className="text-primary hover:text-primary/80 transition-colors"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default SignUp;