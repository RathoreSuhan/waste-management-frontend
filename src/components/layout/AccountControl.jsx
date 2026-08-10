import { useNavigate } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";

import BiText from "@/components/common/BiText";
import useAuth from "@/hooks/useAuth";
import { getRoleLabel } from "@/constants/roleLabels";
import { UI } from "@/i18n/strings";

/**
 * ============================================================================
 * Account Control
 * ============================================================================
 *
 * Signed-in identity and the sign-out button, shown at the top right of
 * every page.
 *
 * This lives in the masthead utility strip because that strip is the one
 * piece of furniture both layouts render. Sign-out used to sit only at the
 * bottom of the sidebar, which meant it was unreachable on the public pages,
 * on the report detail page, and on any screen below the lg breakpoint where
 * the sidebar is hidden altogether. Being able to leave an account is not
 * something that should depend on which page you happen to be reading.
 *
 * Renders nothing at all for a visitor. The login and register buttons stay
 * in the primary navigation, where someone looking to join expects them, so
 * duplicating them up here would only crowd the strip.
 *
 * The role is named; the email address is not. An address printed across
 * the top of every page is a piece of personal data on display to whoever
 * is standing behind you, and it earns nothing - the person reading it
 * already knows their own address. What they may genuinely need to know
 * is which role they are currently acting as, since a cleaner and an
 * admin can both be signed in from the same machine, and signing out of
 * the wrong one is an easy mistake to make. So the role stays and the
 * address goes.
 * ============================================================================
 */


export default function AccountControl() {

    const { user, logout } = useAuth();

    const navigate = useNavigate();

    // Nothing to show until someone is actually signed in
    if (!user) {
        return null;
    }

    /**
     * End the session and return to the landing page.
     *
     * logout() only clears the session; where that leaves you depends on the
     * page. On a protected route ProtectedRoute redirects to login, but on a
     * public page nothing moves and the only visible change is this control
     * disappearing - which reads as a button that did nothing. Navigating
     * home makes the result unambiguous either way.
     */
    function handleLogout() {
        logout();
        navigate("/");
    }

    return (
        <div className="flex items-center gap-2.5">

            {/*
              Identity, hidden on narrow screens where the strip has no room
              for it. The sign-out button stays regardless - it is the part
              that has to be reachable.

              The role alone, set small and in caps so it reads as a label
              on the sign-out control rather than as a name. The email
              address that used to sit here has been removed; the title
              attribute keeps it available on hover for anyone who does
              need to confirm which account is open.
            */}
            <span
                className="hidden items-center gap-1.5 text-[11px] tracking-[0.1em] text-white/70 uppercase sm:flex"
                title={user.email}
            >
                <UserRound size={12} aria-hidden="true" />
                {getRoleLabel(user.role)}
            </span>


            <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 border border-white/30 px-2 py-0.5 transition hover:bg-white/15"
            >
                <LogOut size={12} aria-hidden="true" />

                {/*
                  Gloss suppressed: this strip is one line tall, and two
                  languages side by side would wrap it onto two.
                */}
                <BiText {...UI.account.signOut} primaryOnly />
            </button>
        </div>
    );
}
