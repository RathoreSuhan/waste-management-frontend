import {
    Routes,
    Route,
} from "react-router-dom";

// Layout
import MainLayout from "@/layouts/MainLayout";

// Route Guards
import PublicRoute from "@/routes/PublicRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RoleRoute from "@/routes/RoleRoute";

// Public Pages
import HomePage from "@/pages/public/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NotFoundPage from "@/pages/common/NotFoundPage";

// Public Feed Pages (Phase 10)
import SuccessStoriesPage from "@/pages/public/SuccessStoriesPage";
import SuccessStoryDetailPage from "@/pages/public/SuccessStoryDetailPage";

// Leaderboard Page (Phase 11)
import LeaderboardPage from "@/pages/public/LeaderboardPage";

// Dashboards
import CitizenDashboard from "@/pages/citizen/CitizenDashboard";
import CleanerDashboard from "@/pages/cleaner/CleanerDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";

// Report Pages (Phase 2)
import CreateReportPage from "@/pages/citizen/CreateReportPage";
import MyReportsPage from "@/pages/citizen/MyReportsPage";
import AllReportsPage from "@/pages/reports/AllReportsPage";
import ReportDetailPage from "@/pages/reports/ReportDetailPage";

// Cleanup Assignment Pages (Phase 8)
import AvailableTasksPage from "@/pages/cleaner/AvailableTasksPage";
import MyTasksPage from "@/pages/cleaner/MyTasksPage";

// Reward Pages (Phase 9)
import MyRewardsPage from "@/pages/cleaner/MyRewardsPage";

// Engagement Analytics Pages (Phase 8)
import TrendingReportsPage from "@/pages/reports/TrendingReportsPage";

/**
 * Defines all routes for the application.
 * BrowserRouter is wrapped in main.jsx, only Routes should be here.
 */
export default function AppRoutes() {

    return (

        <Routes>
            {/* Landing page - open to everyone, logged in or not */}
            <Route path="/" element={<HomePage />} />

            {/*
              Completed cleanups - deliberately outside the login guard.
              The feed endpoints are public, and these pages exist to show
              the programme's results to people without an account.
            */}
            <Route path="/success-stories" element={<SuccessStoriesPage />} />
            <Route
                path="/success-stories/:reportId"
                element={<SuccessStoryDetailPage />}
            />

            {/*
              Cleaner rankings - also outside the guard.
              The three ranking endpoints are permitAll in the backend, and
              public recognition of this work is the point of the module.
              A signed-in cleaner additionally sees their own standing,
              which the page requests separately.
            */}
            <Route path="/leaderboard" element={<LeaderboardPage />} />


            {/* Guest-only pages - logged-in users are sent to their dashboard */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected pages - require login */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    {/* Citizen-only pages */}
                    <Route element={<RoleRoute allowedRole="ROLE_CITIZEN" />}>
                        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />

                        {/* Create a new garbage report */}
                        <Route path="/citizen/report" element={<CreateReportPage />} />

                        {/* Reports created by the logged-in citizen */}
                        <Route path="/citizen/history" element={<MyReportsPage />} />
                    </Route>

                    {/* Cleaner-only pages */}
                    <Route element={<RoleRoute allowedRole="ROLE_CLEANER" />}>
                        <Route path="/cleaner/dashboard" element={<CleanerDashboard />} />

                        {/* Unclaimed cleanup work open to any cleaner */}
                        <Route path="/cleaner/available" element={<AvailableTasksPage />} />

                        {/* Work claimed by the logged-in cleaner */}
                        <Route path="/cleaner/tasks" element={<MyTasksPage />} />

                        {/* Points earned for AI-verified cleanups */}
                        <Route path="/cleaner/rewards" element={<MyRewardsPage />} />
                    </Route>

                    {/* Admin-only dashboard */}
                    <Route element={<RoleRoute allowedRole="ROLE_ADMIN" />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    </Route>

                    {/* Shared report pages - any logged-in role can view them */}
                    <Route path="/reports" element={<AllReportsPage />} />

                    {/*
                      Declared before /reports/:id so the intent is obvious.
                      Router v6 ranks a static segment above a dynamic one
                      regardless of order, but relying on that silently
                      would make "trending" look like a report id.
                    */}
                    <Route path="/reports/trending" element={<TrendingReportsPage />} />

                    <Route path="/reports/:id" element={<ReportDetailPage />} />
                </Route>
            </Route>

            {/* 404 fallback for undefined routes */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}