// src/pages/Dashboard.tsx
import {
    Map,
    AlertTriangle,
    Route,
    Navigation,
    TrendingUp,
    Clock,
    PlusCircle
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Button from "@/components/Button";
import { Link } from "react-router-dom";

const Dashboard = () => {
    // Stats focused on checkpoints and routes
    const stats = [
        {
            icon: AlertTriangle,
            title: "Active Checkpoints",
            number: "47"
        },
        {
            icon: Route,
            title: "Alternative Routes",
            number: "124"
        },
        {
            icon: Navigation,
            title: "Routes Avoided",
            number: "2.3k"
        },
        {
            icon: Clock,
            title: "Today's Reports",
            number: "23"
        }
    ];

    // Recent checkpoint reports
    const recentReports = [
        {
            location: "Commonwealth Ave, Quezon City",
            time: "5 minutes ago",
            status: "active"
        },
        {
            location: "MacArthur Highway, Valenzuela",
            time: "15 minutes ago",
            status: "active"
        },
        {
            location: "EDSA cor. Ayala, Makati",
            time: "32 minutes ago",
            status: "active"
        },
        {
            location: "SLEX Bicutan Exit",
            time: "1 hour ago",
            status: "reported"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Dashboard
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                    Welcome back! Avoid checkpoints with real-time community
                    alerts.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, index) => (
                    <StatCard
                        key={index}
                        icon={stat.icon}
                        title={stat.title}
                        number={stat.number}
                    />
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-secondary/50 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Quick Actions
                    </h3>
                    <div className="space-y-3">
                        <Link to="/map">
                            <Button
                                variant="primary"
                                className="w-full justify-center"
                            >
                                <Map className="w-4 h-4" />
                                View Map
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="w-full justify-center"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            Report Checkpoint
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-center"
                        >
                            <Route className="w-4 h-4" />
                            Find Alternative Route
                        </Button>
                    </div>
                </div>

                {/* Recent Reports */}
                <div className="bg-secondary/50 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Recent Reports
                    </h3>
                    <div className="space-y-3">
                        {recentReports.map((report, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <div>
                                        <p className="text-white text-sm">
                                            {report.location}
                                        </p>
                                        <p className="text-gray-400 text-xs">
                                            {report.time}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        report.status === "active"
                                            ? "bg-red-500/20 text-red-400"
                                            : "bg-orange-500/20 text-orange-400"
                                    }`}
                                >
                                    {report.status === "active"
                                        ? "ACTIVE"
                                        : "REPORTED"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

    </div>
    );
};

export default Dashboard;
