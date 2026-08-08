import { Navigate, Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { getDashboardPath } from "@/utils/roleRedirect";

/**
 * ============================================================================
 * Role Route
 * ============================================================================
 *
 * Allows only a specific role.
 *
 * Example:
 * ROLE_ADMIN
 * ROLE_CLEANER
 * ROLE_CITIZEN
 * ============================================================================
 */

export default function RoleRoute({ allowedRole }) {

    const { user, loading } = useAuth();

    if (loading) {

        return <h2 className="text-center mt-20">Loading...</h2>;

    }

    // Wrong role - send the user to the dashboard they do have access to,
    // instead of dropping them on the public landing page.
    if (!user || user.role !== allowedRole) {

        return <Navigate to={getDashboardPath(user?.role)} replace />;

    }

    return <Outlet />;
}