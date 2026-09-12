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
 *   GET    /api/admin/users?role=&page=&size=            -> one page, optional role
 *   GET    /api/admin/users/search?keyword=&role=&page=  -> one page of matches
 *   GET    /api/admin/users/{id}                         -> one user, in full
 *   PUT    /api/admin/users/{id}/promote                 -> citizen -> admin
 *   DELETE /api/admin/users/{id}                         -> remove a user
 *   GET    /api/admin/reports/search?keyword=&page=      -> one page of matches
 *   GET    /api/admin/reports/filter?...&page=&size=     -> one page of matches
 *   DELETE /api/admin/reports/{id}                       -> remove a report
 *
 * All of /api/admin/** is hasRole("ADMIN"), so every function here
 * belongs behind the ROLE_ADMIN route guard.
 *
 * Optional query parameters are omitted rather than sent empty. The
 * backend binds `role` to the Role enum and `status` to ReportStatus,
 * and an empty string fails that conversion with 400 instead of being
 * read as "no filter". Page and size are optional too: the backend
 * defaults to page 0, ten rows, and clamps an oversized page rather
 * than rejecting it.
 * ============================================================================
 */

/**
 * Query parameters that mean "not set" are dropped rather than sent.
 *
 * Same reason as in reportService: the backend binds `role` and `status`
 * to enums, and a blank value is a 400, not a neutral default.
 */
function compact(params) {
    return Object.fromEntries(
        Object.entries(params ?? {}).filter(
            ([, value]) => value !== undefined && value !== null && value !== "",
        ),
    );
}

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
 * One page of registered users, optionally narrowed to one role.
 *
 * @param {Object} [options]
 * @param {string} [options.role]      - ROLE_CITIZEN | ROLE_CLEANER | ROLE_ADMIN
 * @param {number} [options.page]      - zero-based page index
 * @param {number} [options.size]      - rows per page
 * @param {string} [options.sortBy]    - "createdAt" | "name" | "rewardPoints"
 * @param {string} [options.direction] - "asc" | "desc"
 * @returns PageResponse<UserSummaryResponse>
 */
export async function getUsers({ role, page, size, sortBy, direction } = {}) {
    const response = await axiosClient.get(`${ADMIN_API}/users`, {
        // Sending role=ALL or role="" would be rejected by the enum binding
        params: compact({ role, page, size, sortBy, direction }),
    });

    return response.data;
}

/**
 * One page of users matching a name or email fragment, optionally
 * within one role.
 *
 * `keyword` is required by the controller, so a blank search must be
 * handled by the caller rather than sent as an empty parameter.
 *
 * @param {string} keyword - part of a name or email address
 * @param {Object} [options]
 * @param {string} [options.role]      - optional role filter
 * @param {number} [options.page]      - zero-based page index
 * @param {number} [options.size]      - rows per page
 * @param {string} [options.sortBy]    - "createdAt" | "name" | "rewardPoints"
 * @param {string} [options.direction] - "asc" | "desc"
 * @returns PageResponse<UserSummaryResponse>
 */
export async function searchUsers(
    keyword,
    { role, page, size, sortBy, direction } = {},
) {
    const response = await axiosClient.get(`${ADMIN_API}/users/search`, {
        params: compact({ keyword, role, page, size, sortBy, direction }),
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
 * One page of reports matching a keyword against title, city, state or
 * pincode.
 *
 * One keyword is matched against all four fields by the backend, so
 * there is no need to ask the administrator which one they mean.
 *
 * @param {string} keyword
 * @param {Object} [options]
 * @param {number} [options.page]      - zero-based page index
 * @param {number} [options.size]      - rows per page
 * @param {string} [options.sortBy]    - "createdAt" | "engagementScore"
 * @param {string} [options.direction] - "asc" | "desc"
 * @returns PageResponse<ReportResponse>
 */
export async function searchReports(
    keyword,
    { page, size, sortBy, direction } = {},
) {
    const response = await axiosClient.get(`${ADMIN_API}/reports/search`, {
        params: compact({ keyword, page, size, sortBy, direction }),
    });

    return response.data;
}

/**
 * One page of reports filtered by status, city and state.
 *
 * Every parameter is optional and they combine. City and state are
 * matched exactly (case-insensitively), not as a substring, which is
 * what separates this from the search above.
 *
 * @param {Object} options - { status, city, state, page, size, sortBy, direction }
 * @returns PageResponse<ReportResponse>
 */
export async function filterReports({
    status,
    city,
    state,
    page,
    size,
    sortBy,
    direction,
} = {}) {
    const response = await axiosClient.get(`${ADMIN_API}/reports/filter`, {
        // Only send what was actually chosen - see the note at the top.
        // City and state are trimmed here rather than left to the caller,
        // so a stray space cannot turn "no filter" into a filter that
        // matches nothing.
        params: compact({
            status,
            city: city?.trim(),
            state: state?.trim(),
            page,
            size,
            sortBy,
            direction,
        }),
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
