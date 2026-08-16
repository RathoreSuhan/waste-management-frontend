import { lazy, Suspense } from "react";
import {
    Routes,
    Route,
} from "react-router-dom";

// Layouts
import MainLayout from "@/layouts/MainLayout";
import PublicLayout from "@/layouts/PublicLayout";

// Scroll behaviour, applied to every navigation in the project
import ScrollManager from "@/components/layout/ScrollManager";

// Placeholder while a page chunk is on its way
import RouteFallback from "@/components/common/RouteFallback";

// Route Guards
import PublicRoute from "@/routes/PublicRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RoleRoute from "@/routes/RoleRoute";

/*
  ============================================================================
  Page imports
  ============================================================================

  Every page below is loaded on demand rather than bundled into one file.

  Statically imported, the whole site arrived as a single script: a citizen
  filing a report downloaded the entire admin portal, and an admin
  downloaded the cleaner task screens, before either could see anything.
  The build was warning about the resulting chunk size.

  Split this way, each visitor fetches the shell plus the page they asked
  for. Layouts and guards stay static above - they are needed on the very
  first render, so deferring them would only add a second round trip.

  HomePage is the one page kept eager. It is the entry point for most
  visits, and it is what a search engine crawler lands on; making it wait
  on a second request would delay the first paint that matters most.
  ============================================================================
*/

// Landing page - eager, see above
import HomePage from "@/pages/public/HomePage";

// Auth pages
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/auth/RegisterPage"));
const ChangePasswordPage = lazy(() => import("@/pages/account/ChangePasswordPage"));
const NotFoundPage = lazy(() => import("@/pages/common/NotFoundPage"));

// Public Feed Pages (Phase 10)
const SuccessStoriesPage = lazy(() => import("@/pages/public/SuccessStoriesPage"));
const SuccessStoryDetailPage = lazy(() => import("@/pages/public/SuccessStoryDetailPage"));

// Leaderboard Page (Phase 11)
const LeaderboardPage = lazy(() => import("@/pages/public/LeaderboardPage"));
const EnvironmentPage = lazy(() => import("@/pages/public/EnvironmentPage"));
const AboutPage = lazy(() => import("@/pages/public/AboutPage"));

/*
  Terms, privacy and accessibility, as three anchored documents on one
  route. The footer's Policies column links to /policies#terms,
  /policies#privacy and /policies#accessibility.
*/
const PoliciesPage = lazy(() => import("@/pages/public/PoliciesPage"));

// Dashboards
const CitizenDashboard = lazy(() => import("@/pages/citizen/CitizenDashboard"));
const CleanerDashboard = lazy(() => import("@/pages/cleaner/CleanerDashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

// Report Pages (Phase 2)
const CreateReportPage = lazy(() => import("@/pages/citizen/CreateReportPage"));
const MyReportsPage = lazy(() => import("@/pages/citizen/MyReportsPage"));
const AllReportsPage = lazy(() => import("@/pages/reports/AllReportsPage"));
const ReportDetailPage = lazy(() => import("@/pages/reports/ReportDetailPage"));

// Cleanup Assignment Pages (Phase 8)
const AvailableTasksPage = lazy(() => import("@/pages/cleaner/AvailableTasksPage"));
const MyTasksPage = lazy(() => import("@/pages/cleaner/MyTasksPage"));

// Reward Pages (Phase 9)
const MyRewardsPage = lazy(() => import("@/pages/cleaner/MyRewardsPage"));

// Engagement Analytics Pages (Phase 8)
const TrendingReportsPage = lazy(() => import("@/pages/reports/TrendingReportsPage"));

// Admin Portal Pages (Phase 12)
const UserManagementPage = lazy(() => import("@/pages/admin/UserManagementPage"));
const UserDetailsPage = lazy(() => import("@/pages/admin/UserDetailsPage"));
const ReportManagementPage = lazy(() => import("@/pages/admin/ReportManagementPage"));

// Municipal Corporation Pages (Phase 5)
const MunicipalCorporationsPage = lazy(() => import("@/pages/admin/MunicipalCorporationsPage"));
const CreateMunicipalCorporationPage = lazy(() => import("@/pages/admin/CreateMunicipalCorporationPage"));
const EditMunicipalCorporationPage = lazy(() => import("@/pages/admin/EditMunicipalCorporationPage"));

/**
 * Defines all routes for the application.
 * BrowserRouter is wrapped in main.jsx, only Routes should be here.
 */
export default function AppRoutes() {

    return (
        <>
            {/*
              Sits beside the route table rather than inside it, so it is
              mounted once for the life of the app and survives every
              navigation. Inside a <Route> it would unmount and remount
              on each change, losing the record of where each page was
              left - which is the only thing it exists to remember.
            */}
            <ScrollManager />

            {/*
              One boundary around the whole table rather than one per route.
              Only the page being navigated to is ever suspended, so a single
              boundary is enough - and it keeps the fallback consistent
              instead of varying page by page.
            */}
            <Suspense fallback={<RouteFallback />}>
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

                {/*
                  About the platform, and the five stages a report passes.

                  Both footer links under "About the Platform" resolve
                  here - How It Works arrives at #how-it-works, which is
                  the process rail partway down the page.
                */}
                <Route path="/about" element={<AboutPage />} />

                {/*
                  Terms, privacy and accessibility.

                  All three footer links under "Policies" resolve here,
                  each arriving at its own anchor. They share a route
                  because they share a subject, and because a reader
                  checking one of them usually wants a look at the next.
                */}
                <Route path="/policies" element={<PoliciesPage />} />
            </Route>



            {/* Guest-only pages - logged-in users are sent to their dashboard */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Protected pages - require login */}
            <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                    {/* Shared account settings for every authenticated role */}
                    <Route
                        path="/app/change-password"
                        element={<ChangePasswordPage />}
                    />

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

                    {/* Same page inside the signed-in shell, sidebar kept */}
                    <Route path="/app/about" element={<AboutPage />} />

                    {/*
                      The footer is rendered by both shells, so its
                      policy links must resolve in both. Without this a
                      signed-in reader would be thrown out to the public
                      site to read the terms.
                    */}
                    <Route path="/app/policies" element={<PoliciesPage />} />
                </Route>

            </Route>

                {/* 404 fallback for undefined routes */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </Suspense>
        </>
    );
}


