/**
 * ============================================================================
 * Municipal Officer constants
 * ============================================================================
 *
 * Vocabulary of the municipal approval workspace, kept in one place so the
 * dashboard, the queues and the decision dialog can never drift apart.
 *
 * Two backend enums are mirrored here:
 *   ApprovalStage    -> PROPOSAL | COMPLETION
 *   ApprovalDecision -> APPROVED | REJECTED | REVISION_REQUIRED
 *
 * The same three decisions mean very different things at the two stages, which
 * is why the action buttons are described per stage instead of per decision:
 *
 *   PROPOSAL stage
 *     APPROVED          -> authorise this cleaner, the site becomes ASSIGNED
 *     REVISION_REQUIRED -> ask the cleaner to improve and resubmit the plan
 *     REJECTED          -> turn this plan down
 *
 *   COMPLETION stage
 *     APPROVED          -> sign the work off: COMPLETED + report RESOLVED + reward
 *     REVISION_REQUIRED -> send it back as REWORK_REQUIRED, cleaner continues
 *     REJECTED          -> refuse the evidence, also parks it in REWORK_REQUIRED
 *
 * A rejected completion never ends the job: the cleaner keeps working, logs
 * more diary entries and re-submits proof, which runs GPS + AI again and lands
 * back in this officer's completion queue.
 * ============================================================================
 */

/** Backend ApprovalStage. */
export const APPROVAL_STAGE = {
    PROPOSAL: "PROPOSAL",     // choosing who is allowed to clean the site
    COMPLETION: "COMPLETION", // signing off the finished work
};

/** Backend ApprovalDecision. */
export const APPROVAL_DECISION = {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    REVISION_REQUIRED: "REVISION_REQUIRED",
};

/**
 * Badge styling + bilingual wording for a decision already recorded in the
 * audit trail. Uses the same gov palette as the rest of the app.
 */
export const APPROVAL_DECISION_META = {
    APPROVED: {
        label: "Approved",
        labelHi: "स्वीकृत",
        className: "bg-emerald-50 text-india-green border border-india-green/30",
    },
    REJECTED: {
        label: "Rejected",
        labelHi: "अस्वीकृत",
        className: "bg-rose-50 text-rose-700 border border-rose-300",
    },
    REVISION_REQUIRED: {
        label: "Revision Requested",
        labelHi: "संशोधन आवश्यक",
        className: "bg-amber-50 text-amber-800 border border-amber-300",
    },
};

/** Fallback so an unknown decision string still renders as a neutral pill. */
export const DEFAULT_APPROVAL_DECISION_META = {
    label: "Recorded",
    labelHi: "दर्ज",
    className: "bg-slate-100 text-ink-muted border border-rule",
};

/** Stage wording for the audit trail ("Proposal decision" / "Completion decision"). */
export const APPROVAL_STAGE_META = {
    PROPOSAL: { label: "Proposal review", labelHi: "प्रस्ताव समीक्षा" },
    COMPLETION: { label: "Completion review", labelHi: "समापन समीक्षा" },
};

/**
 * Buttons the officer sees, described per stage.
 *
 * `variant` maps onto ui/Button.jsx variants, and `requiresRemarks` drives the
 * zod validation in schemas/approvalSchema.js: turning work down or asking for
 * changes must always carry a written reason, an approval need not.
 */
