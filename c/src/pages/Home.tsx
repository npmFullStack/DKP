// src/pages/Home.tsx
import { useState } from "react";
import Button from "@/components/Button";
import { Link } from "react-router-dom";
import CheckPointMap from "@/components/CheckPointMap";
import CheckpointDetail from "@/components/CheckpointDetail";
import heroBg from "@/assets/images/heroBg.png";
import {
    Shield,
    Map,
    Route,
    Users,
    AlertTriangle,
    Navigation,
    Check,
    X
} from "lucide-react";

// Features data based on README
const features = [
    {
        icon: <Map className="w-6 h-6" />,
        title: "Interactive Map",
        description: "Real-time checkpoint locations"
    },
    {
        icon: <AlertTriangle className="w-6 h-6" />,
        title: "Add Checkpoints",
        description: 'Mark new "dakop" spots'
    },
    {
        icon: <Route className="w-6 h-6" />,
        title: "Alternative Routes",
        description: "Bypass checkpoints safely"
    },
    {
        icon: <Shield className="w-6 h-6" />,
        title: "User Auth",
        description: "Sign up to contribute"
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Community Powered",
        description: "Accurate real-time data"
    },
    {
        icon: <Navigation className="w-6 h-6" />,
        title: "Smart Navigation",
        description: "Avoid trouble spots"
    }
];

// Checkpoints data for the right side
const checkpointFeatures = [
    {
        text: "Active checkpoints across Luzon, Visayas, Mindanao",
        icon: <Check className="w-4 h-4 text-primary" />
    },
    {
        text: "24/7 community reporting system",
        icon: <Check className="w-4 h-4 text-primary" />
    },
    {
        text: "Real-time status updates from riders",
        icon: <Check className="w-4 h-4 text-primary" />
    },
    {
        text: 'Alternative routes to avoid "dakop" operations',
        icon: <Check className="w-4 h-4 text-primary" />
    }
];

// Import the CheckpointData type (you should export it from CheckPointMap or define it in a shared types file)
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
    comments: Array<{
        id: number;
        user: string;
        text: string;
        timestamp: string;
        avatar: string;
    }>;
}

const Home = () => {
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<CheckpointData | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleCheckpointSelect = (checkpoint: CheckpointData) => {
        setSelectedCheckpoint(checkpoint);
        setIsDetailOpen(true);
    };

    const handleCloseDetail = () => {
        setIsDetailOpen(false);
        setSelectedCheckpoint(null);
    };

    return (
        <div>
            {/* Hero Section */}
            <section
                className="min-h-screen flex items-center justify-center px-4 relative -mt-16"
                style={{
                    backgroundImage: `url(${heroBg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat"
                }}
            >
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/80" />

                <div className="text-center max-w-4xl mx-auto relative z-10">
                    <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 text-white">
                        Avoid <span className="text-primary">"DAKOP"</span>{" "}
                        Operations
                    </h1>
                    <p className="text-gray-200 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                        Community-powered checkpoint alerts and alternative
                        routes for motorcyclists and vehicle drivers in the
                        Philippines.
                    </p>
                    <div className="flex gap-4 justify-center flex-wrap">
                        <Link to="/map">
                            <Button
                                variant="primary"
                                className="rounded-full"
                                icon={<Map className="w-4 h-4" />}
                            >
                                View Map
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="rounded-full"
                            icon={<AlertTriangle className="w-4 h-4" />}
                        >
                            Report Checkpoint
                        </Button>
                    </div>
                </div>
            </section>

            {/* Map & Checkpoints Section */}
            <section className="py-20 px-4 relative">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div>
                            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
                                Real-Time{" "}
                                <span className="text-primary">
                                    Checkpoint Alerts
                                </span>
                            </h2>
                            <p className="text-gray-300 text-lg mb-6">
                                View active "dakop" checkpoints reported by
                                fellow riders across the Philippines. Help the
                                community stay safe by reporting new checkpoints
                                you encounter.
                            </p>
                            <div className="space-y-3">
                                {checkpointFeatures.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3"
                                    >
                                        {feature.icon}
                                        <span className="text-gray-300">
                                            {feature.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <CheckPointMap onCheckpointSelect={handleCheckpointSelect} />
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section - Simplified */}
            <section className="py-20 px-4 bg-secondary">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-white">
                            About <span className="text-primary">DAKOP</span>
                        </h2>
                        <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-bgColor rounded-2xl p-8 border border-white/10 hover:border-primary/30 transition-all duration-300">
                            <h3 className="font-heading text-2xl font-bold mb-4 text-white">
                                What is{" "}
                                <span className="text-primary">DAKOP?</span>
                            </h3>
                            <p className="text-gray-300 text-lg leading-relaxed">
                                A community platform that helps riders avoid
                                checkpoints by sharing real-time locations and
                                alternative routes.
                            </p>
                        </div>

                        <div className="bg-bgColor rounded-2xl p-8 border border-white/10 hover:border-primary/30 transition-all duration-300">
                            <h3 className="font-heading text-2xl font-bold mb-4 text-white">
                                How it{" "}
                                <span className="text-primary">Works</span>
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <Check className="w-5 h-5 text-primary" />
                                    Real-time community reports
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <Check className="w-5 h-5 text-primary" />
                                    Alternative route suggestions
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <Check className="w-5 h-5 text-primary" />
                                    Safe navigation for all riders
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center group">
                                <div className="bg-bgColor rounded-xl p-4 border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-300">
                                    <div className="text-primary mb-2 flex justify-center">
                                        {feature.icon}
                                    </div>
                                    <h4 className="text-white text-sm font-semibold">
                                        {feature.title}
                                    </h4>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CheckpointDetail Sidebar */}
            <CheckpointDetail
                checkpoint={selectedCheckpoint}
                isOpen={isDetailOpen}
                onClose={handleCloseDetail}
            />
        </div>
    );
};

export default Home;