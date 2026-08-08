import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { getDashboardPath } from "@/utils/roleRedirect";

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

    if (loading) {

        return <h2 className="text-center mt-20">Loading...</h2>;

    }

    // Already logged in - send them to their own dashboard.
    // Redirecting to "/" here would loop, because "/" used to be
    // guarded by this same component.
    if (isAuthenticated) {

        return <Navigate to={getDashboardPath(user?.role)} replace />;

    }

    return <Outlet />;
}