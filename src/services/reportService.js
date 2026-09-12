import axiosClient from "@/api/axiosClient";
import { REPORTS_API, UPLOAD_TIMEOUT } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Garbage Report Service
 * ============================================================================
 *
 * Handles every API call of the Report module.
 * Pages never call Axios directly - they always use this service.
 *
 * Backend endpoints (all secured with JWT):
 * POST   /api/reports              -> create a report (multipart/form-data)
 * GET    /api/reports              -> one page of the register, with totals
 * GET    /api/reports/{id}         -> single report
 * GET    /api/reports/my           -> one page of the logged-in citizen's reports
 * GET    /api/reports/my/summary   -> status counts for the summary tiles
 * ============================================================================
 */

/**
 * Builds a query string without sending parameters that mean "not set".
 *
 * The backend binds `status` to an enum and treats a blank `keyword` as
 * "no search", so an empty value is a request for trouble rather than a
 * neutral default. Anything undefined or blank is dropped here, and the
 * backend applies its own defaults to what remains.
 *
 * @param {Object} params - page, size, sortBy, direction, keyword, status...
 * @returns {Object} the subset worth sending
 */
function compact(params) {
    return Object.fromEntries(
        Object.entries(params ?? {}).filter(
            ([, value]) => value !== undefined && value !== null && value !== "",
        ),
    );
}

/**
 * Create Garbage Report
 *
 * The backend controller reads plain request params plus an "image" file,
 * so the payload must be sent as multipart/form-data (not JSON).
 *
 * @param {Object} reportData - { title, description, latitude, longitude, address, landmark, city, state, pincode }
 * @param {File} imageFile - garbage photo captured by the citizen
 * @returns Backend ReportResponse
 */
export async function createReport(reportData, imageFile) {
    // FormData mirrors the @RequestParam names of ReportController
    const formData = new FormData();

    formData.append("title", reportData.title);
    formData.append("description", reportData.description ?? "");

    // Coordinates are sent as numbers parsed from the form strings
    formData.append("latitude", reportData.latitude);
    formData.append("longitude", reportData.longitude);

    formData.append("address", reportData.address);

    // Landmark is optional on the backend - send it only when provided
    if (reportData.landmark) {
        formData.append("landmark", reportData.landmark);
    }

    formData.append("city", reportData.city);
    formData.append("state", reportData.state);
    formData.append("pincode", reportData.pincode);

    // Field name must be "image" to match @RequestParam("image")
    formData.append("image", imageFile);

    const response = await axiosClient.post(REPORTS_API, formData, {
        // Axios automatically adds the correct multipart boundary for FormData
        headers: { "Content-Type": "multipart/form-data" },

        // AI validation + Cloudinary upload need more time than the default 10s
        timeout: UPLOAD_TIMEOUT,
    });

    return response.data;
}

/**
 * Get One Page Of All Reports
 *
 * The register used to be returned whole and sliced in the browser. Now the
 * backend cuts it, so a request receives one page of reports together with
 * the totals needed to draw the pager - never every report on the platform.
 *
 * Sorting is also done server-side, so the page the reader asked for and the
 * page they receive agree on what "newest first" means.
 *
 * @param {Object} [options]
 * @param {number} [options.page]      - zero-based page index
 * @param {number} [options.size]      - rows per page
 * @param {string} [options.sortBy]    - "createdAt" | "engagementScore"
 * @param {string} [options.direction] - "asc" | "desc"
 * @param {string} [options.keyword]   - search over title, city, state, pincode, address
 * @param {string} [options.status]    - PENDING | IN_PROGRESS | RESOLVED
 * @returns PageResponse<ReportResponse> -> { content, page, size,
 *          totalElements, totalPages, hasNext, hasPrevious }
 */
export async function getAllReports({
    page,
    size,
    sortBy,
    direction,
    keyword,
    status,
} = {}) {
    const response = await axiosClient.get(REPORTS_API, {
        params: compact({ page, size, sortBy, direction, keyword, status }),
    });

    return response.data;
}

/**
 * Get Single Report By Id
 *
 * @param {number|string} id - report id
 * @returns Backend ReportResponse
 */
export async function getReport(id) {
    const response = await axiosClient.get(`${REPORTS_API}/${id}`);

    return response.data;
}

/**
 * Get One Page Of Reports Created By Logged-In User
 *
 * Backend resolves the user from the JWT token, so no id is needed here.
 *
 * @param {Object} [options]
 * @param {number} [options.page]   - zero-based page index
 * @param {number} [options.size]   - rows per page
 * @param {string} [options.status] - PENDING | IN_PROGRESS | RESOLVED
 * @returns PageResponse<ReportResponse>
 */
export async function getMyReports({ page, size, status } = {}) {
    const response = await axiosClient.get(`${REPORTS_API}/my`, {
        params: compact({ page, size, status }),
    });

    return response.data;
}

/**
 * Get Status Counts For The Logged-In User's Reports
 *
 * The tiles above "My Reports" describe every report the citizen has ever
 * filed, while the list beneath them shows one page of ten. They cannot be
 * counted from the page on screen - it would read "10 pending" on a
 * citizen with forty - so the counts come from their own endpoint, which
 * groups them in one database query.
 *
 * @returns { total, pending, inProgress, resolved }
 */
export async function getMyReportsSummary() {
    const response = await axiosClient.get(`${REPORTS_API}/my/summary`);

    return response.data;
}
