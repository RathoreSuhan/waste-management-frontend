/**
 * ============================================================================
 * Engagement & Sorting Constants (Phase 8)
 * ============================================================================
 *
 * Options and pure helpers for the engagement register.
 *
 * The backend only ever returns one order (engagement score, highest
 * first) and no status filter, so every other arrangement the citizen
 * can pick is applied here on the client.
 * ============================================================================
 */

/**
 * Sort modes
 *
 * Kept as constants rather than loose strings so a typo becomes an
 * import error instead of a list that silently refuses to reorder.
 */
export const SORT_ENGAGEMENT_DESC = "ENGAGEMENT_DESC";
export const SORT_ENGAGEMENT_ASC = "ENGAGEMENT_ASC";
export const SORT_NEWEST = "NEWEST";
export const SORT_OLDEST = "OLDEST";

/**
 * Sort options offered in the dropdown
 */
export const REPORT_SORT_OPTIONS = [
    { value: SORT_ENGAGEMENT_DESC, label: "Most engagement" },
    { value: SORT_ENGAGEMENT_ASC, label: "Least engagement" },
    { value: SORT_NEWEST, label: "Newest first" },
    { value: SORT_OLDEST, label: "Oldest first" },
];

/**
 * Status filters
 *
 * Values are backend ReportStatus names, so a tab matches report.status
 * directly. A claimed cleanup assignment already puts its report into
 * IN_PROGRESS server-side, so no client-side translation is needed.
 * ALL is a frontend-only sentinel.
 */
export const STATUS_ALL = "ALL";

export const REPORT_STATUS_FILTERS = [
    { value: "RESOLVED", label: "Cleaned" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "PENDING", label: "Pending" },
    { value: STATUS_ALL, label: "All" },
];

/**
 * Format An Engagement Or Urgency Score
 *
 * Scores arrive as Java Doubles, so a whole number turns up as 14.0.
 * Trailing ".0" is noise on a card, but 14.5 must keep its half.
 *
 * A report that has never been voted on or discussed has a null score
 * rather than 0, which would otherwise render as "null".
 *
 * @param {number|null|undefined} score
 * @returns {string} e.g. "14", "14.5", "0"
 */
export function formatScore(score) {
    const value = Number(score ?? 0);

    if (!Number.isFinite(value)) {
        return "0";
    }

    // Drop the decimal only when it adds nothing
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/**
 * Sort Reports
 *
 * Returns a NEW array - Array.prototype.sort mutates in place, and
 * sorting the array held in state would edit it behind React's back.
 *
 * Null scores sort as 0 so untouched reports sink to the bottom under
 * "most engagement" instead of scattering unpredictably.
 *
 * @param {Array} reports - ReportResponse list
 * @param {string} mode - one of the SORT_* constants
 * @returns {Array} sorted copy
 */
export function sortReportsBy(reports, mode) {
    const copy = [...(reports ?? [])];

    const score = (report) => Number(report.engagementScore ?? 0);

    // Invalid or missing dates become 0 rather than NaN, which would
    // make the comparator inconsistent and the order arbitrary.
    const time = (report) => {
        const parsed = new Date(report.createdAt).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    switch (mode) {
        case SORT_ENGAGEMENT_ASC:
            return copy.sort((a, b) => score(a) - score(b));

        case SORT_NEWEST:
            return copy.sort((a, b) => time(b) - time(a));

        case SORT_OLDEST:
            return copy.sort((a, b) => time(a) - time(b));

        case SORT_ENGAGEMENT_DESC:
        default:
            return copy.sort((a, b) => score(b) - score(a));
    }
}

/**
 * Filter Reports By Status
 *
 * Compares the backend status as sent, so every reader - citizen, cleaner,
 * admin or signed-out visitor - sees a report under the same tab.
 *
 * @param {Array} reports - ReportResponse list
 * @param {string} status - a register status value or STATUS_ALL
 * @returns {Array} filtered copy
 */
export function filterReportsByStatus(reports, status) {
    if (!status || status === STATUS_ALL) {
        return reports ?? [];
    }

    return (reports ?? []).filter((report) => report.status === status);
}
