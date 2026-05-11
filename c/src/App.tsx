// src/App.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import MainLayout from "@/layouts/MainLayout";
import AuthLayout from "@/layouts/AuthLayout";
import DashboardLayout from "@/layouts/DashboardLayout";
import Loading from "@/pages/Loading";
import ProtectedRoute from "@/components/ProtectedRoute";

const Home = lazy(() => import("@/pages/Home"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const SignUp = lazy(() => import("@/pages/SignUp"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ViewMap = lazy(() => import("@/pages/ViewMap"));
const Checkpoint = lazy(() => import("@/pages/Checkpoint"));
const ReportCheckpoint = lazy(() => import("@/pages/ReportCheckpoint"));
const Settings = lazy(() => import("@/pages/Settings"));

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Suspense fallback={<Loading />}>
                    <Routes>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<Home />} />
                        </Route>
                        <Route element={<AuthLayout />}>
                            <Route path="/signin" element={<SignIn />} />
                            <Route path="/signup" element={<SignUp />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/checkpoint" element={<Checkpoint />} />
                                <Route path="/checkpoint/report" element={<ReportCheckpoint />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>
                        </Route>
                        <Route path="/map" element={<ViewMap />} />
                    </Routes>
                </Suspense>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;