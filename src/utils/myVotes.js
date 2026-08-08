/**
 * ============================================================================
 * Vote Memory
 * ============================================================================
 *
 * The backend stores one vote per citizen per report, but exposes no
 * endpoint to read it back - only the report's average urgency score.
 * Without this, a citizen who reloads the page would see no trace of the
 * rating they submitted a moment earlier.
 *
 * The rating is therefore cached here, namespaced per account so a shared
 * machine never shows one person's vote to another.
 *
 * This is a display convenience only. The average returned by the backend
 * stays the source of truth, and re-voting is always safe because the
 * backend overwrites an existing vote rather than rejecting it.
 * ============================================================================
 */

/**
 * Storage key for one account.
 */
function storageKey(email) {
    return `cb:myVotes:${email}`;
}

/**
 * Read every remembered vote of an account.
 *
 * Any failure (private browsing, malformed data) degrades to "nothing
 * remembered" rather than breaking the page.
 *
 * @param {string} email - signed-in user's email
 * @returns {Object} map of reportId -> rating
 */
function readAll(email) {
    try {
        const raw = localStorage.getItem(storageKey(email));

        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);

        // Guard against an array or hand-edited value
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {};
        }

        return parsed;
    } catch {
        return {};
    }
}

/**
 * Read the rating this user gave to a report.
 *
 * @param {string} email - signed-in user's email
 * @param {number|string} reportId - report in question
 * @returns {number|null} rating between 1 and 5, or null when unknown
 */
export function getMyVote(email, reportId) {
    if (!email) {
        return null;
    }

    const rating = readAll(email)[String(reportId)];

    return typeof rating === "number" ? rating : null;
}

/**
 * Remember the rating just submitted.
 *
 * @param {string} email - signed-in user's email
 * @param {number|string} reportId - report that was rated
 * @param {number} rating - rating between 1 and 5
 */
export function rememberMyVote(email, reportId, rating) {
    if (!email) {
        return;
    }

    try {
        const all = readAll(email);

        all[String(reportId)] = rating;

        localStorage.setItem(storageKey(email), JSON.stringify(all));
    } catch {
        // Storage unavailable or full - the vote itself already succeeded,
        // so losing the local copy is not worth surfacing to the user.
    }
}
