/**
 * ============================================================================
 * Cleanup Assignment Constants (Phase 8, revised in Phases 14-15)
 * ============================================================================
 *
 * Single source of truth for the cleanup assignment lifecycle.
 *
 * Kept in sync with the backend AssignmentStatus enum:
 *
 *   PENDING            -> created with the report, open for proposals
 *   PROPOSAL_SUBMITTED -> at least one cleaner has offered to clean it
 *   ASSIGNED           -> the municipal corporation awarded the work
 *   IN_PROGRESS        -> the awarded cleaner has started work on site
 *   AWAITING_APPROVAL  -> AI verified the proof, municipal sign-off pending
 *   REWORK_REQUIRED    -> officer sent the cleanup back; cleaner resumes and resubmits
 *   CLAIMED            -> legacy: taken directly before Phase 14
 *   COMPLETED          -> a municipal officer approved the finished cleanup
 *
 * Phase 14 removed direct claiming: a cleaner now inspects the site and
 * submits a proposal, and a municipal officer decides who is awarded it.
 *
 * Phase 15 added the municipal COMPLETION approval, so AI verification alone
 * no longer closes a task - the reward and the resolved report are released
 * only once an officer signs the cleanup off.
 *
 * The backend enforces this order strictly, so the UI must never offer an
 * action the current state does not allow - see canPropose/canStart/canUpload
 * below, which mirror the exact guards in CleanupAssignmentServiceImpl and
 * CleanupProposalServiceImpl.
 * ============================================================================
 */

/**
 * Assignment status values (must match backend AssignmentStatus enum)
 */
export const ASSIGNMENT_STATUS = {
    PENDING: "PENDING",
    PROPOSAL_SUBMITTED: "PROPOSAL_SUBMITTED",
    ASSIGNED: "ASSIGNED",
    CLAIMED: "CLAIMED", // legacy rows created before the proposal workflow
    IN_PROGRESS: "IN_PROGRESS",
    AWAITING_APPROVAL: "AWAITING_APPROVAL", // proof uploaded and AI verified, officer must sign off
    REWORK_REQUIRED: "REWORK_REQUIRED", // officer refused sign-off, work continues and is resubmitted
    COMPLETED: "COMPLETED",
};

/**
 * Proposal status values (must match backend ProposalStatus enum)
 *
 * A proposal is the cleaner's offer, not the work itself, so it carries its
 * own lifecycle independent of the assignment status above.
 */
export const PROPOSAL_STATUS = {
    SUBMITTED: "SUBMITTED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    REVISION_REQUIRED: "REVISION_REQUIRED",
    WITHDRAWN: "WITHDRAWN",
};

/**
 * Distance a cleaner may stand from the reported location and still have
 * cleanup proof accepted.
 *
 * Mirrors CLEANUP_PROOF_RADIUS_METERS in CleanupAssignmentServiceImpl - the
 * backend re-measures the distance on upload, so this copy only exists to
 * warn the cleaner before the file is sent.
 */
export const CLEANUP_PROOF_RADIUS_METRES = 50;

/**
 * Distance a cleaner may stand from the reported location and still have a
 * site inspection accepted as the basis of a proposal.
 *
 * This is a Clean Bharat platform verification rule, not a legal one. It
 * mirrors INSPECTION_RADIUS_METERS in CleanupProposalServiceImpl, which
 * re-measures the distance server side.
 */
export const INSPECTION_RADIUS_METRES = 50;

/**
 * Display information for each assignment status.
 *
 * Colours follow the same tricolour language as report statuses so a cleaner
 * reading both screens does not have to learn two palettes.
 */
