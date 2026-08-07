/**
 * ==========================================================
 * Returns the dashboard path based on user role.
 * ==========================================================
 */

export function getDashboardPath(role) {

    switch (role) {

        case "ROLE_ADMIN":
            return "/admin/dashboard";

        case "ROLE_CLEANER":
            return "/cleaner/dashboard";

        case "ROLE_CITIZEN":
            return "/citizen/dashboard";

        default:
            return "/";
    }

}