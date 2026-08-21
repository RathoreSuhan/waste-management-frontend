/**
 * ==========================================================
 * Returns the dashboard path based on user role.
 * ==========================================================
 */

export function getDashboardPath(role) {

    switch (role) {

        case "ROLE_ADMIN":
            return "/admin/dashboard";

        // A municipal officer is a civic authority, not a platform admin:
        // their desk is their own corporation's approval workspace.
        case "ROLE_MUNICIPAL_OFFICER":
            return "/municipal/dashboard";

        case "ROLE_CLEANER":
            return "/cleaner/dashboard";

        case "ROLE_CITIZEN":
            return "/citizen/dashboard";

        default:
            return "/";
    }

}