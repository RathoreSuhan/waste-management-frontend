import {
    ASSIGNMENT_STATUS_META,
    DEFAULT_ASSIGNMENT_STATUS_META,
} from "@/constants/assignmentConstants";

/**
 * ==========================================================
 * Assignment Status Badge
 * ----------------------------------------------------------
 * Shows where a cleanup task sits in its lifecycle:
 *
 *   Open           -> saffron (no proposal received yet)
 *   Proposals Open -> amber   (offers received, site still open to more)
 *   Assigned       -> indigo  (corporation awarded the work)
 *   Claimed      -> slate     (legacy rows from before proposals existed)
 *   In Progress  -> blue
 *   Completed    -> India green
 *
 * Deliberately mirrors StatusBadge so the report status and
 * the assignment status read as the same family of marker.
 * ==========================================================
 */

export default function AssignmentStatusBadge({ status }) {

    // Fall back to a neutral style if the backend adds a new status
    const meta = ASSIGNMENT_STATUS_META[status] || DEFAULT_ASSIGNMENT_STATUS_META;

    return (
        <span
            className={`
                inline-flex items-center gap-1.5
                rounded-gov
                px-2.5 py-1
                text-[11px] font-semibold tracking-wide uppercase
                whitespace-nowrap
                ${meta.className}
            `}
        >
            {/* Colour dot repeats the status without relying on colour alone */}
            <span
                className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`}
                aria-hidden="true"
            />

            {meta.label}
        </span>
    );
}
