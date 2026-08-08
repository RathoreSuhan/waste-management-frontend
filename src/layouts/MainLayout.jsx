import { Outlet, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FilePlus2,
    History,
    Globe2,
    ClipboardList,
    Users,
    Trophy,
    CheckSquare,
    Brush,
    Search,
    Award,
} from "lucide-react";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import Sidebar from "@/components/layout/Sidebar";
import useAuth from "@/hooks/useAuth";

/**
 * ============================================================================
 * Main Layout
 * ============================================================================
 *
 * Shared shell for all authenticated pages.
 *
 * Structure:
 *   SiteHeader    - utility strip, accent rule, masthead
 *   Breadcrumbs   - position in the site hierarchy
 *   Sidebar       - role-based navigation
 *   Outlet        - the current page
 *   SiteFooter    - link columns and ownership lines
 *
 * Note: page headings live inside each page, not here. The old Topbar
 * printed the title a second time, so every page showed its heading twice.
 * ============================================================================
 */

export default function MainLayout() {

    // Current user, used to pick the navigation set
    const { user } = useAuth();

    // Current path, used to build the breadcrumb trail
    const location = useLocation();

    // Navigation differs per role. Icons are components, not emoji.
    const menuItems =
        user?.role === "ROLE_ADMIN"
            ? [
                { to: "/admin/dashboard", label: "Overview", labelHi: "अवलोकन", icon: LayoutDashboard },
                { to: "/admin/requests", label: "Requests", labelHi: "अनुरोध", icon: ClipboardList },
                { to: "/admin/users", label: "Users", labelHi: "उपयोगकर्ता", icon: Users },
                { to: "/reports", label: "All Reports", icon: Globe2 },
            ]
            : user?.role === "ROLE_CLEANER"
                ? [
                    { to: "/cleaner/dashboard", label: "Overview", labelHi: "अवलोकन", icon: Brush },
                    { to: "/cleaner/available", label: "Available Tasks", labelHi: "उपलब्ध कार्य", icon: Search },
                    { to: "/cleaner/tasks", label: "My Tasks", labelHi: "मेरे कार्य", icon: CheckSquare },
                    { to: "/cleaner/rewards", label: "My Rewards", labelHi: "मेरे पुरस्कार", icon: Award },
                    { to: "/reports", label: "All Reports", icon: Globe2 },
                    { to: "/cleaner/leaderboard", label: "Leaderboard", icon: Trophy },
                ]
                : [
                    { to: "/citizen/dashboard", label: "Overview", labelHi: "अवलोकन", icon: LayoutDashboard },
                    { to: "/citizen/report", label: "File a Report", labelHi: "रिपोर्ट दर्ज", icon: FilePlus2 },
                    { to: "/citizen/history", label: "My Reports", labelHi: "मेरी रिपोर्ट", icon: History },
                    { to: "/reports", label: "Public Reports", labelHi: "सार्वजनिक", icon: Globe2 },
                ];

    // Breadcrumb trail per route. Only the trail lives here, not the page title.
    const breadcrumbMap = {
        "/admin/dashboard": [{ label: "Admin Dashboard" }],
        "/cleaner/dashboard": [{ label: "Cleaner Dashboard" }],
        "/cleaner/available": [
            { label: "Cleaner Dashboard", to: "/cleaner/dashboard" },
            { label: "Available Tasks" },
        ],
        "/cleaner/tasks": [
            { label: "Cleaner Dashboard", to: "/cleaner/dashboard" },
            { label: "My Tasks" },
        ],
        "/cleaner/rewards": [
            { label: "Cleaner Dashboard", to: "/cleaner/dashboard" },
            { label: "My Rewards" },
        ],
        "/citizen/dashboard": [{ label: "Citizen Dashboard" }],
        "/citizen/report": [
            { label: "Citizen Dashboard", to: "/citizen/dashboard" },
            { label: "File a Report" },
        ],
        "/citizen/history": [
            { label: "Citizen Dashboard", to: "/citizen/dashboard" },
            { label: "My Reports" },
        ],
        "/reports": [{ label: "Public Reports" }],
    };

    // Detail routes such as /reports/12 are matched by prefix
    const trail =
        breadcrumbMap[location.pathname] ||
        (location.pathname.startsWith("/reports/")
            ? [
                { label: "Public Reports", to: "/reports" },
                { label: "Report Details" },
            ]
            : [{ label: "Dashboard" }]);

    return (
        <div className="flex min-h-screen flex-col bg-paper">

            {/* Shared masthead */}
            <SiteHeader />

            {/* Position within the site */}
            <Breadcrumbs trail={trail} />

            {/* Sidebar plus page content */}
            <div className="mx-auto flex w-full max-w-7xl flex-1 items-stretch">

                {/* Hidden on small screens where a sidebar would crowd the content */}
                <div className="hidden lg:flex">
                    <Sidebar menuItems={menuItems} />
                </div>

                {/* Target of the header's skip link */}
                <main id="main-content" className="min-w-0 flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

            {/* Footer with the ownership disclaimer */}
            <SiteFooter />
        </div>
    );
}
