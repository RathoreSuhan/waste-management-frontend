import axiosClient from "@/api/axiosClient";
import {
    CLEANUP_ACTIVITY_LOGS_API, // optional work diary kept during IN_PROGRESS
    CLEANUP_ASSIGNMENTS_API,
    CLEANUP_PROPOSALS_API, // proposal endpoints live under their own controller
    UPLOAD_TIMEOUT,
} from "@/constants/apiConstants";

/**
 * ============================================================================
 * Cleanup Assignment & Proposal Service
 * ============================================================================
 *
 * Wraps the cleaner workflow endpoints.
 *
 * A cleaner can no longer take a site directly. The flow is now:
 * inspect the site -> submit a proposal -> the municipal corporation assigns
 * the work -> start -> upload proof for AI verification.
 *
 * Backend endpoints:
 *   POST /api/cleanup-assignments/{id}/start        -> begin awarded work
 *   POST /api/cleanup-assignments/{id}/upload-image -> submit proof for AI
 *   GET  /api/cleanup-assignments/my-tasks          -> every task of this cleaner
 *   GET  /api/cleanup-assignments/pending           -> open sites, any cleaner may propose
 *   GET  /api/cleanup-assignments/claimed           -> sites awarded to this cleaner
 *   GET  /api/cleanup-assignments/in-progress       -> this cleaner, working
 *   GET  /api/cleanup-assignments/completed         -> this cleaner, verified
 *   POST /api/cleanup-proposals/assignment/{id}     -> offer to clean a site
 *   PUT  /api/cleanup-proposals/{id}                -> revise an open proposal
 *   DEL  /api/cleanup-proposals/{id}                -> withdraw a proposal
 *   GET  /api/cleanup-proposals/my                  -> proposals of this cleaner
 *   GET  /api/cleanup-proposals/{id}                -> one proposal of this cleaner
 *   POST /api/cleanup-activity-logs/assignment/{id} -> add a work diary entry
 *   GET  /api/cleanup-activity-logs/assignment/{id} -> read the work diary
 *   DEL  /api/cleanup-activity-logs/{id}            -> remove one diary entry
 *
 * Note: there is no GET /{id} endpoint for assignments, so a single assignment
 * cannot be fetched on its own. Every screen is therefore built from these list
 * endpoints rather than from a detail route.
 * ============================================================================
 */

/**
 * Mark an assignment the corporation awarded to this cleaner as started.
 *
 * Required before any cleanup image can be uploaded.
 *
 * The backend re-checks three things here: that the caller is the cleaner the
 * municipality authorised, that an approved proposal actually exists, and that
 * the captured position is within the allowed radius of the reported site. It
 * stores the coordinates as the start evidence for the cleanup.
 *
 * @param {number|string} assignmentId
 * @param {{ latitude: number, longitude: number }} position - reading captured
 *        on the cleaner's device at the site
 * @returns Backend SuccessResponse -> { message, timestamp }
 */
export async function startCleanup(assignmentId, position) {

    // Query params, because the backend reads @RequestParam latitude/longitude
    const params = {};

    // Sent only when a real fix was obtained, so a missing reading produces the
    // backend's "location could not be verified" guidance instead of a parse error
    if (position && Number.isFinite(position.latitude) && Number.isFinite(position.longitude)) {
        params.latitude = position.latitude;
        params.longitude = position.longitude;
    }

    const response = await axiosClient.post(
        `${CLEANUP_ASSIGNMENTS_API}/${assignmentId}/start`,
        null, // no body: the start call carries evidence only
        { params }
    );

    return response.data;
}

/**
 * Upload the after-cleanup photograph for AI verification.
 *
 * Gemini downloads both the before and after images and compares them, so
 * this is by far the slowest call in the app and needs the upload timeout
 * rather than the default 10 seconds.
 *
 * Important: a rejected cleanup still returns HTTP 200 with
 * aiVerified === false. Callers must branch on aiVerified, never on the
 * status code, otherwise a failed verification reads as a success.
 *
 * @param {number|string} assignmentId
 * @param {File} image - after-cleanup photograph
 * @param {{ latitude: number, longitude: number }} position - position captured
 *        on the cleaner's device; the backend re-measures its distance from the
 *        reported location and rejects proof taken outside the allowed radius
 * @returns Backend CleanupValidationResponse ->
 *          { aiVerified, confidence, remarks, assignmentStatus, reportStatus, message }
 */
