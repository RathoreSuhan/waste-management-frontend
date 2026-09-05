import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { onSessionExpired, recordSessionExpiryNotice } from "@/api/sessionExpiry";
import useAuth from "@/hooks/useAuth";

/**
 * ============================================================================
 * Session Expiry Watcher
 * ============================================================================
 *
 * Ends the session in the application when the backend stops accepting it,
 * and sends the visitor to sign in again.
 *
 * A token expires quietly. Nothing happens on the screen at the moment it
 * lapses - the next request simply comes back refused. Until this existed the
 * Axios interceptor emptied localStorage and stopped there, so React went on
 * holding the old session: the utility strip still named the role and offered
 * Sign Out, the navigation still offered My Dashboard, and the page itself
 * showed a bare error. The visitor was told to log in again by a page that
 * still insisted they were logged in.
 *
 * Two things are needed to close that gap, and neither can be done by the
 * interceptor. Clearing the session means React state, which needs the auth
 * context; leaving the dead page means the router. So the interceptor
 * announces the rejection (see api/sessionExpiry) and this listens.
 *
 * Mounted beside the route table rather than inside it, for the same reason as
 * ScrollManager: the session can lapse on any page, so the listener has to
 * outlive every navigation instead of being remounted by each one.
 *
 * Behaviour only - there is nothing to draw. Once the session is cleared the
 * existing guards do the rest: ProtectedRoute turns away what is now a guest,
 * and the public navigation shows Login and Register in place of the account
 * controls.
 * ============================================================================
 */

export default function SessionExpiryWatcher() {

    const navigate = useNavigate();

    const location = useLocation();

    const { logout } = useAuth();

    useEffect(() => {

        /*
          onSessionExpired hands back its own unsubscribe, which is exactly
          what an effect cleanup wants - returning it directly also covers
          React 19 StrictMode's double mount in development.
        */
        return onSessionExpired(() => {

            /*
              The one place the session actually ends: this clears the auth
              context and, with it, any unsubmitted proposal draft - work that
              belongs to the person whose session just lapsed and must not be
              waiting for whoever signs in next on this device.
            */
            logout();

            /*
              Left for the sign-in form: why it is being shown, and where the
              visitor was.

              After logout, not before: logout drops any earlier note of its
              own, so that a deliberate sign-out is never explained as an
              expiry - recording first would hand this note to that same clear.
              Nothing has rendered in between, because clearing the session
              only schedules an update.

              Not passed as router state. On a protected page ProtectedRoute
              reacts to the cleared session and redirects as well, and its
              navigation carries no state - so the state was arriving stripped
              on exactly the pages where the explanation matters most.
            */
            recordSessionExpiryNotice({
                from: location.pathname + location.search,
            });

            /*
              Already on the sign-in or registration form, so there is nothing
              to move away from. Navigating would only replace the page with
              itself and discard whatever the visitor had typed.
            */
            if (location.pathname === "/login" || location.pathname === "/register") {
                return;
            }

            /*
              For the pages no guard will move them off: everything public is
              readable signed out, so a lapsed session sitting on a public
              page would otherwise stay there reading an error.

              replace, not push - the page behind them is one the server has
              stopped answering for, so Back should reach the page before it
              rather than return to a dead end.
            */
            navigate("/login", { replace: true });
        });
    }, [logout, navigate, location.pathname, location.search]);

    return null;
}
