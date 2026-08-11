import axiosClient from "@/api/axiosClient";
import { PUBLIC_FEED_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Public Feed Service (Phase 10)
 * ============================================================================
 *
 * Community success stories: cleanups that were completed and then
 * verified by Gemini AI.
 *
 * Backend endpoints:
 *   GET  /api/public-feed              -> every verified cleanup
 *   GET  /api/public-feed/{reportId}   -> one verified cleanup
 *   POST /api/public-feed/{id}/view    -> record a view
 *   POST /api/public-feed/{id}/like    -> give or withdraw a like
 *   POST /api/public-feed/{id}/share   -> record a share initiation
 *
 * Reading the feed, and the view and share counters, are permitAll() in
 * SecurityConfig, so those calls work while logged out and must never
 * depend on a token.
 *
 * Liking is the exception: it is recorded against an account so that one
 * person counts once, so it requires authentication. Callers must check
 * that someone is signed in before offering it.

 *
 * A feed entry exists only once analytics were created for the
 * assignment, which happens after AI verification succeeds. A report
 * can therefore be RESOLVED and still be absent from the feed, so
 * callers must treat a 404 as "no story yet" rather than an error.
 * ============================================================================
 */

/**
 * All AI-verified completed cleanups.
 *
 * @returns Array of PublicFeedResponse
 */
export async function getPublicFeed() {
    const response = await axiosClient.get(PUBLIC_FEED_API);

    // Guard against a null body so callers can always map over the result
    return response.data || [];
}

/**
 * One verified cleanup, looked up by its garbage report id.
 *
 * @param {number|string} reportId
 * @returns PublicFeedResponse
 */
export async function getPublicFeedByReportId(reportId) {
    const response = await axiosClient.get(`${PUBLIC_FEED_API}/${reportId}`);

    return response.data;
}

/**
 * Same lookup, but for screens where the story is optional decoration
 * rather than the point of the page.
 *
 * The report detail page uses this to find its after-cleanup
 * photograph: ReportResponse has no afterImageUrl, so the image can
 * only come from the feed. A report with no feed entry is a normal
 * outcome, so failure resolves to null instead of throwing and
 * blanking an otherwise healthy page.
 *
 * @param {number|string} reportId
 * @returns PublicFeedResponse or null
 */
export async function findPublicFeedByReportId(reportId) {
    try {
        return await getPublicFeedByReportId(reportId);
    } catch {
        return null;
    }
}

/**
 * Record that the story was viewed.
 *
 * @param {number|string} reportId
 * @returns Backend SuccessResponse -> { message, timestamp }
 */
export async function incrementView(reportId) {
    const response = await axiosClient.post(
        `${PUBLIC_FEED_API}/${reportId}/view`
    );

    return response.data;
}

/**
 * Give or withdraw this account's appreciation for the cleanup.
 *
 * One call does both: the backend adds the like if it is not there and
 * removes it if it is, so pressing twice leaves no trace rather than
 * counting twice.
 *
 * The reply carries the resulting state and the new total, both read
 * from stored likes, so the display never has to guess.
 *
 * Requires a signed-in user and rejects anonymous calls with 401.
 *
 * @param {number|string} reportId
 * @returns Backend LikeResponse -> { liked, likeCount }
 */
export async function toggleLike(reportId) {
    const response = await axiosClient.post(
        `${PUBLIC_FEED_API}/${reportId}/like`
    );

    return response.data;
}


/**
 * Record that a share was started.
 *
 * The backend only counts the intent; opening WhatsApp, LinkedIn or X
 * is the frontend's job.
 *
 * @param {number|string} reportId
 * @returns Backend SuccessResponse -> { message, timestamp }
 */
export async function incrementShare(reportId) {
    const response = await axiosClient.post(
        `${PUBLIC_FEED_API}/${reportId}/share`
    );

    return response.data;
}
