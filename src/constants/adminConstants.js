import { ROLE_LABELS } from "@/constants/roleLabels";

/**
 * ============================================================================
 * Admin Portal Constants (Phase 12)
 * ============================================================================
 *
 * Values shared by the administration screens.
 *
 * Role and cleaner-type codes mirror the backend enums exactly, because
 * they are sent back as query parameters and bound to those enums. A
 * friendlier value invented here would fail conversion with 400.
 * ============================================================================
 */

/**
 * Role codes, matching the backend Role enum.
 */
export const ROLES = {
    CITIZEN: "ROLE_CITIZEN",
    CLEANER: "ROLE_CLEANER",
    /* Municipal officers are civic authorities for one corporation only -
       they approve proposals and completions inside their own city and are
       deliberately NOT platform administrators. */
    MUNICIPAL_OFFICER: "ROLE_MUNICIPAL_OFFICER",
    ADMIN: "ROLE_ADMIN",
};

/**
 * Role filter options for the user register.
 *
 * "ALL" is a UI-only value: the service omits the parameter entirely
 * rather than sending it, since the backend has no such role.
 */
export const USER_ROLE_FILTERS = [
    { value: "ALL", label: "All Roles" },
    { value: ROLES.CITIZEN, label: ROLE_LABELS.ROLE_CITIZEN },
    { value: ROLES.CLEANER, label: ROLE_LABELS.ROLE_CLEANER },
    /* Officers are a distinct register entry so an administrator can audit
       who holds municipal approval powers without scanning every account. */
    { value: ROLES.MUNICIPAL_OFFICER, label: ROLE_LABELS.ROLE_MUNICIPAL_OFFICER },
    { value: ROLES.ADMIN, label: ROLE_LABELS.ROLE_ADMIN },
];

/**
 * Badge styling per role, so a register can be scanned by colour.
 *
 * Administrators are marked in navy - the institutional colour - and
 * cleaners in teal, keeping green free to mean "resolved" elsewhere.
 */
export const ROLE_BADGE_META = {
    ROLE_ADMIN: {
        label: ROLE_LABELS.ROLE_ADMIN,
        className: "bg-slate-100 text-gov-navy border border-gov-navy/30",
    },
    ROLE_CLEANER: {
        label: ROLE_LABELS.ROLE_CLEANER,
        className: "bg-cyan-50 text-civic-teal border border-civic-teal/30",
    },
    ROLE_MUNICIPAL_OFFICER: {
        label: ROLE_LABELS.ROLE_MUNICIPAL_OFFICER,
        /* Government blue: authority, but visibly separate from admin navy. */
        className: "bg-blue-50 text-gov-blue border border-gov-blue/40",
    },
    ROLE_CITIZEN: {
        label: ROLE_LABELS.ROLE_CITIZEN,
        className: "bg-blue-50 text-gov-blue border border-blue-300",
    },
};

/**
 * Fallback badge for a role code this build does not recognise.
 */
export const DEFAULT_ROLE_BADGE_META = {
    label: "User",
    className: "bg-slate-50 text-ink-muted border border-rule",
};

/**
 * Display labels for the backend CleanerType enum.
 */
export const CLEANER_TYPE_LABELS = {
    MUNICIPAL: "Municipal Corporation",
    NGO: "NGO / Voluntary Organisation",
    PRIVATE: "Private Agency",
    INDIVIDUAL: "Independent Volunteer",
};

/**
 * Returns the display label for a cleaner type code.
 */
export function getCleanerTypeLabel(cleanerType) {
    if (!cleanerType) {
        return "—";
    }

    return CLEANER_TYPE_LABELS[cleanerType] || cleanerType;
}

/**
 * Whether an account may be promoted to administrator.
 *
 * Only citizens qualify - AdminServiceImpl rejects cleaners and
 * existing administrators - so the control is hidden for everyone else
 * instead of being offered and then refused.
 */
export function canPromote(role) {
    return role === ROLES.CITIZEN;
}

/**
 * Whether an account may be deleted at all.
 *
 * Administrator accounts are protected by the backend and cannot be
 * removed through the application, so the action is not offered.
 *
 * A cleaner who has claimed cleanup work is also refused, but that
 * depends on assignment history the user register does not carry, so
 * it can only be reported after the attempt.
 */
export function canDelete(role) {
    return role === ROLES.CITIZEN || role === ROLES.CLEANER;
}
