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
 *   POST /api/public-feed/{id}/like    -> record a like
 *   POST /api/public-feed/{id}/share   -> record a share initiation
 *
 * These are permitAll() in SecurityConfig, so every call here works
 * while logged out and must never depend on a token.
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
 * Record an appreciation for the cleanup.
 *
 * The endpoint carries no user identity and performs no de-duplication,
 * so nothing server-side stops the same visitor liking twice. Callers
 * should keep their own record of what has already been liked.
 *
 * @param {number|string} reportId
 * @returns Backend SuccessResponse -> { message, timestamp }
 */
export async function incrementLike(reportId) {
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
