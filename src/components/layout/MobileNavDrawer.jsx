import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import BiText from "@/components/common/BiText";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import { UI } from "@/i18n/strings";

/**
 * ============================================================================
 * Mobile Navigation Drawer
 * ============================================================================
 *
 * The signed-in navigation, for screens too narrow to seat the sidebar.
 *
 * MainLayout hides the sidebar below lg, and it is the only navigation the
 * authenticated shell has - PublicNav belongs to the public layout. So on a
 * phone or a tablet there was no route to File a Report, My Tasks, Manage
 * Users or anything else: the sole way out was the breadcrumb, which leads
 * back to the public site. This panel restores those links without changing
 * a single menu entry.
 *
 * The same Sidebar component is rendered inside, deliberately. Duplicating
 * the menu into a second, mobile-shaped list would mean every future entry
 * has to be added twice, and one of the two would eventually be forgotten.
 *
 * Escape, the scroll lock and the focus trap come from useModalBehaviour,
 * the same hook the confirmation and upload dialogs use.
 * ============================================================================
 */

export default function MobileNavDrawer({ open, onClose, menuItems }) {

    const location = useLocation();

    // Escape to close, page frozen behind, focus moved in and handed back
    const panelRef = useModalBehaviour(open, onClose);

    /*
      Close on navigation.

      Every entry in the panel is a link, so without this the drawer would
      still be covering the page the reader just asked for.

      Keyed on the full path, not on a click handler, so it also covers a
      redirect fired by the page itself.
    */
    useEffect(() => {
        if (open) {
            onClose();
        }
        // Deliberately keyed on location alone: adding `open` would close
        // the drawer the instant it opened.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, location.search]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">

            {/*
              Backdrop. Dismisses on click, and is hidden from assistive
              technology - the close button below is the announced way out.
            */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
                aria-hidden="true"
            />

            {/*
              The panel itself. Slides against the left edge, matching the
              side the sidebar sits on at wider widths, and stops short of
              the right edge so the page behind stays visible as a hint
              that this is a layer rather than a new screen.
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
                        <BiText {...UI.sidebar.services} primaryOnly />
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

                {/*
                  The unchanged sidebar. Its fixed w-72 is released here so
                  it fills the panel instead of overflowing it on the
                  narrowest phones.
                */}
                <div className="flex flex-1 [&>aside]:w-full">
                    <Sidebar menuItems={menuItems} />
                </div>
            </div>
        </div>
    );
}
