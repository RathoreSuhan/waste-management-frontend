/**
 * ============================================================================
 * Formatting Helpers
 * ============================================================================
 *
 * Small display helpers used by the report pages.
 * Keeping them here avoids repeating formatting logic inside components.
 * ============================================================================
 */

/**
 * Format a backend LocalDateTime string into a readable date and time.
 *
 * @param {string} value - e.g. "2026-08-08T13:45:12.123"
 * @returns {string} e.g. "8 Aug 2026, 1:45 pm"
 */
export function formatDateTime(value) {
    // Nothing to format
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    // Guard against invalid date strings
    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

/**
 * Convert a timestamp into a short relative label.
 *
 * @param {string} value - backend timestamp
 * @returns {string} e.g. "2 hours ago"
 */
export function formatRelativeTime(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    // Difference in seconds between now and the report time
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
        return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    // Older than a month - show the actual date instead
    return formatDateTime(value);
}

/**
 * Format GPS coordinates for display.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} e.g. "22.572600, 88.363900"
 */
export function formatCoordinates(latitude, longitude) {
    // Both values are required to build a coordinate pair
    if (latitude === null || latitude === undefined) {
        return "—";
    }

    if (longitude === null || longitude === undefined) {
        return "—";
    }

    return `${Number(latitude).toFixed(6)}, ${Number(longitude).toFixed(6)}`;
}

/**
 * Build a Google Maps link for a report location.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string|null} map url or null when coordinates are missing
 */
export function buildMapsUrl(latitude, longitude) {
    if (latitude === null || latitude === undefined) {
        return null;
    }

    if (longitude === null || longitude === undefined) {
        return null;
    }

    return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Convert bytes into a readable file size.
 *
 * @param {number} bytes - file size in bytes
 * @returns {string} e.g. "2.4 MB"
 */
export function formatFileSize(bytes) {
    if (!bytes) {
        return "0 KB";
    }

    // Show KB for small files, MB for larger ones
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(0)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
