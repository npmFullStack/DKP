// src/pages/Dashboard.tsx
const Dashboard = () => {
    return (
        <div className="rounded-xl bg-secondary p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-secondary/50 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Welcome!
                    </h3>
                    <p className="text-gray-400">
                        You have successfully signed in to your dashboard.
                    </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Statistics
                    </h3>
                    <p className="text-gray-400">
                        View your analytics and metrics here.
                    </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Recent Activity
                    </h3>
                    <p className="text-gray-400">
                        Check your latest activities.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
