import axiosClient from "@/api/axiosClient";
import { LOCATIONS_API, COLD_START_TIMEOUT } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Location Service
 * ============================================================================
 *
 * The state/district/ULB directory behind the sign-up form's cascading
 * selects. One call, no parameters: the backend serves the whole directory
 * (~810 KB) and the form filters it locally, so choosing a city never waits
 * on another request.
 *
 * Errors are deliberately not caught here. The caller - RegisterPage - shows
 * a Retry state instead, because a failed directory is not a form error the
 * visitor can fix by editing a field; it means registration cannot proceed
 * until the data arrives.
 * ============================================================================
 */

/**
 * Fetch the whole location directory.
 *
 * Carries COLD_START_TIMEOUT rather than the default: on the free host this
 * can be the request that wakes the container, and ~810 KB from a just-woken
 * JVM is not a 10-second ask. A GET, so axiosClient's one cold-start retry
 * also applies.
 *
 * @returns {Promise<Object>} the directory as served:
 *   { version, source: { file, sha256 }, counts: {...},
 *     states: [{ code, name, districts: [{ code, name, ulbs: [{ code, name, type }] }] }] }
 */
export async function getLocationDirectory() {
    const response = await axiosClient.get(LOCATIONS_API, {
        timeout: COLD_START_TIMEOUT,
    });
    return response.data;
}
