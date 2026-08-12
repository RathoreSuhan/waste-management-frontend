import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Home,
    Flame,
    Sparkles,
    Trophy,
    Leaf,
    FilePlus2,
    LayoutDashboard,
    LogIn,
    UserPlus,
    X,
} from "lucide-react";

import BiText from "@/components/common/BiText";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import { UI } from "@/i18n/strings";

/**
 * ============================================================================
 * Public Navigation Drawer
 * ============================================================================
 *
 * The public navigation, for screens too narrow to seat it as a horizontal
 * bar.
 *
 * On a phone the inline bar had two problems, both visible in the reported
 * screenshots. The five browsing links collapsed to bare icons with no
 * labels, so a first-time visitor could not tell Trending from Environment;
 * and the File a Report / Login / Register cluster on the right ran off the
 * edge of the screen, worse still at the A+ text setting, leaving Register
 * clipped or unreachable.
 *
 * A hamburger in the bar opens this panel instead. Every destination gets
 * its full bilingual label and a comfortable touch target, and nothing has
 * to compete for a single row's width. The panel mirrors MobileNavDrawer -
 * the signed-in shell's equivalent - in look and behaviour, so the two
 * layouts feel like one site: the same navy surface, the same slide from
 * the left, the same close affordances.
 *
 * Escape, the scroll lock and the focus trap all come from
 * useModalBehaviour, the hook every other modal layer on the site uses.
 * ============================================================================
 */

// The five browsing links, in the same order as the desktop bar
const NAV_LINKS = [
    { to: "/", icon: Home, label: UI.nav.home },
    { to: "/reports/trending", icon: Flame, label: UI.nav.trending },
    { to: "/success-stories", icon: Sparkles, label: UI.nav.successStories },
    { to: "/leaderboard", icon: Trophy, label: UI.nav.leaderboard },
    { to: "/environment", icon: Leaf, label: UI.nav.environment },
];

export default function PublicNavDrawer({
    open,
    onClose,
    user,
    dashboardPath,
    onFileReport,
}) {

    const location = useLocation();

    // Escape to close, page frozen behind, focus moved in and handed back
    const panelRef = useModalBehaviour(open, onClose);

    /*
      Close on navigation.

      Every link in the panel takes the reader to another page, so without
      this the drawer would still be covering the page they just asked for.
      Keyed on the path rather than a click handler, so a redirect fired by
      the destination itself closes it too.
    */
    useEffect(() => {
        if (open) {
            onClose();
        }
        // Keyed on location alone on purpose: adding `open` would slam the
        // drawer shut the instant it opened.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, location.search]);

    if (!open) return null;

    /**
     * File a Report from inside the panel.
     *
     * The eligibility check and any login prompt live in PublicNav, so this
     * only closes the drawer and hands off. Closing first means the prompt
     * dialog - when one is raised - opens over a clear page rather than over
     * a second layer.
     */
    function handleFileReport() {
        onClose();
        onFileReport();
    }

    return (
        <div className="fixed inset-0 z-50 lg:hidden">

            {/*
              Backdrop. Dismisses on click, and hidden from assistive
              technology - the close button is the announced way out.
            */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/*
              The panel. Slides against the left edge, the same side
              MobileNavDrawer uses, and stops short of the right so the page
              behind stays visible as a hint that this is a layer.
            */}
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label="Site navigation"
                className="absolute inset-y-0 left-0 flex w-[19rem] max-w-[85%] flex-col overflow-y-auto bg-gov-navy shadow-2xl outline-none"
            >
                {/* Close control, pinned above the scrolling menu */}
                <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">

                    <p className="text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">
                        <BiText {...UI.nav.menu} primaryOnly />
                    </p>

                    <button
                        type="button"
                        onClick={onClose}
                        // 40px square: comfortably above the minimum touch target
                        className="-mr-1 flex h-10 w-10 items-center justify-center text-white/80 transition hover:bg-white/10 hover:text-white"
                        aria-label="Close navigation"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                {/* Browsing links */}
                <nav className="flex flex-col py-2">
                    {NAV_LINKS.map(({ to, icon: Icon, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                        >
                            <Icon size={18} aria-hidden="true" />
                            <span className="inline-flex items-center">
                                <BiText
                                    {...label}
                                    glossClassName="text-[11px] text-white/55 opacity-100"
                                />
                            </span>
                        </Link>
                    ))}
                </nav>

                {/* Actions - set apart from the browsing links by a rule */}
                <div className="mt-auto space-y-2 border-t border-white/15 p-4">

                    {/*
                      The reason the site exists, carrying the saffron accent
                      it has in the desktop bar so it reads as the primary
                      action here too.
                    */}
                    <button
                        type="button"
                        onClick={handleFileReport}
                        className="flex w-full items-center justify-center gap-2 rounded-gov border border-saffron bg-saffron px-3 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-saffron/85"
                    >
                        <FilePlus2 size={16} aria-hidden="true" />
                        <BiText {...UI.nav.fileReport} primaryOnly />
                    </button>

                    {user ? (
                        /* Signed in: the one shortcut back to their dashboard */
                        <Link
                            to={dashboardPath}
                            className="flex w-full items-center justify-center gap-2 rounded-gov border border-white/30 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            <LayoutDashboard size={16} aria-hidden="true" />
                            <BiText {...UI.account.myDashboard} primaryOnly />
                        </Link>
                    ) : (
                        /* Guest: login + register, stacked so neither is clipped */
                        <>
                            <Link
                                to="/login"
                                className="flex w-full items-center justify-center gap-2 rounded-gov border border-white/40 bg-transparent px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                <LogIn size={16} aria-hidden="true" />
                                <BiText {...UI.account.login} primaryOnly />
                            </Link>

                            <Link
                                to="/register"
                                className="flex w-full items-center justify-center gap-2 rounded-gov border border-gov-blue bg-gov-blue px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                            >
                                <UserPlus size={16} aria-hidden="true" />
                                <BiText {...UI.account.register} primaryOnly />
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
