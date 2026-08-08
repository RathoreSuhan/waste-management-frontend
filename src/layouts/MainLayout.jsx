import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import useAuth from "@/hooks/useAuth";

/**
 * ============================================================================
 * Main Layout
 * ============================================================================
 *
 * Shared shell for all protected dashboards.
 * It provides a sidebar, topbar, and content area for every role.
 * ============================================================================
 */

export default function MainLayout() {
    // Get current user from auth context
    const { user } = useAuth();
    // Get current page path to customize sidebar and topbar
    const location = useLocation();

    // Define sidebar menu items based on user role
    const menuItems =
        user?.role === "ROLE_ADMIN"
            ? [
                { to: "/admin/dashboard", label: "Overview", icon: "📊" },
                { to: "/admin/requests", label: "Requests", icon: "🧾" },
                { to: "/admin/users", label: "Users", icon: "👥" },
                // Shared report listing page
                { to: "/reports", label: "All Reports", icon: "📈" },
            ]
            : user?.role === "ROLE_CLEANER"
                ? [
                    { to: "/cleaner/dashboard", label: "Overview", icon: "🧹" },
                    { to: "/cleaner/tasks", label: "Assigned Tasks", icon: "✅" },
                    // Cleaners browse reports from the same shared page
                    { to: "/reports", label: "All Reports", icon: "📈" },
                    { to: "/cleaner/leaderboard", label: "Leaderboard", icon: "🏆" },
                ]
                : [
                    { to: "/citizen/dashboard", label: "Overview", icon: "🏠" },
                    // Phase 2 - create a garbage report
                    { to: "/citizen/report", label: "Report Garbage", icon: "🗑️" },
                    // Phase 2 - reports created by this citizen
                    { to: "/citizen/history", label: "My Reports", icon: "🕘" },
                    // Phase 2 - every report on the platform
                    { to: "/reports", label: "Community", icon: "🌍" },
                ];

    // Map page paths to their titles and descriptions
    const pageTitles = {
        "/admin/dashboard": {
            title: "Admin Dashboard",
            subtitle: "Monitor operations, users, and platform health.",
        },
        "/cleaner/dashboard": {
            title: "Cleaner Dashboard",
            subtitle: "Track your tasks and progress efficiently.",
        },
        "/citizen/dashboard": {
            title: "Citizen Dashboard",
            subtitle: "Report waste and stay connected to your community.",
        },
        "/citizen/report": {
            title: "Report Garbage",
            subtitle: "Share a photo and location so cleaners can act quickly.",
        },
        "/citizen/history": {
            title: "My Reports",
            subtitle: "Follow the progress of everything you have reported.",
        },
        "/reports": {
            title: "Community Reports",
            subtitle: "Explore garbage reports submitted across the platform.",
        },
    };

    // Detail pages like /reports/12 share one title
    const reportDetailPage = {
        title: "Report Details",
        subtitle: "Full information about this garbage report.",
    };

    // Resolve the title for the current route
    const currentPage =
        pageTitles[location.pathname] ||
        (location.pathname.startsWith("/reports/") ? reportDetailPage : null) ||
        pageTitles["/citizen/dashboard"];

    return (
        <div className="flex min-h-screen bg-slate-100">
            {/* Left sidebar - navigation menu */}
            <Sidebar menuItems={menuItems} />

            {/* Main content area */}
            <div className="flex-1 p-6 lg:p-8">
                {/* Top bar - page title and user info */}
                <Topbar title={currentPage.title} subtitle={currentPage.subtitle} />

                {/* Current page content (rendered from AppRoutes) */}
                <main className="mt-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}