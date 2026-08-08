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

    if (backendMessage) {
        return backendMessage;
    }

    // Some endpoints return a plain string body instead of JSON
    if (typeof error?.response?.data === "string" && error.response.data.trim()) {
        return error.response.data;
    }

    // Request took longer than the configured timeout
    if (error?.code === "ECONNABORTED") {
        return "The request took too long. Please check your connection and try again.";
    }

    // Request never reached the server (backend down / CORS / offline)
    if (error?.request && !error?.response) {
        return "Unable to reach the server. Please make sure the backend is running.";
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