export const DECISION_ACTIONS = {
    PROPOSAL: [
        {
            decision: APPROVAL_DECISION.APPROVED,
            label: "Approve & Assign",
            labelHi: "स्वीकृत करें और सौंपें",
            variant: "success",
            requiresRemarks: false,
            // Spelled out because approving one plan closes the whole contest
            confirmation:
                "This authorises the cleaner to start work. All other proposals for this site will be rejected automatically.",
        },
        {
            decision: APPROVAL_DECISION.REVISION_REQUIRED,
            label: "Request Revision",
            labelHi: "संशोधन मांगें",
            variant: "secondary",
            requiresRemarks: true,
            confirmation:
                "The cleaner can edit this proposal and submit it again. Explain exactly what must change.",
        },
        {
            decision: APPROVAL_DECISION.REJECTED,
            label: "Reject Proposal",
            labelHi: "प्रस्ताव अस्वीकार करें",
            variant: "danger",
            requiresRemarks: true,
            confirmation:
                "This plan is turned down. If no other proposal is left, the site reopens for fresh proposals.",
        },
    ],
    COMPLETION: [
        {
            decision: APPROVAL_DECISION.APPROVED,
            label: "Approve Completion",
            labelHi: "समापन स्वीकृत करें",
            variant: "success",
            requiresRemarks: false,
            // The only action in the whole system that closes a cleanup
            confirmation:
                "This closes the cleanup: the citizen's report is marked resolved and the cleaner's reward is released.",
        },
        {
            decision: APPROVAL_DECISION.REVISION_REQUIRED,
            label: "Request Rework",
            labelHi: "पुनः कार्य मांगें",
            variant: "secondary",
            requiresRemarks: true,
            confirmation:
                "The same cleaner keeps the job and continues cleaning, then submits fresh proof for verification again.",
        },
        {
            decision: APPROVAL_DECISION.REJECTED,
            label: "Reject Evidence",
            labelHi: "साक्ष्य अस्वीकार करें",
            variant: "danger",
            requiresRemarks: true,
            confirmation:
                "The submitted proof is refused. The cleanup returns to the cleaner as rework and must be submitted again.",
        },
    ],
};

/**
 * Returns the action list for a stage, defaulting to the proposal set so a
 * malformed stage value can never render an empty dialog.
 */
export function getDecisionActions(stage) {
    return DECISION_ACTIONS[stage] || DECISION_ACTIONS[APPROVAL_STAGE.PROPOSAL];
}

/** Looks up one action config, used by the dialog to label its submit button. */
export function getDecisionAction(stage, decision) {
    return getDecisionActions(stage).find((action) => action.decision === decision) || null;
}

/**
 * Remarks bounds.
 *
 * The minimum only applies where remarks are mandatory: a one-word "no" is not
 * an instruction a cleaner can act on. The maximum matches the column size used
 * for approval remarks on the backend.
 */
export const REMARKS_MIN_LENGTH = 10;
export const REMARKS_MAX_LENGTH = 1000;

/**
 * Wording used everywhere an AI figure is displayed to an officer.
 *
 * Gemini pre-screens the before/after photographs so obviously incomplete work
 * never reaches this desk, but the platform must not let a model close a public
 * cleanup. The officer decides; the AI only advises.
 */
export const AI_ADVISORY_NOTICE = {
    title: "AI assessment — advisory only",
    titleHi: "एआई आकलन — केवल सलाहकारी",
    body:
        "Gemini compared the before and after photographs and pre-screened this submission. " +
        "Treat it as supporting evidence: the municipal decision recorded below is what closes the cleanup.",
    bodyHi:
        "जेमिनी ने पहले और बाद की तस्वीरों की तुलना कर यह जाँच की है। इसे सहायक साक्ष्य मानें: " +
        "सफाई कार्य नीचे दर्ज नगर निगम के निर्णय से ही पूर्ण होता है.",
};

/** Short inline version for cards, where the full notice would be too heavy. */
export const AI_ADVISORY_HINT = "Advisory input — the officer decides";

/**
 * Cleaner categories, so a proposal shows "NGO" rather than "NGO_ORGANIZATION".
 * Unknown values fall through to a generic prettifier, which keeps this working
 * if the backend adds a category later.
 */
export const CLEANER_TYPE_LABELS = {
    INDIVIDUAL: "Individual cleaner",
    NGO: "NGO",
    PRIVATE_COMPANY: "Private company",
    GOVERNMENT_WORKER: "Government worker",
    SELF_HELP_GROUP: "Self-help group",
};

/**
 * Human label for a cleaner category.
 *
 * @param {string} [cleanerType] raw backend enum name
 * @returns {string} label, or "Not specified" when the cleaner has no category
 */
export function getCleanerTypeLabel(cleanerType) {
    if (!cleanerType) return "Not specified";

    if (CLEANER_TYPE_LABELS[cleanerType]) return CLEANER_TYPE_LABELS[cleanerType];

    // Generic fallback: SOME_NEW_TYPE -> "Some new type"
    const spaced = cleanerType.replace(/_/g, " ").toLowerCase();

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}