export async function uploadCleanupImage(assignmentId, image, position) {

    // Field name must match @RequestParam("image") on the controller
    const formData = new FormData();

    formData.append("image", image);

    // Field names must match @RequestParam("latitude"/"longitude");
    // sent only when a real position was captured, so a missing reading
    // produces the backend's guidance message instead of a parse error
    if (position && Number.isFinite(position.latitude) && Number.isFinite(position.longitude)) {
        formData.append("latitude", String(position.latitude));
        formData.append("longitude", String(position.longitude));
    }

    const response = await axiosClient.post(
        `${CLEANUP_ASSIGNMENTS_API}/${assignmentId}/upload-image`,
        formData,
        {
            // AI comparison of two images takes far longer than a normal request
            timeout: UPLOAD_TIMEOUT,
        }
    );

    return response.data;
}

/**
 * Every assignment belonging to the logged-in cleaner, in all states.
 *
 * @returns Array of CleanupAssignmentResponse
 */
export async function getMyTasks() {
    const response = await axiosClient.get(
        `${CLEANUP_ASSIGNMENTS_API}/my-tasks`
    );

    // Guard against a null body so callers can always map over the result
    return response.data || [];
}

/**
 * Open sites no cleaner has been assigned to yet.
 *
 * Visible to every cleaner in the city, because any of them may inspect the
 * site and submit a competing proposal for it.
 *
 * @returns Array of CleanupAssignmentResponse
 */
export async function getPendingAssignments() {
    const response = await axiosClient.get(
        `${CLEANUP_ASSIGNMENTS_API}/pending`
    );

    return response.data || [];
}

/**
 * Sites the corporation awarded to this cleaner that are not started yet.
 *
 * The endpoint keeps its original "claimed" path for backward compatibility
 * with rows created before the proposal workflow existed.
 *
 * @returns Array of CleanupAssignmentResponse
 */
export async function getClaimedAssignments() {
    const response = await axiosClient.get(
        `${CLEANUP_ASSIGNMENTS_API}/claimed`
    );

    return response.data || [];
}

/**
 * Assignments this cleaner is actively working on.
 *
 * @returns Array of CleanupAssignmentResponse
 */
export async function getInProgressAssignments() {
    const response = await axiosClient.get(
        `${CLEANUP_ASSIGNMENTS_API}/in-progress`
    );

    return response.data || [];
}

/**
 * Assignments this cleaner completed and AI verified.
 *
 * @returns Array of CleanupAssignmentResponse
 */
export async function getCompletedAssignments() {
    const response = await axiosClient.get(
        `${CLEANUP_ASSIGNMENTS_API}/completed`
    );

    return response.data || [];
}

/**
 * Submit a cleanup proposal for an open assignment.
 *
 * Replaces the removed claim call: submitting does NOT award the site, it only
 * registers this cleaner's plan so a municipal officer can compare proposals.
 * The backend re-verifies the inspection coordinates against the report, so a
 * proposal captured away from the site is rejected.
 *
 * @param {number|string} assignmentId
 * @param {FormData} formData multipart body built by the submit-proposal page
 * @returns Backend CleanupProposalResponse
 */
export async function submitProposal(assignmentId, formData) {
    const response = await axiosClient.post(
        `${CLEANUP_PROPOSALS_API}/assignment/${assignmentId}`,
        formData,
        { timeout: UPLOAD_TIMEOUT } // an inspection photo needs the longer upload budget
    );

    return response.data;
}

/**
 * Revise a proposal that is still SUBMITTED or REVISION_REQUIRED.
 *
 * Sends the same multipart payload as submitProposal; omitting the image keeps
 * the inspection photo already stored on the proposal.
 *
 * @param {number|string} proposalId
 * @param {FormData} formData
 * @returns Backend CleanupProposalResponse
 */
