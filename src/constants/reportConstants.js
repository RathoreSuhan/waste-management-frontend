/**
 * ============================================================================
 * Garbage Report Constants
 * ============================================================================
 *
 * Single source of truth for report status values and image upload rules.
 * These values are kept in sync with the Spring Boot backend:
 *
 * - ReportStatus enum        -> PENDING | IN_PROGRESS | RESOLVED
 * - ImageUtil                -> jpeg | png | webp are supported by AI
 * - application.properties   -> max upload size is 10MB
 * ============================================================================
 */

/**
 * Report status values (must match backend ReportStatus enum)
 */
export const REPORT_STATUS = {
    PENDING: "PENDING",         // newly created, waiting for a cleaner
    IN_PROGRESS: "IN_PROGRESS", // cleaner is working on it
    RESOLVED: "RESOLVED",       // area has been cleaned
};

/**
 * Display information for each status.
 * Keeps badge colours and labels consistent across every page.
 */
export const REPORT_STATUS_META = {
    PENDING: {
        label: "Pending",
        // Amber = waiting for action
        className: "bg-amber-100 text-amber-700 border border-amber-200",
    },
    IN_PROGRESS: {
        label: "In Progress",
        // Blue = work is happening
        className: "bg-blue-100 text-blue-700 border border-blue-200",
    },
    RESOLVED: {
        label: "Resolved",
        // Green = completed
        className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
};

/**
 * Fallback badge style for any unknown status coming from the backend
 */
export const DEFAULT_STATUS_META = {
    label: "Unknown",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
};

/**
 * Status filter options used on the report listing pages
 */
export const REPORT_STATUS_FILTERS = [
    { value: "ALL", label: "All Statuses" },
    { value: REPORT_STATUS.PENDING, label: "Pending" },
    { value: REPORT_STATUS.IN_PROGRESS, label: "In Progress" },
    { value: REPORT_STATUS.RESOLVED, label: "Resolved" },
];

/**
 * Image types accepted by the backend AI validation (ImageUtil)
 */
export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

/**
 * Accept attribute for the file input (browser level filtering)
 */
export const IMAGE_ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(",");

/**
 * Maximum image size in bytes (10MB - matches spring.servlet.multipart.max-file-size)
 */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Human readable maximum size, shown in the upload hint
 */
export const MAX_IMAGE_SIZE_LABEL = "10MB";
