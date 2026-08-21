import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Textarea from "@/components/ui/Textarea";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import {
    APPROVAL_STAGE_META,
    REMARKS_MAX_LENGTH,
    getDecisionAction,
} from "@/constants/municipalConstants";
import {
    APPROVAL_DECISION_DEFAULTS,
    approvalDecisionSchema,
    buildApprovalPayload,
} from "@/schemas/approvalSchema";

/**
 * ============================================================================
 * Approval Decision Dialog
 * ============================================================================
 *
 * The single place a Municipal Officer records a decision. It serves both
 * stages, because the backend request body is identical either way:
 *
 *   PROPOSAL   -> POST /api/cleanup-approvals/proposal/{proposalId}
 *   COMPLETION -> POST /api/cleanup-approvals/completion/{assignmentId}
 *
 * The officer never picks the decision inside this dialog. They press a named
 * button on the card behind it ("Approve & Assign", "Request Rework", ...) and
 * that decision is passed in, so the dialog only ever asks for the one thing it
 * still needs: the written justification.
 *
 * Remarks are mandatory for REJECTED and REVISION_REQUIRED. The cleaner reads
 * those remarks as their rework brief, so "no" is not an acceptable answer -
 * approvalSchema enforces a minimum length.
 *
 * Nothing here is driven by the AI verdict. Gemini's confidence is shown on the
 * review card as advisory evidence; the officer types the decision themselves.
 * ============================================================================
 */

export default function ApprovalDecisionDialog({
    open,
    // APPROVAL_STAGE.PROPOSAL | APPROVAL_STAGE.COMPLETION
    stage,
    // The decision the officer already chose on the card behind the dialog
    decision,
    // Short line naming what is being decided, e.g. the report title
    subject,
    // Backend refusal, shown in place so the officer keeps their typed remarks
    error = "",
    busy = false,
    onSubmit,
    onClose,
}) {

    /*
      Escape is disabled while the decision is being posted: closing mid-request
      would discard the remarks just as the server's answer arrives.
    */
    const panelRef = useModalBehaviour(open, onClose, {
        closeOnEscape: !busy,
    });

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(approvalDecisionSchema),
        defaultValues: APPROVAL_DECISION_DEFAULTS,
    });

    // Wording for the pressed button (label, tone, whether remarks are required)
    const action = getDecisionAction(stage, decision);

    // "Proposal review" / "Completion review" for the dialog header
    const stageMeta = APPROVAL_STAGE_META[stage] || APPROVAL_STAGE_META.PROPOSAL;

    /*
      Seed the form whenever the dialog opens for a new decision. The decision
      itself is a hidden value: it comes from the button, not from a field, so
      an officer cannot approve while reading a rejection confirmation.
    */
    useEffect(() => {
        if (open) {
            reset({ decision: decision || "", remarks: "" });
        }
    }, [open, decision, reset]);

    // Live counter so a long instruction does not silently hit the column limit
    const remarksValue = watch("remarks") || "";

    if (!open) {
        return null;
    }

    /** Normalises the form values into { decision, remarks } for the API. */
    const submit = (values) => {
        onSubmit(buildApprovalPayload(values));
    };

    return (
        /*
          items-start with a scroll: on a short laptop viewport the confirmation
          text plus the remarks box is taller than the screen, and centring it
          would push the action buttons out of reach.
        */
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="approval-dialog-title"
                className="my-auto w-full max-w-lg rounded-gov border border-rule bg-white shadow-lg outline-none"
            >

                {/* Header names the stage, so the officer knows which gate they are at */}
                <div className="flex items-start justify-between gap-3 border-b border-rule border-l-4 border-l-gov-blue bg-paper px-5 py-3">

                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            {stageMeta.label}
                        </p>

                        <h2
                            id="approval-dialog-title"
                            className="font-serif text-base font-bold text-gov-navy"
                        >
                            {action ? action.label : "Record decision"}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                        // Negative margin keeps the touch target large without moving the icon
                        className="-m-2 shrink-0 p-2 text-ink-muted transition hover:text-gov-blue disabled:opacity-50"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(submit)} className="space-y-4 p-5">

                    {/* What exactly is being decided */}
                    {subject && (
                        <div className="rounded-gov border border-rule bg-paper px-4 py-3">
                            <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                Decision on
                            </p>

                            <p className="mt-1 text-sm font-semibold text-ink">
                                {subject}
                            </p>
                        </div>
                    )}

                    {/* Consequence of this decision, spelled out before it is signed */}
                    {action?.confirmation && (
                        <p className="text-sm text-ink-muted">
                            {action.confirmation}
                        </p>
                    )}

                    <Textarea
                        label="Officer remarks"
                        required={Boolean(action?.requiresRemarks)}
                        rows={5}
                        maxLength={REMARKS_MAX_LENGTH}
                        placeholder={
                            action?.requiresRemarks
                                ? "State clearly what is wrong and what the cleaner must do next."
                                : "Optional note for the record."
                        }
                        hint={
                            action?.requiresRemarks
                                // The cleaner reads this text as their instruction
                                ? "The cleaner sees this as the reason for your decision."
                                : "Recorded in the approval history."
                        }
                        error={errors.remarks}
                        {...register("remarks")}
                    />

                    {/* Character budget, mirrors the backend column size */}
                    <p className="-mt-2 text-right text-xs text-ink-muted">
                        {remarksValue.length}/{REMARKS_MAX_LENGTH}
                    </p>

                    {/* Backend refusal - remarks stay in the box so nothing is retyped */}
                    {error && (
                        <Alert type="error" title="Decision not recorded">
                            {error}
                        </Alert>
                    )}

                    {/* Actions - cancel first so the reversible choice reads first */}
                    <div className="flex flex-col gap-2 border-t border-rule pt-4 sm:flex-row sm:justify-end">

                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth={false}
                            disabled={busy}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            // Tone comes from the action config: success / secondary / danger
                            variant={action?.variant || "primary"}
                            fullWidth={false}
                            loading={busy}
                        >
                            {action ? action.label : "Record decision"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}