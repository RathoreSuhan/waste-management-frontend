import axiosClient from "@/api/axiosClient";
import {
    CLEANUP_ASSIGNMENTS_API,
    UPLOAD_TIMEOUT,
} from "@/constants/apiConstants";

/**
 * ============================================================================
 * Cleanup Assignment Service (Phase 8)
 * ============================================================================
 *
 * Wraps the cleaner workflow endpoints.
 *
 * Backend endpoints:
 *   POST /api/cleanup-assignments/{id}/claim        -> take ownership
 *   POST /api/cleanup-assignments/{id}/start        -> begin work on site
 *   POST /api/cleanup-assignments/{id}/upload-image -> submit proof for AI
 *   GET  /api/cleanup-assignments/my-tasks          -> every task of this cleaner
 *   GET  /api/cleanup-assignments/pending           -> unclaimed, open to all
 *   GET  /api/cleanup-assignments/claimed           -> this cleaner, claimed
 *   GET  /api/cleanup-assignments/in-progress       -> this cleaner, working
 *   GET  /api/cleanup-assignments/completed         -> this cleaner, verified
 *
 * Note: there is no GET /{id} endpoint, so a single assignment cannot be
 * fetched on its own. Every screen is therefore built from these list
 * endpoints rather than from a detail route.
 * ============================================================================
 */

/**
 * Claim a pending assignment.
 *
 * The backend also verifies the cleaner's city and state match the report,
 * so this can fail even for a genuinely pending task.
 *
 * @param {number|string} assignmentId
 * @returns Backend SuccessResponse -> { message, timestamp }
 */
export async function claimAssignment(assignmentId) {
    const response = await axiosClient.post(
        `${CLEANUP_ASSIGNMENTS_API}/${assignmentId}/claim`
    );

    return response.data;
}

/**
 * Mark a claimed assignment as started.
 *
 * Required before any cleanup image can be uploaded.
 *
 * @param {number|string} assignmentId
 * @returns Backend SuccessResponse -> { message, timestamp }
 */
export async function startCleanup(assignmentId) {
    const response = await axiosClient.post(
        `${CLEANUP_ASSIGNMENTS_API}/${assignmentId}/start`
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
 * @returns Backend CleanupValidationResponse ->
 *          { aiVerified, confidence, remarks, assignmentStatus, reportStatus, message }
 */
export async function uploadCleanupImage(assignmentId, image) {

    // Field name must match @RequestParam("image") on the controller
    const formData = new FormData();

    formData.append("image", image);

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
 * Unclaimed assignments available to any cleaner.
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
 * Assignments this cleaner has claimed but not yet started.
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
