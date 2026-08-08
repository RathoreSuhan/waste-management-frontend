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
 * POST   /api/reports      -> create a report (multipart/form-data)
 * GET    /api/reports      -> all reports
 * GET    /api/reports/{id} -> single report
 * GET    /api/reports/my   -> reports of the logged-in citizen
 * ============================================================================
 */

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
 * Get All Reports
 *
 * @returns Array of ReportResponse
 */
export async function getAllReports() {
    const response = await axiosClient.get(REPORTS_API);

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
 * Get Reports Created By Logged-In User
 *
 * Backend resolves the user from the JWT token, so no id is needed here.
 *
 * @returns Array of ReportResponse
 */
export async function getMyReports() {
    const response = await axiosClient.get(`${REPORTS_API}/my`);

    return response.data;
}