export const ASSIGNMENT_STATUS_META = {
    PENDING: {
        label: "Open", // no proposals yet - any cleaner may inspect and offer
        // Saffron = waiting for a cleaner to come forward
        className: "bg-orange-50 text-orange-800 border border-orange-300",
        dotClassName: "bg-saffron",
    },
    PROPOSAL_SUBMITTED: {
        // "Proposals Open" describes the SITE, not the paper: offers are in and
        // more are still welcome. The proposal's own chip already says
        // "Under Review", so reusing that wording here printed it twice on the
        // municipal review card.
        label: "Proposals Open",
        // Amber = offers received, municipal decision pending
        className: "bg-amber-50 text-amber-800 border border-amber-300",
        dotClassName: "bg-amber-500",
    },
    ASSIGNED: {
        label: "Assigned",
        // Blue-grey = municipality awarded the work, cleaner may start
        className: "bg-indigo-50 text-gov-blue border border-indigo-300",
        dotClassName: "bg-gov-blue",
    },
    CLAIMED: {
        label: "Claimed",
        // Slate = legacy pre-Phase-14 ownership, kept so old rows still render
        className: "bg-slate-50 text-ink border border-rule",
        dotClassName: "bg-ink-muted",
    },
    IN_PROGRESS: {
        label: "In Progress",
        // Blue = work is underway
        className: "bg-blue-50 text-gov-blue border border-blue-300",
        dotClassName: "bg-gov-blue",
    },
    AWAITING_APPROVAL: {
        label: "Awaiting Approval",
        // Amber = same "waiting on the municipality" cue as Under Review
        className: "bg-amber-50 text-amber-800 border border-amber-300",
        dotClassName: "bg-amber-500",
    },
    REWORK_REQUIRED: {
        label: "Rework Required",
        // Rose = the officer was not satisfied, the site is back with the cleaner
        className: "bg-rose-50 text-rose-700 border border-rose-300",
        dotClassName: "bg-rose-500",
    },
    COMPLETED: {
        label: "Completed",
        // India green = municipally approved and closed
        className: "bg-green-50 text-india-green border border-green-300",
        dotClassName: "bg-india-green",
    },
};

/**
 * Fallback style for any status this build does not recognise yet,
 * so a newly added backend status still renders sensibly.
 */
export const DEFAULT_ASSIGNMENT_STATUS_META = {
    label: "Unknown",
    className: "bg-slate-50 text-ink-muted border border-rule",
    dotClassName: "bg-ink-muted",
};

/**
 * Can this assignment still receive a cleanup proposal?
 *
 * A site stays open to proposals until a municipal officer approves one, so
 * both PENDING and PROPOSAL_SUBMITTED qualify - several cleaners are expected
 * to compete for the same site.
 *
 * The backend additionally rejects a proposal when the cleaner's city or state
 * does not match the report, or when this cleaner has already proposed for it,
 * which the frontend cannot always know in advance, so submission may still
 * fail with a clear message after passing this check.
 */
export function canPropose(assignment) {
    return assignment?.assignmentStatus === ASSIGNMENT_STATUS.PENDING || assignment?.assignmentStatus === ASSIGNMENT_STATUS.PROPOSAL_SUBMITTED; // stays open until an officer approves a proposal
}

/**
 * Can the cleaner start work? Only work the corporation awarded may be started.
 */
export function canStart(assignment) {
    return assignment?.assignmentStatus === ASSIGNMENT_STATUS.ASSIGNED || assignment?.assignmentStatus === ASSIGNMENT_STATUS.CLAIMED; // ASSIGNED is the new gate, CLAIMED kept for legacy rows
}

/**
 * Can the cleaner upload completion proof?
 *
 * The backend requires cleanup to have been started first, and refuses any
 * further uploads once the proof is in - AWAITING_APPROVAL and COMPLETED are
 * therefore both excluded, since the site is then with the municipal officer.
 *
 * REWORK_REQUIRED is allowed: when an officer refuses sign-off the cleaner
 * keeps working on the same assignment and submits fresh proof, which goes
 * through GPS and AI verification again before returning to the officer.
 */
export function canUpload(assignment) {
    return (
        assignment?.assignmentStatus === ASSIGNMENT_STATUS.IN_PROGRESS ||
        assignment?.assignmentStatus === ASSIGNMENT_STATUS.REWORK_REQUIRED // resubmission after a rework request
    );
}

