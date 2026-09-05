import { useSyncExternalStore } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import {
    getSessionExpiryNotice,
    subscribeSessionExpiryNotice,
} from "@/api/sessionExpiry";
import { resolvePostLoginPath } from "@/utils/roleRedirect";

/**
 * ============================================================================
 * Public Route
 * ============================================================================
 *
 * Used for Login & Register.
 *
 * Logged-in users should not visit these pages.
 * ============================================================================
 */

export default function PublicRoute() {

    // Session information (user is needed to pick the right dashboard)
    const { isAuthenticated, user, loading } = useAuth();

    // Where they were headed, for a visitor who did not come here by choice
    const location = useLocation();

    /*
      The same note the login form shows. Read here too because this guard can
      be the one that redirects a fresh session away from the form, and it must
      not send somebody to their dashboard when the form was about to return
      them to the page their session lapsed on.
    */
    const sessionNotice = useSyncExternalStore(
        subscribeSessionExpiryNotice,
        getSessionExpiryNotice
    );

    if (loading) {

        return <h2 className="text-center mt-20">Loading...</h2>;

    }

    // Already logged in - back to whatever they were doing, or their own
    // dashboard. Redirecting to "/" here would loop, because "/" used to be
    // guarded by this same component.
    if (isAuthenticated) {

        const from = location.state?.from || sessionNotice?.from;

        return <Navigate to={resolvePostLoginPath(from, user?.role)} replace />;

    }

    return <Outlet />;
}
