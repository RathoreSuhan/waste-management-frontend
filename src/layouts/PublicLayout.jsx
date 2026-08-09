import { Outlet } from "react-router-dom";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import PublicNav from "@/components/layout/PublicNav";
import LayoutModeContext, {
    PUBLIC_LAYOUT,
} from "@/context/layoutModeContextInstance";

/**
 * ============================================================================
 * Public Layout
 * ============================================================================
 *
 * Shell for pages that are open to everyone: the home page, the trending
 * ranking, individual reports, success stories and the leaderboard.

 *
 * Structure:
 *   SiteHeader - utility strip, accent rule, masthead
 *   PublicNav  - primary navigation plus login / dashboard controls
 *   Outlet     - the current page
 *   SiteFooter - link columns and ownership lines
 *
 * There is deliberately no sidebar here. The sidebar is role-based
 * navigation for someone working through their own tasks, which is not
 * what these pages are for - and half of the entries would point at
 * routes an anonymous visitor cannot open.
 *
 * A signed-in user sees the same page as a visitor, with the extra
 * controls their role permits appearing inside the page itself. Keeping
 * one component per page, rather than a public and private copy, means the
 * two versions cannot drift apart.
 *
 * Four of these pages are also reachable inside the signed-in shell, under
 * /app. They render from the same components; the layout mode below tells
 * them which surroundings they are in.
 * ============================================================================
 */

export default function PublicLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-paper">

            {/* Shared masthead */}
            <SiteHeader />

            {/* Primary navigation */}
            <PublicNav />

            {/*
              Target of the header's skip link.

              Deliberately unconstrained: several of these pages open with a
              full-width heading band, and a max-width wrapper here would cut
              those bands short of the edges. Pages that need a centred
              column apply it themselves.
            */}
            <main id="main-content" className="flex-1">
                {/*
                  Matches the context default, but set explicitly so the
                  two layouts read as a matched pair rather than one of
                  them relying on a default defined elsewhere.
                */}
                <LayoutModeContext.Provider value={PUBLIC_LAYOUT}>
                    <Outlet />
                </LayoutModeContext.Provider>
            </main>


            {/* Footer with the ownership disclaimer */}
            <SiteFooter />
        </div>
    );
}
