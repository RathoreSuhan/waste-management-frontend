import axiosClient from "@/api/axiosClient";
import { ANALYTICS_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Engagement Analytics Service
 * ============================================================================
 *
 * Wraps the Phase 8 analytics endpoints.
 *
 * Backend endpoints (all require a JWT):
 * GET /api/analytics/report/{id} -> analytics for one report
 * GET /api/analytics/trending    -> every report, engagement score first
 * GET /api/analytics/dashboard   -> system-wide totals
 *
 * Engagement score is stored on the report itself and recalculated by
 * the backend after every vote, comment and reply:
 *
 *   engagement = urgencyScore + (comments x 2) + (replies x 1)
 *
 * Because ReportResponse already carries engagementScore, these calls
 * are only needed for the comment/reply breakdown behind that number.
 * ============================================================================
 */

/**
 * Get Analytics For A Single Report
 *
 * @param {number|string} reportId - report id
 * @returns Backend ReportAnalyticsResponse
 */
export async function getReportAnalytics(reportId) {
    const response = await axiosClient.get(`${ANALYTICS_API}/report/${reportId}`);

    return response.data;
}

/**
 * Get Trending Reports
 *
 * Returns EVERY report ordered by engagement score, not a top-N slice,
 * and each entry holds only counts:
 *
 *   { reportId, urgencyScore, commentCount, replyCount,
 *     discussionCount, engagementScore }
 *
 * There is no title, image or timestamp here, so callers that need to
 * render a card must join this against the report list by reportId.
 *
 * @returns Array of ReportAnalyticsResponse
 */
export async function getTrendingReports() {
    const response = await axiosClient.get(`${ANALYTICS_API}/trending`);

    return response.data;
}

/**
 * Get Dashboard Analytics
 *
 * System-wide totals: reports, votes, comments, replies, the two
 * averages, and the id of the single most engaged report.
 *
 * @returns Backend DashboardAnalyticsResponse
 */
export async function getDashboardAnalytics() {
    const response = await axiosClient.get(`${ANALYTICS_API}/dashboard`);

    return response.data;
}

/**
 * Index Analytics By Report Id
 *
 * Turns the trending array into a Map for O(1) lookup while rendering
 * a report list, instead of a find() per row.
 *
 * @param {Array} analyticsList - result of getTrendingReports()
 * @returns Map<number, ReportAnalyticsResponse>
 */
export function indexAnalyticsByReportId(analyticsList) {
    const map = new Map();

    for (const entry of analyticsList ?? []) {
        map.set(entry.reportId, entry);
    }

    return map;
}
