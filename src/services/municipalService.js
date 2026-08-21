import axiosClient from "@/api/axiosClient";
import { CLEANUP_APPROVALS_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Municipal Corporation Service (officer workspace)
 * ============================================================================
 *
 * Every call here belongs to ONE Municipal Corporation.
 *
 * The backend resolves the corporation from the signed-in officer's city and
 * re-checks it on every read and write (assertSameCorporation), so this file
 * never sends a corporation id: an officer simply cannot address another city's
 * work, even by editing a request by hand.
 *
 * A Municipal Officer is NOT a platform administrator. There is deliberately no
 * user management, no report deletion and no global listing in this service -
 * only the approval workspace for the officer's own city.
 *
 * Backend endpoints (all under ROLE_MUNICIPAL_OFFICER in SecurityConfig):
 *   GET  /api/cleanup-approvals/stats                        -> dashboard counters
 *   GET  /api/cleanup-approvals/proposal-queue               -> sites awaiting a proposal decision
 *   GET  /api/cleanup-approvals/assignment/{id}/proposals    -> competing proposals for one site
 *   POST /api/cleanup-approvals/proposal/{proposalId}        -> approve & assign / reject / revise
 *   GET  /api/cleanup-approvals/completion-queue             -> finished work awaiting sign-off
 *   POST /api/cleanup-approvals/completion/{assignmentId}    -> approve completion / request rework
 *   GET  /api/cleanup-approvals/active-cleanups              -> awarded work in execution
 *   GET  /api/cleanup-approvals/assignment/{id}              -> one assignment, review projection
 *   GET  /api/cleanup-approvals/assignment/{id}/activity-logs-> cleaner's work diary (read only)
 *   GET  /api/cleanup-approvals/assignment/{id}/history      -> audit trail of past decisions
 *
 * Important: the AI (Gemini) verdict returned on these payloads is ADVISORY.
 * It pre-screens the evidence for the officer; the officer's decision recorded
 * through decideCompletion() is the only thing that closes a cleanup.
 * ============================================================================
 */

/**
 * Counters for the municipal overview cards.
 *
 * @returns Backend MunicipalDashboardStatsResponse ->
 *          { corporationName, city, state, relevantReports, pendingProposals,
 *            activeCleanups, completionReviews, completedCleanups }
 */
export async function getDashboardStats() {
    const response = await axiosClient.get(`${CLEANUP_APPROVALS_API}/stats`);

    return response.data;
}

/**
 * Sites where cleaners have bid and a municipal decision is due.
 *
 * These are assignments in PROPOSAL_SUBMITTED, so each row carries
 * proposalCount and is the entry point of the proposal review screen.
 *
 * @returns CleanupAssignmentResponse[] (empty array when the queue is clear)
 */
export async function getProposalQueue() {
    const response = await axiosClient.get(`${CLEANUP_APPROVALS_API}/proposal-queue`);

    // Guard against a null body so callers can always map over the result
    return response.data || [];
}

/**
 * Every proposal submitted for one site, oldest first.
 *
 * The officer compares them side by side: cleaner type/organisation, inspection
 * evidence, duration, manpower, equipment, method and waste-handling plan.
 *
 * @param {number|string} assignmentId
 * @returns CleanupProposalResponse[]
 */
export async function getProposalsForAssignment(assignmentId) {
    const response = await axiosClient.get(
        `${CLEANUP_APPROVALS_API}/assignment/${assignmentId}/proposals`
    );

    return response.data || [];
}

/**
 * Record the municipal decision on one proposal.
 *
 * APPROVED           -> this cleaner is authorised, the site becomes ASSIGNED
 *                       and every other live proposal is auto-rejected
 * REJECTED           -> this proposal is out; if none are left the site reopens
 * REVISION_REQUIRED  -> the cleaner may edit and resubmit the same proposal
 *
 * @param {number|string} proposalId
 * @param {{ decision: string, remarks?: string }} payload
 * @returns Backend CleanupApprovalResponse (the audit record just written)
 */
export async function decideProposal(proposalId, payload) {

    // Guard: a missing id would post to /proposal/undefined, which the backend
    // refuses with a raw type-mismatch message. Fail here with a readable one.
    if (proposalId === null || proposalId === undefined || proposalId === "") {
        throw new Error("No proposal was selected, so the decision was not sent.");
    }

    const response = await axiosClient.post(
        `${CLEANUP_APPROVALS_API}/proposal/${proposalId}`,
        payload
    );

    return response.data;
}

/**
 * Finished cleanups awaiting the officer's final sign-off.
 *
 * A row only reaches this queue after GPS verification and the Gemini
 * before/after check have already passed, but nothing is closed yet.
 *
 * @returns CleanupAssignmentResponse[]
 */
export async function getCompletionQueue() {
    const response = await axiosClient.get(`${CLEANUP_APPROVALS_API}/completion-queue`);

    return response.data || [];
}

/**
 * Record the municipal decision on submitted cleanup evidence.
 *
 * APPROVED                        -> assignment COMPLETED, report RESOLVED and
 *                                    the cleaner's reward is released
 * REJECTED / REVISION_REQUIRED    -> assignment parked in REWORK_REQUIRED: the
 *                                    same cleaner keeps working, logs more
 *                                    entries and re-submits proof, which runs
 *                                    GPS + AI again and returns here
 *
 * This call is the administrative decision. The AI verdict shown next to it is
 * advisory evidence only and never closes the assignment on its own.
 *
 * @param {number|string} assignmentId
 * @param {{ decision: string, remarks?: string }} payload
 * @returns Backend CleanupApprovalResponse
 */
export async function decideCompletion(assignmentId, payload) {
    const response = await axiosClient.post(
        `${CLEANUP_APPROVALS_API}/completion/${assignmentId}`,
        payload
    );

    return response.data;
}

/**
 * Awarded work currently being executed in this city.
 *
 * Covers ASSIGNED, legacy CLAIMED, IN_PROGRESS and REWORK_REQUIRED, so the
 * officer can watch progress between authorisation and sign-off.
 *
 * @returns CleanupAssignmentResponse[]
 */
export async function getActiveCleanups() {
    const response = await axiosClient.get(`${CLEANUP_APPROVALS_API}/active-cleanups`);

    return response.data || [];
}

/**
 * One assignment, enriched for the review screens.
 *
 * Unlike the cleaner-side API there IS a detail endpoint here, because the
 * officer opens a single case file: before/after images, cleaner identity, the
 * recorded start GPS distance, the advisory AI verdict and evidence counters.
 *
 * @param {number|string} assignmentId
 * @returns Backend CleanupAssignmentResponse
 */
export async function getAssignmentForReview(assignmentId) {
    const response = await axiosClient.get(
        `${CLEANUP_APPROVALS_API}/assignment/${assignmentId}`
    );

    return response.data;
}

/**
 * The cleaner's work diary for one assignment, oldest entry first.
 *
 * Read-only for officers: writing entries stays a cleaner capability, this is
 * purely supporting evidence for the review.
 *
 * @param {number|string} assignmentId
 * @returns CleanupActivityLogResponse[]
 */
export async function getAssignmentActivityLogs(assignmentId) {
    const response = await axiosClient.get(
        `${CLEANUP_APPROVALS_API}/assignment/${assignmentId}/activity-logs`
    );

    return response.data || [];
}

/**
 * Audit trail of every municipal decision taken on one assignment.
 *
 * Append-only on the backend, so this doubles as the record of earlier rework
 * requests and the remarks that accompanied them.
 *
 * @param {number|string} assignmentId
 * @returns CleanupApprovalResponse[]
 */
export async function getApprovalHistory(assignmentId) {
    const response = await axiosClient.get(
        `${CLEANUP_APPROVALS_API}/assignment/${assignmentId}/history`
    );

    return response.data || [];
}