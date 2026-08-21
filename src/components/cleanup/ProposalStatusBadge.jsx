import {
    PROPOSAL_STATUS_META,
    DEFAULT_PROPOSAL_STATUS_META,
} from "@/constants/assignmentConstants";

/**
 * Small pill showing where a cleanup proposal stands.
 *
 * Deliberately mirrors AssignmentStatusBadge so the cleaner sees one visual
 * language for both the site and their proposal on it.
 */
export default function ProposalStatusBadge({ status }) {

    // Fall back to a neutral style if the backend adds a new status
    const meta = PROPOSAL_STATUS_META[status] || DEFAULT_PROPOSAL_STATUS_META;

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
