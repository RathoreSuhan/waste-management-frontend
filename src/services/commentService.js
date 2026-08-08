import axiosClient from "@/api/axiosClient";
import { COMMENTS_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Community Discussion Service (Phase 7)
 * ============================================================================
 *
 * Threaded discussion on a garbage report. The backend models comments and
 * replies with a single self-referencing entity, so a reply is just a comment
 * with a parent - which is why replies are created against a comment id
 * rather than a report id.
 *
 * Backend endpoints (all require authentication):
 * POST   /api/comments/report/{reportId} -> add a top-level comment
 * POST   /api/comments/{commentId}/reply -> reply to a comment
 * GET    /api/comments/report/{reportId} -> full comment tree
 * DELETE /api/comments/{commentId}       -> delete a comment and its replies
 * ============================================================================
 */

/**
 * Load the comment tree of a report.
 *
 * Each CommentResponse carries a nested `replies` array of the same shape,
 * nested to an unlimited depth.
 *
 * @param {number|string} reportId - report being discussed
 * @returns Array of CommentResponse
 */
export async function getComments(reportId) {
    const response = await axiosClient.get(`${COMMENTS_API}/report/${reportId}`);

    return response.data;
}

/**
 * Post a new top-level comment on a report.
 *
 * @param {number|string} reportId - report being discussed
 * @param {string} message - comment text
 * @returns Backend CommentResponse
 */
export async function addComment(reportId, message) {
    const response = await axiosClient.post(
        `${COMMENTS_API}/report/${reportId}`,
        { message },
    );

    return response.data;
}

/**
 * Reply to an existing comment.
 *
 * The report is resolved by the backend from the parent comment, so only
 * the parent id is needed here.
 *
 * @param {number|string} commentId - comment being replied to
 * @param {string} message - reply text
 * @returns Backend CommentResponse
 */
export async function addReply(commentId, message) {
    const response = await axiosClient.post(
        `${COMMENTS_API}/${commentId}/reply`,
        { message },
    );

    return response.data;
}

/**
 * Delete a comment.
 *
 * Deleting a parent removes its whole reply thread (the backend cascades).
 * Authorisation is enforced server side: authors may delete their own
 * comments and admins may delete any, so a 403 is possible here.
 *
 * This endpoint answers with a plain text body rather than JSON.
 *
 * @param {number|string} commentId - comment to delete
 */
export async function deleteComment(commentId) {
    await axiosClient.delete(`${COMMENTS_API}/${commentId}`);
}