/**
 * Formats an AI confidence score for display.
 *
 * The backend reports confidence as a fraction between 0 and 1, so it is
 * shown as a percentage. Returns an empty string when the value is missing,
 * which happens for tasks that have not been through verification yet.
 */
export function formatConfidence(confidence) {

    // Explicit null check - 0 is a meaningful confidence, not "missing"
    if (confidence === null || confidence === undefined) {
        return "";
    }

    return `${Math.round(confidence * 100)}%`;
}

/**
 * Presentation metadata for cleanup proposal statuses.
 *
 * Mirrors the backend ProposalStatus enum so a cleaner can tell at a glance
 * whether a proposal is still with the municipal officer, was approved,
 * needs reworking, was rejected, or was withdrawn by the cleaner.
 */
export const PROPOSAL_STATUS_META = {
    [PROPOSAL_STATUS.SUBMITTED]: {
        label: "Under Review",
        className: "bg-amber-50 text-amber-800 border border-amber-300", // waiting on the municipal officer
        dotClassName: "bg-amber-500",
    },
    [PROPOSAL_STATUS.APPROVED]: {
        label: "Approved",
        className: "bg-emerald-50 text-india-green border border-emerald-300", // this cleaner won the site
        dotClassName: "bg-india-green",
    },
    [PROPOSAL_STATUS.REVISION_REQUIRED]: {
        label: "Revision Needed",
        className: "bg-orange-50 text-orange-800 border border-orange-300", // officer asked for changes
        dotClassName: "bg-orange-500",
    },
    [PROPOSAL_STATUS.REJECTED]: {
        label: "Not Selected",
        className: "bg-rose-50 text-rose-700 border border-rose-300", // another proposal was preferred
        dotClassName: "bg-rose-500",
    },
    [PROPOSAL_STATUS.WITHDRAWN]: {
        label: "Withdrawn",
        className: "bg-slate-50 text-ink-muted border border-rule", // pulled back by the cleaner, kept for audit
        dotClassName: "bg-ink-muted",
    },
};

/** Fallback styling so an unknown status from the API still renders safely. */
export const DEFAULT_PROPOSAL_STATUS_META = {
    label: "Unknown",
    className: "bg-slate-50 text-ink-muted border border-rule",
    dotClassName: "bg-ink-muted",
};

/**
 * Can this proposal still be edited or withdrawn by its cleaner?
 *
 * Mirrors the backend EDITABLE_STATES guard - once an officer approves or
 * rejects a proposal it becomes an immutable record.
 */
export function isProposalEditable(proposal) {
    return (
        proposal?.status === PROPOSAL_STATUS.SUBMITTED ||
        proposal?.status === PROPOSAL_STATUS.REVISION_REQUIRED
    );
}

/**
 * Proposal states that stop the same cleaner offering for the same site again.
 *
 * Deliberately NOT the same list as isProposalEditable above. Editable answers
 * "may this paper still be changed"; this answers "does this cleaner already
 * hold a live offer here". An APPROVED proposal is no longer editable, yet it
 * blocks harder than any other state - the site is already theirs.
 *
 * WITHDRAWN and REJECTED are absent on purpose: a cleaner who pulled their
 * offer back, or whose plan lost to another, may bid again for as long as the
 * site stays open.
 */
export const PROPOSAL_BLOCKING_STATUSES = [
    PROPOSAL_STATUS.SUBMITTED, // sitting with the municipal officer right now
    PROPOSAL_STATUS.REVISION_REQUIRED, // officer asked for changes; still this cleaner's live offer
    PROPOSAL_STATUS.APPROVED, // already won the site, nothing left to propose
];

/**
 * Does this proposal prevent its cleaner from submitting a fresh one?
 *
 * Used by Available Tasks to choose between the "Inspect & Propose" button and
 * the "awaiting municipal review" note, so a withdrawn offer no longer locks a
 * cleaner out of a site nobody has been awarded.
 */
export function blocksNewProposal(proposal) {
    return PROPOSAL_BLOCKING_STATUSES.includes(proposal?.status); // a missing status never blocks
}