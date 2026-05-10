// src/pages/Settings.tsx
import { useState } from "react";
import { Bell, Shield, Eye, EyeOff, Save, ArrowLeft } from "lucide-react";

const Settings = () => {
    const [activeTab, setActiveTab] = useState<"general" | "account">(
        "general"
    );
    const [notifications, setNotifications] = useState({
        newCheckpoint: true,
        checkpointExpired: false
    });

    // Account edit mode state
    const [isEditingPassword, setIsEditingPassword] = useState(false);

    // Account form state
    const [username, setUsername] = useState("johndoe");
    const [email, setEmail] = useState("john.doe@example.com");

    // Change Password Form State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggle = (setting: keyof typeof notifications) => {
        setNotifications(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const handleChangePasswordClick = () => {
        setIsEditingPassword(true);
        // Reset form state
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccess("");
    };

    const handleBackToAccount = () => {
        setIsEditingPassword(false);
        // Reset form state
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
        setPasswordSuccess("");
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!currentPassword) {
            setPasswordError("Current password is required");
            setPasswordSuccess("");
            return;
        }
        if (!newPassword) {
            setPasswordError("New password is required");
            setPasswordSuccess("");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters");
            setPasswordSuccess("");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match");
            setPasswordSuccess("");
            return;
        }

        setPasswordError("");
        setIsUpdating(true);

        // Simulate API call
        setTimeout(() => {
            setIsUpdating(false);
            setPasswordSuccess("Password changed successfully!");
            // Don't reset form fields on success
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            // Clear success message after 3 seconds
            setTimeout(() => setPasswordSuccess(""), 3000);
        }, 1000);
    };

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        // Simulate API call
        setTimeout(() => {
            setIsUpdating(false);
            setPasswordSuccess("Account information saved successfully!");
            setTimeout(() => setPasswordSuccess(""), 3000);
        }, 1000);
    };

    // Render Account Info view (default)
    const renderAccountInfo = () => (
        <div className="divide-y divide-white/10">
            {/* Account Section Header */}
            <div className="px-6 py-4 bg-white/5">
                <h2 className="text-white font-semibold">
                    Account Information
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    Manage your personal information and account settings
                </p>
            </div>

            {/* Username */}
            <div className="px-6 py-4">
                <label className="block text-white font-medium mb-2">
                    Username
                </label>
                <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                />
                <p className="text-gray-400 text-xs mt-1">
                    This is your public display name
                </p>
            </div>

            {/* Email */}
            <div className="px-6 py-4">
                <label className="block text-white font-medium mb-2">
                    Email Address
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                />
                <p className="text-gray-400 text-xs mt-1">
                    Used for account recovery and notifications
                </p>
            </div>

            {/* Save Account Changes Button */}
            <div className="px-6 py-4 flex items-center justify-between">
                <button
                    onClick={handleChangePasswordClick}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Change Password</span>
                </button>

                <button
                    onClick={handleSaveAccount}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    <span className="text-sm font-medium">
                        {isUpdating ? "Saving..." : "Save Changes"}
                    </span>
                </button>
            </div>

            {/* Success Message */}
            {passwordSuccess && !isEditingPassword && (
                <div className="mx-6 mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-400 text-sm">{passwordSuccess}</p>
                </div>
            )}
        </div>
    );

    // Render Change Password view (when Change Password is clicked)
    const renderChangePassword = () => (
        <div className="divide-y divide-white/10">
            {/* Header with Back Button */}
            <div className="px-6 py-4 bg-white/5">
                <button
                    onClick={handleBackToAccount}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Account</span>
                </button>
                <div className="flex items-center">
  <h2 className="text-white font-semibold">
                        Change Password
                    </h2>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                    Update your password to keep your account secure
                </p>
            </div>

            {/* Password Form */}
            <div className="px-6 py-4">
                <form onSubmit={handleSavePassword} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-white font-medium mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={e =>
                                    setCurrentPassword(e.target.value)
                                }
                                className="w-full px-4 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                                placeholder="Enter your current password"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowCurrentPassword(!showCurrentPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showCurrentPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-white font-medium mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 pr-10 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary"
                                placeholder="Enter new password (min. 6 characters)"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowNewPassword(!showNewPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showNewPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label className="block text-white font-medium mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={e =>
                                    setConfirmPassword(e.target.value)
                                }
                                className={`w-full px-4 py-2 pr-10 bg-white/5 border rounded-lg text-white focus:outline-none focus:border-primary ${
                                    passwordError && !confirmPassword
                                        ? "border-red-500"
                                        : "border-white/10"
                                }`}
                                placeholder="Confirm your new password"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {passwordError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-red-400 text-sm">
                                {passwordError}
                            </p>
                        </div>
                    )}

                    {/* Success Message */}
                    {passwordSuccess && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <p className="text-green-400 text-sm">
                                {passwordSuccess}
                            </p>
                        </div>
                    )}

                    {/* Save Changes Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isUpdating}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>
                                {isUpdating ? "Saving..." : "Save Changes"}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Settings
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                    Manage your account preferences and notification settings.
                </p>
            </div>

            {/* Tabs - Only show when not in password edit mode */}
            {!isEditingPassword && (
                <div className="border-b border-white/10">
                    <div className="flex gap-6">
                        <button
                            onClick={() => setActiveTab("general")}
                            className={`pb-3 text-sm font-medium transition-colors relative ${
                                activeTab === "general"
                                    ? "text-primary"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            General
                            {activeTab === "general" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("account")}
                            className={`pb-3 text-sm font-medium transition-colors relative ${
                                activeTab === "account"
                                    ? "text-primary"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Account
                            {activeTab === "account" && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Content */}
            <div className="bg-secondary/30 rounded-xl border border-white/10 overflow-hidden">
                {!isEditingPassword && activeTab === "general" && (
                    <div className="divide-y divide-white/10">
                        {/* Notification Section Header */}
                        <div className="px-6 py-4 bg-white/5">
                            <h2 className="text-white font-semibold">
                                Notifications
                            </h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Choose what alerts you want to receive
                            </p>
                        </div>

                        {/* Notify me when a new checkpoint is active */}
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">
                                    Notify me when a new checkpoint is active
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Get real-time alerts when new checkpoints
                                    are reported in your area
                                </p>
                            </div>
                            <button
                                onClick={() => handleToggle("newCheckpoint")}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notifications.newCheckpoint
                                        ? "bg-primary"
                                        : "bg-white/20"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notifications.newCheckpoint
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>

                        {/* Checkpoint expired notification */}
                        <div className="px-6 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-white font-medium">
                                    Notify me when a checkpoint expires
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Get notified when reported checkpoints are
                                    no longer active
                                </p>
                            </div>
                            <button
                                onClick={() =>
                                    handleToggle("checkpointExpired")
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    notifications.checkpointExpired
                                        ? "bg-primary"
                                        : "bg-white/20"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        notifications.checkpointExpired
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}

                {!isEditingPassword &&
                    activeTab === "account" &&
                    renderAccountInfo()}

                {isEditingPassword && renderChangePassword()}
            </div>
        </div>
    );
};

export default Settings;
