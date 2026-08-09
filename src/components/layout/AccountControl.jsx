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
            */}
            <div className="hidden items-center gap-1.5 sm:flex">

                <UserRound size={12} aria-hidden="true" className="text-white/70" />

                {/*
                  Email rather than name: the login response carries only
                  token, email and role. Truncated because a long address
                  would otherwise push the controls off the strip.
                */}
                <span
                    className="max-w-[15rem] truncate text-white/90"
                    title={user.email}
                >
                    {user.email}
                </span>

                {/* Role, so an admin can tell which account they are acting as */}
                <span className="text-white/50">
                    ({getRoleLabel(user.role)})
                </span>
            </div>

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
