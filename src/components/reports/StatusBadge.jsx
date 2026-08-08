import {
    REPORT_STATUS_META,
    DEFAULT_STATUS_META,
} from "@/constants/reportConstants";

/**
 * ==========================================================
 * Status Badge
 * ----------------------------------------------------------
 * Shows the report status (PENDING / IN_PROGRESS / RESOLVED)
 * as a coloured pill. Colours come from reportConstants so
 * every page looks the same.
 * ==========================================================
 */

export default function StatusBadge({ status }) {

    // Fall back to a neutral style if backend sends a new status
    const meta = REPORT_STATUS_META[status] || DEFAULT_STATUS_META;

    return (
        <span
            className={`
                inline-flex
                items-center
                rounded-full
                px-3
                py-1
                text-xs
                font-semibold
                ${meta.className}
            `}
        >
            {meta.label}
        </span>
    );
}
