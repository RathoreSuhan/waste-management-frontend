import {
    REPORT_STATUS_META,
    DEFAULT_STATUS_META,
} from "@/constants/reportConstants";

/**
 * ==========================================================
 * Status Badge
 * ----------------------------------------------------------
 * Shows the report status using the tricolour mapping:
 *
 *   Pending     -> saffron
 *   In Progress -> blue
 *   Resolved    -> India green
 *
 * Square corners and a status dot, so it reads as a record
 * marker rather than a decorative pill.
 * ==========================================================
 */

export default function StatusBadge({ status }) {

    // Fall back to a neutral style if the backend adds a new status
    const meta = REPORT_STATUS_META[status] || DEFAULT_STATUS_META;

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
