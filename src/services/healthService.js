import axiosClient from "@/api/axiosClient";
import { HEALTH_API, HEALTH_PING_TIMEOUT } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Backend Health Service
 * ============================================================================
 *
 * One call, GET /api/health, used to wake the backend and to find out whether
 * it is up yet.
 *
 * The backend runs on a free plan that stops the container when nobody is
 * using it, and starting it again takes close to a minute. BackendStatusContext
 * calls this as soon as the site opens so the container starts early, and keeps
 * calling it until it answers - which is also how the site knows whether to
 * explain the wait to the reader.
 *
 * The endpoint is public and touches no database, so this works before anyone
 * has signed in and costs the server almost nothing.
 * ============================================================================
 */

/**
 * Ping the backend once.
 *
 * @param {Object} [options]
 * @param {number} [options.timeout] - per-attempt budget, defaults to
 *        HEALTH_PING_TIMEOUT
 * @returns {Promise<Object>} the backend's { status: "UP" } body
 * @throws the Axios error, so the caller can decide whether to try again
 */
export async function pingBackend({ timeout = HEALTH_PING_TIMEOUT } = {}) {

    /*
      Errors are deliberately not caught here, as in authService: the caller
      runs the retry loop and is the only one that knows how much of its
      budget is left.

      skipColdStartRetry, because this call *is* the cold-start probe. The
      retry axiosClient gives an ordinary GET would silently stretch one
      attempt to ninety seconds and the notice would never appear.
    */
    const response = await axiosClient.get(HEALTH_API, {
        timeout,
        skipColdStartRetry: true,
    });

    return response.data;
}
