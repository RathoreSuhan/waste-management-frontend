/**
 * ============================================================================
 * Garbage Report Constants
 * ============================================================================
 *
 * Single source of truth for report status values and image upload rules.
 *
 * Labels deliberately mirror the backend names rather than inventing
 * friendlier synonyms, so what the user reads matches what the API stores.
 *
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
        // Saffron = logged, not yet picked up by a cleanup team
        className: "bg-orange-50 text-orange-800 border border-orange-300",
        dotClassName: "bg-saffron",
    },
    IN_PROGRESS: {
        label: "In Progress",
        // Blue = work is underway
        className: "bg-blue-50 text-gov-blue border border-blue-300",
        dotClassName: "bg-gov-blue",
    },
    RESOLVED: {
        label: "Resolved",
        // India green = closed successfully
        className: "bg-green-50 text-india-green border border-green-300",
        dotClassName: "bg-india-green",
    },
};

/**
 * Fallback badge style for any unknown status coming from the backend
 */
export const DEFAULT_STATUS_META = {
    label: "Unknown",
    className: "bg-slate-50 text-ink-muted border border-rule",
    dotClassName: "bg-ink-muted",
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
 * Builds the reference number shown to the user.
 *
 * A quotable reference is far easier to cite in a conversation than a bare
 * database id, so the report id is formatted as REP-<year>-<padded id> for
 * display only. The raw id is still what gets sent to the backend.
 */
export function formatReportRef(id, createdAt) {

    // Fall back to the current year if the timestamp is missing
    const year = createdAt
        ? new Date(createdAt).getFullYear()
        : new Date().getFullYear();

    // Pad so references line up neatly in tables
    return `REP-${year}-${String(id).padStart(6, "0")}`;
}


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


/**
 * ============================================================================
 * AI Photograph Rejection Reasons
 * ============================================================================
 *
 * The backend AI validation returns a `reason` code with every rejected
 * photograph (ImageRejectionReason enum). The guidance sentence comes from the
 * backend in `message`, so only the heading and the practical tips live here.
 *
 * Tips are deliberately about what the citizen should do next, since a
 * rejection is only useful if the next attempt is likely to succeed.
 * ============================================================================
 */
export const IMAGE_REJECTION_META = {
    NO_GARBAGE: {
        title: "No Garbage Detected",
        tips: [
            "Frame the waste itself in the centre of the photograph",
            "Move closer so the waste fills most of the frame",
        ],
    },
    INSIGNIFICANT_GARBAGE: {
        title: "Waste Too Small to Report",
        tips: [
            "Step back to capture the full extent of the affected area",
            "Isolated litter is best cleared locally rather than reported",
        ],
    },
    NOT_REAL_IMAGE: {
        title: "Photograph Not Accepted",
        tips: [
            "Take the photograph yourself at the site",
            "Avoid screenshots, drawings and images downloaded from the internet",
        ],
    },
    POOR_QUALITY: {
        title: "Photograph Not Clear",
        tips: [
            "Hold the camera steady and let it focus before capturing",
            "Photograph during daylight where possible",
        ],
    },
    IRRELEVANT_SUBJECT: {
        title: "Waste Not Visible",
        tips: [
            "Ensure the waste, not the surroundings, is the main subject",
            "Avoid photographs where the waste is far away or obscured",
        ],
    },
    UNCERTAIN: {
        title: "Photograph Could Not Be Verified",
        tips: [
            "Retake the photograph closer to the waste",
            "Make sure the waste is well lit and clearly in view",
        ],
    },
};

/**
 * Fallback heading for a reason code this build does not recognise yet,
 * so a newly added backend reason still renders sensibly.
 */
export const DEFAULT_IMAGE_REJECTION_META = {
    title: "Photograph Not Accepted",
    tips: [],
};


/**
 * ============================================================================
 * Location Verification (Phase 13)
 * ============================================================================
 *
 * The backend deliberately left citizen location validation to the frontend,
 * so these thresholds define what "standing at the site" means in practice.
 *
 * The site radius is deliberately wider than the backend's 50m duplicate
 * radius. A citizen photographs a dump from across the road rather than
 * standing in it, and phone GPS is rarely better than 10-20m in a built-up
 * street, so a radius equal to the duplicate distance would reject honest
 * reports.
 * ============================================================================
 */

/**
 * How far from the captured position the report may be filed, in metres.
 */
export const SITE_PROXIMITY_RADIUS_METRES = 150;

/**
 * How close the citizen is *asked* to stand when taking the photograph.
 *
 * Deliberately not the same number as the radius above, and not a rule.
 * The 150m radius is what verification enforces, and it is generous on
 * purpose so a poor street fix does not reject an honest report. This is
 * the advice printed on the panel - aim for 50m and the photograph will
 * show the waste clearly, the coordinates will be tight, and the cleanup
 * team will find the site.
 *
 * Advice stricter than the limit is the right way round. Reversing them
 * would either turn honest reporters away or print guidance nobody needs
 * to follow.
 */
export const PHOTO_PROXIMITY_ADVICE_METRES = 50;

/**
 * Readings vaguer than this are treated as unusable.
 *
 * A desktop browser positions by IP address and can report accuracy in
 * kilometres, which would otherwise "verify" an entire city as the site.
 */
export const MIN_ACCEPTABLE_ACCURACY_METRES = 100;

/**
 * How long a captured position stays trustworthy, in milliseconds.
 *
 * A long form filled in on the walk over would otherwise submit against
 * a pin from several streets back.
 */
export const LOCATION_FRESHNESS_MS = 10 * 60 * 1000;


