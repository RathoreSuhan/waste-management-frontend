import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

/**
 * ============================================================================
 * Protected Route
 * ============================================================================
 *
 * Allows access only to logged-in users.
 *
 * If user is not logged in:
 *      Redirect -> /login
 *
 * Otherwise:
 *      Render child page.
 *
 * ============================================================================
 */

export default function ProtectedRoute() {

    // Authentication information
    const { isAuthenticated, loading } = useAuth();

    // Wait until AuthContext restores session
    if (loading) {

        return <h2 className="text-center mt-20">Loading...</h2>;

    }

    // User not logged in
    if (!isAuthenticated) {

        return <Navigate to="/login" replace />;

    }

    // User logged in
    return <Outlet />;
}