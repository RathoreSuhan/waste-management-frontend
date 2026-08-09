import { Outlet, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    FilePlus2,
    History,
    Globe2,
    ClipboardList,
    Users,
    Building2,
    Trophy,
    CheckSquare,
    Brush,
    Search,
    Award,
    Sparkles,
    TrendingUp,
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

                /*
                  Points at the report administration screen. The earlier
                  /admin/requests entry had no route behind it, so it fell
                  through to the 404 page.
                */
                { to: "/admin/reports", label: "Manage Reports", labelHi: "शिकायत प्रबंधन", icon: ClipboardList },

                { to: "/admin/users", label: "Manage Users", labelHi: "उपयोगकर्ता", icon: Users },

                {
                    to: "/admin/municipal-corporations",
                    label: "Municipal Bodies",
                    labelHi: "नगर निगम",
                    icon: Building2,
                    // "new" and "edit" are children, so exact matching is not wanted here
                },
                /*
                  end: true is required now that /reports has a child nav
                  item. NavLink matches by prefix by default, so without it
                  both "All Reports" and "Trending" light up together on

                  /reports/trending.
                */
                { to: "/reports", label: "All Reports", icon: Globe2, end: true },
                { to: "/reports/trending", label: "Trending", labelHi: "चर्चित", icon: TrendingUp },

                { to: "/success-stories", label: "Success Stories", labelHi: "सफलता", icon: Sparkles },
                { to: "/leaderboard", label: "Leaderboard", labelHi: "अग्रणी सूची", icon: Trophy },
            ]
            : user?.role === "ROLE_CLEANER"
                ? [
                    { to: "/cleaner/dashboard", label: "Overview", labelHi: "अवलोकन", icon: Brush },
                    { to: "/cleaner/available", label: "Available Tasks", labelHi: "उपलब्ध कार्य", icon: Search },
                    { to: "/cleaner/tasks", label: "My Tasks", labelHi: "मेरे कार्य", icon: CheckSquare },
                    { to: "/cleaner/rewards", label: "My Rewards", labelHi: "मेरे पुरस्कार", icon: Award },
                    { to: "/reports", label: "All Reports", icon: Globe2, end: true },
                    { to: "/reports/trending", label: "Trending", labelHi: "चर्चित", icon: TrendingUp },
                    { to: "/success-stories", label: "Success Stories", labelHi: "सफलता", icon: Sparkles },
                    /*
                      Points at /leaderboard, not /cleaner/leaderboard.
                      The rankings are public and there is one page for
                      everyone; the earlier path had no route behind it.
                    */
                    { to: "/leaderboard", label: "Leaderboard", labelHi: "अग्रणी सूची", icon: Trophy },
                ]
                : [
                    { to: "/citizen/dashboard", label: "Overview", labelHi: "अवलोकन", icon: LayoutDashboard },
                    { to: "/citizen/report", label: "File a Report", labelHi: "रिपोर्ट दर्ज", icon: FilePlus2 },
                    { to: "/citizen/history", label: "My Reports", labelHi: "मेरी रिपोर्ट", icon: History },
                    { to: "/reports", label: "Public Reports", labelHi: "सार्वजनिक", icon: Globe2, end: true },
                    { to: "/reports/trending", label: "Trending", labelHi: "चर्चित", icon: TrendingUp },
                    { to: "/success-stories", label: "Success Stories", labelHi: "सफलता", icon: Sparkles },
                    { to: "/leaderboard", label: "Leaderboard", labelHi: "अग्रणी सूची", icon: Trophy },
                ];

    // Breadcrumb trail per route. Only the trail lives here, not the page title.
    const breadcrumbMap = {
        "/admin/dashboard": [{ label: "Admin Dashboard" }],

        /* Admin portal (Phase 12) */
        "/admin/users": [
            { label: "Admin Dashboard", to: "/admin/dashboard" },
            { label: "User Administration" },
        ],
        "/admin/reports": [
            { label: "Admin Dashboard", to: "/admin/dashboard" },
            { label: "Report Administration" },
        ],

        /* Municipal corporations (Phase 5) */
        "/admin/municipal-corporations": [
            { label: "Admin Dashboard", to: "/admin/dashboard" },
            { label: "Municipal Corporations" },
        ],
        "/admin/municipal-corporations/new": [
            { label: "Admin Dashboard", to: "/admin/dashboard" },
            { label: "Municipal Corporations", to: "/admin/municipal-corporations" },
            { label: "Register Corporation" },
        ],

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

        /*
          Needed as an exact entry: the prefix test below would otherwise
          treat /reports/trending as a report detail page.
        */
        "/reports/trending": [
            { label: "Public Reports", to: "/reports" },
            { label: "Trending Reports" },
        ],
    };

    /*
      Detail routes carry an id in the path, so they cannot be listed
      above and are matched by prefix instead. Ordered most specific
      first, since /admin/users/5 also starts with /admin.
    */
    const prefixTrails = [
        {
            prefix: "/admin/municipal-corporations/edit/",
            trail: [
                { label: "Admin Dashboard", to: "/admin/dashboard" },
                { label: "Municipal Corporations", to: "/admin/municipal-corporations" },
                { label: "Amend Corporation" },
            ],
        },
        {
            prefix: "/admin/users/",
            trail: [
                { label: "Admin Dashboard", to: "/admin/dashboard" },
                { label: "User Administration", to: "/admin/users" },
                { label: "Account Record" },
            ],
        },
        {
            prefix: "/reports/",
            trail: [
                { label: "Public Reports", to: "/reports" },
                { label: "Report Details" },
            ],
        },
    ];

    const trail =
        breadcrumbMap[location.pathname] ||
        prefixTrails.find((entry) =>
            location.pathname.startsWith(entry.prefix)
        )?.trail ||
        [{ label: "Dashboard" }];

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
