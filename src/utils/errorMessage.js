/**
 * ============================================================================
 * Error Message Helper
 * ============================================================================
 *
 * The backend returns errors through GlobalExceptionHandler as:
 * { message: "...", status: 400 }
 *
 * This helper reads that message safely and falls back to a friendly
 * message for network errors, timeouts, or unexpected failures.
 * ============================================================================
 */

/**
 * Signs of an internal message that should never reach a user: raw SQL,
 * JDBC/Hibernate wrappers, database constraint names, Java stack traces.
 *
 * The backend now keeps these server side, but a proxy, an older deployment or
 * a future unguarded path could still send one, and showing a whole SQL
 * statement in a red banner is both unreadable and an information leak.
 */
const TECHNICAL_MESSAGE_PATTERNS = [
    /could not execute statement/i,
    /violates (?:check|unique|foreign key|not-null) constraint/i,
    /constraint \[/i,
    /\bSQL \[/i,
    /\bSQLState\b/i,
    /\w\s*=\s*\?/, // JDBC placeholders, e.g. "where id=?"
    /\binsert into\b[\s\S]*\bvalues\b/i, // full statements only, not ordinary wording
    /\bupdate\b[\s\S]*\bset\b[\s\S]*\bwhere\b/i,
    /\bdelete from\b[\s\S]*\bwhere\b/i,
    /org\.(?:hibernate|springframework|postgresql)\./i,
    /java\.(?:lang|sql|util)\./i,
    /\w+Exception:/, // Java exception class names
];

/**
 * Decide whether a backend message is safe to display as-is.
 *
 * @param {string} message - message received from the backend
 * @returns {boolean} true when the text looks like internal/technical detail
 */
function looksTechnical(message) {
    if (typeof message !== "string") {
        return false;
    }

    // A very long single blob is almost always a dumped statement or stack trace
    if (message.length > 400) {
        return true;
    }

    return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Extract a readable error message from an Axios error.
 *
 * @param {Object} error - error thrown by Axios
 * @param {string} fallback - message shown when backend sends nothing useful
 * @returns {string} user friendly error message
 */
export function getErrorMessage(
    error,
    fallback = "Something went wrong. Please try again."
) {
    // Backend ErrorResponse message (most common case)
    const backendMessage = error?.response?.data?.message;

    // Show the backend wording only while it reads like a message for a person
    if (backendMessage && !looksTechnical(backendMessage)) {
        return backendMessage;
    }

    // Internal detail was received: replace it with the generic wording
    if (backendMessage) {
        return fallback;
    }

    // Some endpoints return a plain string body instead of JSON
    if (typeof error?.response?.data === "string" && error.response.data.trim()) {
        return looksTechnical(error.response.data) ? fallback : error.response.data;
    }

    /*
      Request took longer than the configured timeout.

      Named as a probable cold start, because that is what it usually is: the
      backend runs on a free plan that stops the container when it is idle, and
      the restart takes close to a minute. "Check your connection" sent people
      to look at their own wifi for a problem that was never theirs.
    */
    if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
        return "The server took too long to respond. It may still be waking up - please try again in a moment.";
    }

    // Request never reached the server (backend starting / down / CORS / offline)
    if (error?.request && !error?.response) {
        return "Unable to reach the server. It may be waking up after a period of inactivity. Please try again in a moment.";
    }

    return fallback;
}

/**
 * Detect the special duplicate-report conflict returned by the backend.
 * DuplicateReportException responds with HTTP 409 and a body containing
 * { duplicate: true, existingReportId, distanceMeters, garbageCategory }
 *
 * @param {Object} error - error thrown by Axios
 * @returns {Object|null} duplicate details, or null when not a duplicate
 */
export function getDuplicateReportDetails(error) {
    const data = error?.response?.data;

    // Only treat it as duplicate when the backend explicitly says so
    if (error?.response?.status === 409 && data?.duplicate) {
        return data;
    }

    return null;
}

/**
 * Detect an AI photograph rejection returned by the backend.
 *
 * InvalidReportImageException responds with HTTP 400 and a body containing
 * { message, status, reason, aiRemarks, confidence } where `reason` is one of
 * the ImageRejectionReason values.
 *
 * Only AI rejections carry a `reason`, so other 400s (an unsupported file
 * format, for instance) fall through to the ordinary error message.
 *
 * @param {Object} error - error thrown by Axios
 * @returns {Object|null} rejection details, or null when not an AI rejection
 */
export function getImageValidationDetails(error) {
    const data = error?.response?.data;

    if (error?.response?.status === 400 && data?.reason) {
        return {
            // Guidance written by the backend for this reason
            message: data.message,

            // Reason code, used to pick the heading and tips
            reason: data.reason,

            // What the AI reported seeing, shown as its observation
            aiRemarks: data.aiRemarks,

            // Confidence, only useful when actually returned
            confidence: data.confidence,
        };
    }

    return null;
}
