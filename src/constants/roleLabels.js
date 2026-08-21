/**
 * ============================================================================
 * Role Labels
 * ============================================================================
 *
 * Converts backend role codes into formal designations for display.
 *
 * The backend Role enum sends ROLE_ADMIN / ROLE_MUNICIPAL_OFFICER /
 * ROLE_CITIZEN / ROLE_CLEANER, which should never be shown to users directly.
 * ============================================================================
 */

export const ROLE_LABELS = {
    ROLE_ADMIN: "Administrator",
    ROLE_MUNICIPAL_OFFICER: "Municipal Officer", // civic authority for one city, not a platform admin
    ROLE_CLEANER: "Sanitation Officer",
    ROLE_CITIZEN: "Citizen",
};

/**
 * Returns the display label for a role code.
 * Falls back to "Citizen" so the UI never renders a raw enum value.
 */
export function getRoleLabel(role) {
    return ROLE_LABELS[role] || "Citizen";
}