export async function updateProposal(proposalId, formData) {
    const response = await axiosClient.put(
        `${CLEANUP_PROPOSALS_API}/${proposalId}`,
        formData,
        { timeout: UPLOAD_TIMEOUT } // the cleaner may replace the inspection photo
    );

    return response.data;
}

/**
 * Withdraw a proposal.
 *
 * The row is kept and flagged WITHDRAWN rather than deleted, so the municipal
 * audit trail for the site stays complete.
 *
 * @param {number|string} proposalId
 * @returns Backend CleanupProposalResponse
 */
export async function withdrawProposal(proposalId) {
    const response = await axiosClient.delete(
        `${CLEANUP_PROPOSALS_API}/${proposalId}`
    );

    return response.data;
}

/**
 * Every proposal submitted by the signed-in cleaner, newest first.
 *
 * Also used to work out which open sites the cleaner has already proposed for,
 * because the assignment list itself is shared by all cleaners.
 *
 * @returns CleanupProposalResponse[] (empty array when the cleaner has none)
 */
export async function getMyProposals() {
    const response = await axiosClient.get(`${CLEANUP_PROPOSALS_API}/my`);

    return response.data || [];
}

/**
 * A single proposal owned by the signed-in cleaner.
 *
 * The backend hides other cleaners' proposals, so this 404s for foreign ids.
 *
 * @param {number|string} proposalId
 * @returns Backend CleanupProposalResponse
 */
export async function getProposal(proposalId) {
    const response = await axiosClient.get(
        `${CLEANUP_PROPOSALS_API}/${proposalId}`
    );

    return response.data;
}

/**
 * Add one entry to the cleanup work diary.
 *
 * Entirely optional: a small one-day cleanup can go straight from start to
 * proof upload without a single entry. Multi-day work is written up entry by
 * entry instead, which is why the date-time can be back-dated.
 *
 * Only the description is required. The photograph and the coordinates are
 * both optional, and coordinates here are recorded for the record only - an
 * entry is never rejected for being far from the site.
 *
 * @param {number|string} assignmentId
 * @param {{ description: string, activityAt?: string,
 *           latitude?: number, longitude?: number }} entry
 * @param {File} [image] optional evidence photograph
 * @returns Backend CleanupActivityLogResponse
 */
export async function addActivityLog(assignmentId, entry, image) {

    // Multipart, because the controller reads @ModelAttribute + @RequestParam("image")
    const formData = new FormData();

    formData.append("description", entry.description);

    // Blank means "now" on the backend, so only send a real value
    if (entry.activityAt) {
        formData.append("activityAt", entry.activityAt);
    }

    if (Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude)) {
        formData.append("latitude", String(entry.latitude));
        formData.append("longitude", String(entry.longitude));
    }

    if (image) {
        formData.append("image", image);
    }

    const response = await axiosClient.post(
        `${CLEANUP_ACTIVITY_LOGS_API}/assignment/${assignmentId}`,
        formData,
        // An entry may carry a photo, so allow the longer upload budget
        { timeout: UPLOAD_TIMEOUT }
    );

    return response.data;
}

/**
 * The work diary of one assignment, oldest entry first.
 *
 * Stays readable after the work is submitted, so the cleaner can still see
 * what they recorded while the corporation reviews the proof.
 *
 * @param {number|string} assignmentId
 * @returns CleanupActivityLogResponse[] (empty array when nothing was logged)
 */
export async function getActivityLogs(assignmentId) {
    const response = await axiosClient.get(
        `${CLEANUP_ACTIVITY_LOGS_API}/assignment/${assignmentId}`
    );

    return response.data || [];
}

/**
 * Remove one diary entry the cleaner wrote.
 *
 * Allowed only while the cleanup is still IN_PROGRESS: once proof has been
 * submitted the diary freezes so the municipal record cannot change mid-review.
 *
 * @param {number|string} activityLogId
 * @returns Backend SuccessResponse -> { message, timestamp }
 */
export async function deleteActivityLog(activityLogId) {
    const response = await axiosClient.delete(
        `${CLEANUP_ACTIVITY_LOGS_API}/${activityLogId}`
    );

    return response.data;
}
