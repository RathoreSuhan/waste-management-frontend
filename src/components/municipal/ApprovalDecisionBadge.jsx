/**
 * ==========================================================
 * Approval Decision Badge
 * ----------------------------------------------------------
 * Renders a recorded municipal decision (APPROVED / REJECTED /
 * REVISION_REQUIRED) as a small bilingual pill.
 *
 * Used in the approval history trail, so an officer reading a
 * file later can see exactly what the corporation decided at
 * each stage without opening every row.
 *
 * Same visual language as AssignmentStatusBadge and
 * StatusBadge - square-ish pill, bordered, no gradients.
 * ==========================================================
 */

import BiText from "@/components/common/BiText";
import {
    APPROVAL_DECISION_META,
    DEFAULT_APPROVAL_DECISION_META,
} from "@/constants/municipalConstants";

export default function ApprovalDecisionBadge({ decision }) {

    // Unknown or future enum values fall back to a neutral pill
    const meta = APPROVAL_DECISION_META[decision] || DEFAULT_APPROVAL_DECISION_META;

    return (
        <span
            className={`inline-flex items-center rounded-gov px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${meta.className}`}
        >
            {/* Hindi line is only rendered when the label has a translation */}
            <BiText en={meta.label} hi={meta.labelHi} />
        </span>
    );
}