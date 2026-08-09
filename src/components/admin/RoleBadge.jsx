import {
    ROLE_BADGE_META,
    DEFAULT_ROLE_BADGE_META,
} from "@/constants/adminConstants";

/**
 * ==========================================================
 * RoleBadge
 * ----------------------------------------------------------
 * Designation marker used in the user register.
 *
 * Shows the formal label ("Sanitation Officer"), never the
 * raw ROLE_ enum the backend sends.
 * ==========================================================
 */

export default function RoleBadge({ role }) {

    // Unknown codes still render, as a neutral marker
    const meta = ROLE_BADGE_META[role] || DEFAULT_ROLE_BADGE_META;

    return (
        <span
            className={`inline-flex items-center rounded-gov px-2 py-0.5 text-[11px] font-semibold tracking-wide ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}
