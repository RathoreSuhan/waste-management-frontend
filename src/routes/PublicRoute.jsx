import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

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

    const { isAuthenticated, loading } = useAuth();

    if (loading) {

        return <h2 className="text-center mt-20">Loading...</h2>;

    }

    // Already logged in
    if (isAuthenticated) {

        return <Navigate to="/" replace />;

    }

    return <Outlet />;
}