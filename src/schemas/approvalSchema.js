/**
 * approvalSchema.js
 * -----------------------------------------------------------------------------
 * Validation rules for the Municipal Officer's approval form (both stages).
 *
 * The same shape is posted to two different endpoints:
 *   POST /api/cleanup-approvals/proposal/{proposalId}     -> stage PROPOSAL
 *   POST /api/cleanup-approvals/completion/{assignmentId} -> stage COMPLETION
 * and the backend `ApprovalDecisionRequest` only carries { decision, remarks }.
 *
 * Policy encoded here (mirrors the backend contract):
 *  - APPROVED           -> remarks are optional (an approval needs no defence).
 *  - REJECTED           -> remarks are MANDATORY, the cleaner must know why.
 *  - REVISION_REQUIRED  -> remarks are MANDATORY, they are the rework brief that
 *                          the cleaner acts on after the assignment flips to
 *                          REWORK_REQUIRED.
 *
 * Note: the Gemini verdict is advisory. Nothing in this schema lets the AI
 * pre-select a decision - the officer always types the decision themselves.
 */

import { z } from "zod";

import {
    APPROVAL_DECISION,
    REMARKS_MAX_LENGTH,
    REMARKS_MIN_LENGTH,
} from "@/constants/municipalConstants";

// Decisions that cannot be recorded without a written justification.
const DECISIONS_REQUIRING_REMARKS = [
    APPROVAL_DECISION.REJECTED,
    APPROVAL_DECISION.REVISION_REQUIRED,
];

/**
 * Zod schema for the decision dialog.
 * `remarks` is validated in two passes: a cheap length/shape check first, then a
 * `superRefine` cross-field rule that depends on the chosen decision.
 */
export const approvalDecisionSchema = z
    .object({
        // Only the three backend enum values are accepted, nothing else.
        decision: z.enum(
            [
                APPROVAL_DECISION.APPROVED,
                APPROVAL_DECISION.REJECTED,
                APPROVAL_DECISION.REVISION_REQUIRED,
            ],
            { message: "Select a decision" },
        ),

        // Optional at this level; the cross-field rule below makes it required
        // for the two negative decisions.
        remarks: z
            .string()
            .trim()
            .max(REMARKS_MAX_LENGTH, `Remarks cannot exceed ${REMARKS_MAX_LENGTH} characters`)
            .optional(),
    })
    .superRefine((values, ctx) => {
        // Approvals may be recorded silently, so nothing more to check here.
        if (!DECISIONS_REQUIRING_REMARKS.includes(values.decision)) {
            return;
        }

        const remarks = values.remarks?.trim() ?? "";

        // A rejection or a rework request without an explanation is unusable for
        // the cleaner, so it is blocked in the form itself.
        if (remarks.length === 0) {
            ctx.addIssue({
                code: "custom",
                path: ["remarks"],
                message: "Remarks are required for this decision",
            });
            return;
        }

        // Guard against one-word dismissals like "no" or "bad".
        if (remarks.length < REMARKS_MIN_LENGTH) {
            ctx.addIssue({
                code: "custom",
                path: ["remarks"],
                message: `Explain the decision in at least ${REMARKS_MIN_LENGTH} characters`,
            });
        }
    });

/**
 * Default form values for the dialog. The decision is injected by the button the
 * officer pressed, so it starts empty and remarks start blank.
 */
export const APPROVAL_DECISION_DEFAULTS = {
    decision: "",
    remarks: "",
};

/**
 * Normalises validated form values into the exact backend request body.
 * Blank remarks are sent as null rather than "" so the audit row stays clean.
 */
export function buildApprovalPayload(values) {
    const remarks = values?.remarks?.trim();

    return {
        decision: values?.decision,
        remarks: remarks ? remarks : null,
    };
}