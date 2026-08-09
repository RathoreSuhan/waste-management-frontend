import axiosClient from "@/api/axiosClient";
import { ADMIN_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Admin Service (Phase 12)
 * ============================================================================
 *
 * Platform statistics, user administration and report administration.
 *
 * Backend endpoints:
 *   GET    /api/admin/dashboard                          -> statistics
 *   GET    /api/admin/users?role=                        -> list, optional role
 *   GET    /api/admin/users/search?keyword=&role=        -> search
 *   GET    /api/admin/users/{id}                         -> one user, in full
 *   PUT    /api/admin/users/{id}/promote                 -> citizen -> admin
 *   DELETE /api/admin/users/{id}                         -> remove a user
 *   GET    /api/admin/reports/search?keyword=            -> search reports
 *   GET    /api/admin/reports/filter?status=&city=&state=-> filter reports
 *   DELETE /api/admin/reports/{id}                       -> remove a report
 *
 * All of /api/admin/** is hasRole("ADMIN"), so every function here
 * belongs behind the ROLE_ADMIN route guard.
 *
 * Optional query parameters are omitted rather than sent empty. The
 * backend binds `role` to the Role enum and `status` to ReportStatus,
 * and an empty string fails that conversion with 400 instead of being
 * read as "no filter".
 * ============================================================================
 */

/**
 * Platform statistics for the dashboard.
 *
 * @returns DashboardResponse -> { totalUsers, totalCitizens,
 *          totalCleaners, totalAdmins, totalReports, pendingReports,
 *          completedReports, verifiedCleanups, totalComments,
 *          totalVotes, topCleaner }
 *
 * topCleaner is null until at least one cleaner has earned points.
 */
export async function getDashboard() {
    const response = await axiosClient.get(`${ADMIN_API}/dashboard`);

    return response.data;
}

/**
 * Registered users, optionally narrowed to one role.
 *
 * @param {string} [role] - ROLE_CITIZEN | ROLE_CLEANER | ROLE_ADMIN
 * @returns Array of UserSummaryResponse
 */
export async function getUsers(role) {
    const response = await axiosClient.get(`${ADMIN_API}/users`, {
        // Sending role=ALL or role="" would be rejected by the enum binding
        params: role ? { role } : undefined,
    });

    return response.data;
}

/**
 * Search users by name or email, optionally within one role.
 *
 * `keyword` is required by the controller, so a blank search must be
 * handled by the caller rather than sent as an empty parameter.
 *
 * @param {string} keyword - part of a name or email address
 * @param {string} [role] - optional role filter
 * @returns Array of UserSummaryResponse
 */
export async function searchUsers(keyword, role) {
    const response = await axiosClient.get(`${ADMIN_API}/users/search`, {
        params: {
            keyword,
            ...(role ? { role } : {}),
        },
    });

    return response.data;
}

/**
 * Full details of one user, including activity counts.
 *
 * @param {number|string} userId
 * @returns UserDetailsResponse -> summary fields plus cleanerType,
 *          organizationName, completedCleanups, reportsCreated,
 *          comments, votes
 */
export async function getUserDetails(userId) {
    const response = await axiosClient.get(`${ADMIN_API}/users/${userId}`);

    return response.data;
}

/**
 * Promote a citizen to administrator.
 *
 * The backend rejects anything other than a citizen with 400 and an
 * explanatory message, so the UI hides the control for other roles and
 * still surfaces the message if the rule is hit.
 *
 * @param {number|string} userId
 * @returns SuccessResponse -> { message, timestamp }
 */
export async function promoteToAdmin(userId) {
    const response = await axiosClient.put(
        `${ADMIN_API}/users/${userId}/promote`
    );

    return response.data;
}

/**
 * Delete a citizen or a cleaner.
 *
 * Refused with 400 when the account is an administrator, or when the
 * cleaner has ever claimed a cleanup assignment - deleting them would
 * leave that cleanup history without an owner.
 *
 * @param {number|string} userId
 * @returns SuccessResponse -> { message, timestamp }
 */
export async function deleteUser(userId) {
    const response = await axiosClient.delete(`${ADMIN_API}/users/${userId}`);

    return response.data;
}

/**
 * Search reports by title, city, state or pincode.
 *
 * One keyword is matched against all four fields by the backend, so
 * there is no need to ask the administrator which one they mean.
 *
 * @param {string} keyword
 * @returns Array of ReportResponse
 */
export async function searchReports(keyword) {
    const response = await axiosClient.get(`${ADMIN_API}/reports/search`, {
        params: { keyword },
    });

    return response.data;
}

/**
 * Filter reports by status, city and state.
 *
 * Every parameter is optional and they combine. City and state are
 * matched exactly (case-insensitively), not as a substring, which is
 * what separates this from the search above.
 *
 * @param {Object} filters - { status, city, state }
 * @returns Array of ReportResponse
 */
export async function filterReports({ status, city, state } = {}) {
    const params = {};

    // Only send what was actually chosen - see the note at the top
    if (status) {
        params.status = status;
    }

    if (city && city.trim()) {
        params.city = city.trim();
    }

    if (state && state.trim()) {
        params.state = state.trim();
    }

    const response = await axiosClient.get(`${ADMIN_API}/reports/filter`, {
        params,
    });

    return response.data;
}

/**
 * Delete a report and everything attached to it.
 *
 * The backend removes the Cloudinary image, votes, comments, the
 * cleanup assignment, reward history and feed analytics, and deducts
 * the points a cleaner earned for it. None of that can be undone, so
 * callers must confirm with the administrator first.
 *
 * @param {number|string} reportId
 * @returns SuccessResponse -> { message, timestamp }
 */
export async function deleteReport(reportId) {
    const response = await axiosClient.delete(
        `${ADMIN_API}/reports/${reportId}`
    );

    return response.data;
}
