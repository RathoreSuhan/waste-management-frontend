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
import LayoutModeContext, {
    APP_LAYOUT,
} from "@/context/layoutModeContextInstance";
import { UI } from "@/i18n/strings";

/*
  The four community pages are addressed under /app in the menus below, so
  they open inside this shell with the sidebar still beside them instead of
  throwing the reader out to the public site mid-task. Same page components
  serve both - see layoutModeContextInstance.
*/
const COMMUNITY_ITEMS = [
    /*
      end: true because /app/reports/trending also begins with /app/reports.
      NavLink matches by prefix, so without it both entries highlight at once.
    */
    { to: "/app/reports", ...UI.sidebar.allReports, icon: Globe2, end: true },
    { to: "/app/reports/trending", ...UI.nav.trending, icon: TrendingUp },
    { to: "/app/success-stories", ...UI.nav.successStories, icon: Sparkles },
    { to: "/app/leaderboard", ...UI.nav.leaderboard, icon: Trophy },
];

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

    /*
      Navigation differs per role. Icons are components, not emoji, and
      labels are spread in as { en, hi } pairs so the sidebar can render
      either language as the primary.
    */
    const menuItems =
        user?.role === "ROLE_ADMIN"
            ? [
                { to: "/admin/dashboard", ...UI.sidebar.overview, icon: LayoutDashboard },

                /*
                  Points at the report administration screen. The earlier
                  /admin/requests entry had no route behind it, so it fell
                  through to the 404 page.
                */
                { to: "/admin/reports", ...UI.sidebar.manageReports, icon: ClipboardList },

                { to: "/admin/users", ...UI.sidebar.manageUsers, icon: Users },

                {
                    to: "/admin/municipal-corporations",
                    ...UI.sidebar.municipalBodies,
                    icon: Building2,
                    // "new" and "edit" are children, so exact matching is not wanted here
                },

                ...COMMUNITY_ITEMS,
            ]
            : user?.role === "ROLE_CLEANER"
                ? [
                    { to: "/cleaner/dashboard", ...UI.sidebar.overview, icon: Brush },
                    { to: "/cleaner/available", ...UI.sidebar.availableTasks, icon: Search },
                    { to: "/cleaner/tasks", ...UI.sidebar.myTasks, icon: CheckSquare },
                    { to: "/cleaner/rewards", ...UI.sidebar.myRewards, icon: Award },

                    /*
                      One leaderboard for everyone, shown inside the shell.
                      There is no separate cleaner ranking; the earlier
                      /cleaner/leaderboard path had no route at all.
                    */
                    ...COMMUNITY_ITEMS,
                ]
                : [
                    { to: "/citizen/dashboard", ...UI.sidebar.overview, icon: LayoutDashboard },
                    { to: "/citizen/report", ...UI.nav.fileReport, icon: FilePlus2 },
                    { to: "/citizen/history", ...UI.sidebar.myReports, icon: History },

                    ...COMMUNITY_ITEMS,
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

        /*
          Community pages as reached from inside the shell. Their trails
          stay within /app so the crumbs lead back to in-shell pages
          rather than the public site.
        */
        "/app/reports": [{ label: "Public Reports" }],

        /*
          Needed as an exact entry: the prefix test below would otherwise
          treat /app/reports/trending as a report detail page.
        */
        "/app/reports/trending": [
            { label: "Public Reports", to: "/app/reports" },
            { label: "Trending Reports" },
        ],
        "/app/success-stories": [{ label: "Success Stories" }],
        "/app/leaderboard": [{ label: "Cleaner Leaderboard" }],
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
            prefix: "/app/success-stories/",
            trail: [
                { label: "Success Stories", to: "/app/success-stories" },
                { label: "Cleanup Record" },
            ],
        },
        {
            prefix: "/app/reports/",
            trail: [
                { label: "Public Reports", to: "/app/reports" },
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
                    {/*
                      Tells the shared pages they are inside the signed-in
                      shell, so they render a compact heading instead of a
                      full-bleed band and keep their links under /app.
                    */}
                    <LayoutModeContext.Provider value={APP_LAYOUT}>
                        <Outlet />
                    </LayoutModeContext.Provider>
                </main>
            </div>

            {/* Footer with the ownership disclaimer */}
            <SiteFooter />
        </div>
    );
}
