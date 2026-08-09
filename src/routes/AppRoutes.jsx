import {
    Routes,
    Route,
} from "react-router-dom";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import PublicLayout from "@/layouts/PublicLayout";


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
import EnvironmentPage from "@/pages/public/EnvironmentPage";

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

// Admin Portal Pages (Phase 12)
import UserManagementPage from "@/pages/admin/UserManagementPage";
import UserDetailsPage from "@/pages/admin/UserDetailsPage";
import ReportManagementPage from "@/pages/admin/ReportManagementPage";

// Municipal Corporation Pages (Phase 5)
import MunicipalCorporationsPage from "@/pages/admin/MunicipalCorporationsPage";
import CreateMunicipalCorporationPage from "@/pages/admin/CreateMunicipalCorporationPage";
import EditMunicipalCorporationPage from "@/pages/admin/EditMunicipalCorporationPage";

/**
 * Defines all routes for the application.
 * BrowserRouter is wrapped in main.jsx, only Routes should be here.
 */
export default function AppRoutes() {

    return (

        <Routes>
            {/*
              ================================================================
              Public pages - no login required
              ================================================================

              Everything the community produces is readable without an
              account: the reports themselves, the engagement ranking, the
              completed cleanups and the cleaner rankings. The matching
              backend endpoints are permitAll for GET.

              Taking part - filing a report, commenting, replying, rating
              urgency - still needs an account. Those controls prompt for
              login at the point of use rather than hiding the page.
            */}
            <Route element={<PublicLayout />}>

                {/* Landing page */}
                <Route path="/" element={<HomePage />} />

                {/* Reports, newest first */}
                <Route path="/reports" element={<AllReportsPage />} />

                {/*
                  Declared before /reports/:id so the intent is obvious.
                  Router v6 ranks a static segment above a dynamic one
                  regardless of order, but relying on that silently
                  would make "trending" look like a report id.
                */}
                <Route path="/reports/trending" element={<TrendingReportsPage />} />

                {/* A single report, with its discussion */}
                <Route path="/reports/:id" element={<ReportDetailPage />} />

                {/* Completed cleanups, before and after */}
                <Route path="/success-stories" element={<SuccessStoriesPage />} />
                <Route
                    path="/success-stories/:reportId"
                    element={<SuccessStoryDetailPage />}
                />

                {/*
                  Cleaner rankings. A signed-in cleaner additionally sees
                  their own standing, which the page requests separately.
                */}
                <Route path="/leaderboard" element={<LeaderboardPage />} />

                {/*
                  Waste guidance - segregation, the three R's, the pledge.
                  Editorial rather than data-driven, so it makes no API
                  calls and is readable signed out.
                */}
                <Route path="/environment" element={<EnvironmentPage />} />
            </Route>



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

                    {/*
                      Admin-only pages.

                      Every page here maps to a backend endpoint restricted
                      to ROLE_ADMIN, so the whole block sits behind a single
                      guard rather than repeating it per route.
                    */}
                    <Route element={<RoleRoute allowedRole="ROLE_ADMIN" />}>

                        <Route path="/admin/dashboard" element={<AdminDashboard />} />

                        {/* User administration (Phase 12) */}
                        <Route path="/admin/users" element={<UserManagementPage />} />
                        <Route path="/admin/users/:id" element={<UserDetailsPage />} />

                        {/* Report administration (Phase 12) */}
                        <Route path="/admin/reports" element={<ReportManagementPage />} />

                        {/*
                          Municipal corporations (Phase 5).
                          "new" is declared before the edit route for the
                          same reason as /reports/trending above - so the
                          intent is readable rather than left to ranking.
                        */}
                        <Route
                            path="/admin/municipal-corporations"
                            element={<MunicipalCorporationsPage />}
                        />
                        <Route
                            path="/admin/municipal-corporations/new"
                            element={<CreateMunicipalCorporationPage />}
                        />
                        <Route
                            path="/admin/municipal-corporations/edit/:id"
                            element={<EditMunicipalCorporationPage />}
                        />
                    </Route>

                    {/*
                      The four community pages, reached from the sidebar.

                      Same components as the public block above, mounted a
                      second time under /app. A signed-in user following
                      "Trending" from the sidebar stays inside the shell,
                      with their navigation still beside them, instead of
                      being dropped onto the public site mid-task.

                      Not a duplicate implementation: one component each,
                      rendered in two surroundings. MainLayout marks these
                      as in-app, and the pages adjust their heading and
                      internal links accordingly.

                      No RoleRoute here - this is the material every role
                      can read, so it sits directly under the login guard.
                    */}
                    <Route path="/app/reports" element={<AllReportsPage />} />
                    <Route
                        path="/app/reports/trending"
                        element={<TrendingReportsPage />}
                    />
                    <Route path="/app/reports/:id" element={<ReportDetailPage />} />

                    <Route
                        path="/app/success-stories"
                        element={<SuccessStoriesPage />}
                    />
                    <Route
                        path="/app/success-stories/:reportId"
                        element={<SuccessStoryDetailPage />}
                    />

                    <Route path="/app/leaderboard" element={<LeaderboardPage />} />

                    {/*
                      Same page inside the signed-in shell, so a reader who
                      arrives from the sidebar keeps the sidebar.
                    */}
                    <Route path="/app/environment" element={<EnvironmentPage />} />
                </Route>

            </Route>

            {/* 404 fallback for undefined routes */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}