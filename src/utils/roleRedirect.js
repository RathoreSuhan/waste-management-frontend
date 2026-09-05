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

/**
 * ==========================================================
 * Where somebody goes once they have signed in.
 * ==========================================================
 *
 * Two places decide this, and both fire for the same sign-in: the login form
 * navigates when the call succeeds, and PublicRoute redirects the moment a
 * session appears while an auth page is still on screen. Whichever renders
 * last wins - observed sending people to their dashboard and losing the page
 * they had been reading. The decision lives here so both callers reach the
 * same answer and the race has nothing left to decide.
 *
 * @param {string | undefined | null} from page they were on before signing in
 * @param {string | undefined} role
 */
export function resolvePostLoginPath(from, role) {

    if (isReturnablePath(from)) {
        return from;
    }

    return getDashboardPath(role);
}

/**
 * Whether a remembered origin is somewhere worth returning to.
 *
 * An auth page is refused: a session that lapses while the login form is open
 * records /login as where it happened, and going back there would be a loop.
 *
 * Anything not starting with a single "/" is refused as well. Nothing in the
 * app writes such a value, which is exactly why an unexpected one - "//host",
 * a full URL - should be dropped rather than handed to the router.
 */
function isReturnablePath(path) {

    if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) {
        return false;
    }

    return !/^\/(login|register)([?#]|$)/.test(path);
}