/**
 * ============================================================================
 * Cleanup Assignment Constants (Phase 8)
 * ============================================================================
 *
 * Single source of truth for the cleanup assignment lifecycle.
 *
 * Kept in sync with the backend AssignmentStatus enum:
 *
 *   PENDING     -> created with the report, no cleaner attached yet
 *   CLAIMED     -> a cleaner has taken ownership
 *   IN_PROGRESS -> the cleaner has started work on site
 *   COMPLETED   -> AI verified the cleanup and the report was resolved
 *
 * The backend enforces this order strictly, so the UI must never offer an
 * action the current state does not allow - see canClaim/canStart/canUpload
 * below, which mirror the exact guards in CleanupAssignmentServiceImpl.
 * ============================================================================
 */

/**
 * Assignment status values (must match backend AssignmentStatus enum)
 */
export const ASSIGNMENT_STATUS = {
    PENDING: "PENDING",
    CLAIMED: "CLAIMED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
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
 * Display information for each assignment status.
 *
 * Colours follow the same tricolour language as report statuses so a cleaner
 * reading both screens does not have to learn two palettes.
 */
export const ASSIGNMENT_STATUS_META = {
    PENDING: {
        label: "Unclaimed",
        // Saffron = waiting for someone to take it
        className: "bg-orange-50 text-orange-800 border border-orange-300",
        dotClassName: "bg-saffron",
    },
    CLAIMED: {
        label: "Claimed",
        // Slate = owned but not yet started, deliberately quieter than active work
        className: "bg-slate-50 text-ink border border-rule",
        dotClassName: "bg-ink-muted",
    },
    IN_PROGRESS: {
        label: "In Progress",
        // Blue = work is underway
        className: "bg-blue-50 text-gov-blue border border-blue-300",
        dotClassName: "bg-gov-blue",
    },
    COMPLETED: {
        label: "Completed",
        // India green = verified and closed
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
 * Can this assignment be claimed?
 *
 * The backend additionally rejects the claim when the cleaner's city or state
 * does not match the report, which the frontend cannot know in advance, so a
 * claim may still fail with a clear message after passing this check.
 */
export function canClaim(assignment) {
    return assignment?.assignmentStatus === ASSIGNMENT_STATUS.PENDING;
}

/**
 * Can the cleaner start work? Only a claimed assignment may be started.
 */
export function canStart(assignment) {
    return assignment?.assignmentStatus === ASSIGNMENT_STATUS.CLAIMED;
}

/**
 * Can the cleaner upload completion proof?
 *
 * The backend requires cleanup to have been started first, and refuses any
 * further uploads once the task is completed and AI verified.
 */
export function canUpload(assignment) {
    return assignment?.assignmentStatus === ASSIGNMENT_STATUS.IN_PROGRESS;
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
