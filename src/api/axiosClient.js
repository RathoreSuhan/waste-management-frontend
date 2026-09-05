import axios from "axios";

import { API_BASE_URL, AUTH_API, COLD_START_TIMEOUT } from "@/constants/apiConstants";
import { notifySessionExpired } from "@/api/sessionExpiry";

/**
 * ============================================================================
 * Axios Client
 * ============================================================================
 *
 * Central HTTP client for all API requests.
 *
 * Features:
 * - Automatically attaches JWT token from localStorage
 * - Single timeout configuration
 * - Global base URL setup
 * - One retry for a GET that met a backend cold start
 * - Ends the session in the app when the backend refuses the stored token
 * ============================================================================
 */

const axiosClient = axios.create({
    // Spring Boot Backend URL
    baseURL: API_BASE_URL,

    // Maximum waiting time (10 seconds)
    timeout: 10000,

    // Default request headers
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Request Interceptor
 * 
 * Automatically attaches JWT token to every request.
 * Token is read from localStorage (set during login).
 * Validates token format before attaching.
 */
axiosClient.interceptors.request.use(
    (config) => {
        // File uploads must never inherit the JSON default above.
        //
        // Axios v1 inspects the Content-Type before sending: when the body is
        // FormData *and* the header says application/json, it quietly converts
        // the FormData into a JSON string. The file is dropped and Spring
        // replies "Content-Type 'application/json' is not supported".
        //
        // Clearing the header lets the browser build the correct
        // multipart/form-data value together with its required boundary.
        if (typeof FormData !== "undefined" && config.data instanceof FormData) {
            if (typeof config.headers?.setContentType === "function") {
                // Axios 1.x exposes AxiosHeaders; false removes the header
                config.headers.setContentType(false);
            } else {
                delete config.headers["Content-Type"];
            }
        }

        // Read JWT token from browser storage
        const token = localStorage.getItem("token");


        // Only attach token if it exists AND is not empty/whitespace
        // Valid JWT token format: should start with "eyJ" (base64 encoded '{"')
        if (token && token.trim() && token.startsWith("eyJ")) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        // Handle request setup errors
        return Promise.reject(error);
    }
);

/**
 * Whether a failure looks like the backend still starting up, on a request
 * that is safe to send a second time.
 *
 * The backend is hosted on a free plan that stops the container when it is
 * idle; the restart takes about fifty seconds, during which requests either
 * hang until the 10s timeout above or are refused outright. Before this, the
 * first visit after a quiet spell left the home page, trending list,
 * leaderboard and report pages sitting in their error states, and the only
 * cure was for the reader to work out that a refresh would now succeed.
 *
 * Three deliberate limits:
 *
 * 1. GET only. A retry re-sends the request, and re-sending a POST could file
 *    a second report, cast a second vote or submit a proposal twice. Reads
 *    can be repeated safely; writes cannot, so they keep the short timeout
 *    and fail honestly.
 *
 * 2. No response at all. A server that answered - 4xx, 5xx, anything - is
 *    awake, and its answer is the truth. Only a timeout or a connection that
 *    never completed suggests a container that has not finished starting.
 *
 * 3. Once. A backend that is genuinely down still fails; it simply takes
 *    longer to say so.
 *
 * Individual calls can opt out with skipColdStartRetry - healthService does,
 * because that call is the cold-start probe itself.
 */
function isColdStartFailure(error) {

    const config = error?.config;

    if (!config || config.skipColdStartRetry || config.__coldStartRetried) {
        return false;
    }

    if (String(config.method).toLowerCase() !== "get") {
        return false;
    }

    // Timed out, or never reached a server that could answer
    return (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ERR_NETWORK" ||
        (Boolean(error.request) && !error.response)
    );
}

/**
 * Whether a 401 means the session this browser was holding has ended.
 *
 * Not every 401 does, so two conditions have to hold.
 *
 * 1. A token was in storage when the answer came back. Without one there is
 *    no session to end: the caller was a visitor reading a page that happens
 *    to need an account, and their own code already handles the refusal - the
 *    like button, for instance, invites them to sign in where they stand.
 *
 * 2. The request was not a sign-in attempt. The request interceptor attaches
 *    whatever token is in storage to every call, /api/auth/login included, so
 *    a stale token is present on the very request meant to replace it. A wrong
 *    password answers 401 too, and treating that as an expiry would clear the
 *    form's own "Invalid email or password" and bounce the visitor away from
 *    the page they were already on.
 */
function isSessionRejection(error, storedToken) {

    if (error.response?.status !== 401) {
        return false;
    }

    if (!storedToken) {
        return false;
    }

    return !String(error.config?.url || "").startsWith(AUTH_API);
}

/**
 * Response Interceptor
 *
 * Handle authentication errors globally.
 * If token is invalid/expired, clear it and end the session in the app.
 */
axiosClient.interceptors.response.use(
    (response) => {
        // Success response - return as-is
        return response;
    },
    (error) => {
        /*
          Give a read one more chance with a budget long enough to outlast a
          container start. The page keeps its loading state meanwhile, and the
          notice raised by BackendStatusContext explains the pause.
        */
        if (isColdStartFailure(error)) {

            const retryConfig = {
                ...error.config,

                // Marked so this can only ever happen once per request
                __coldStartRetried: true,

                timeout: COLD_START_TIMEOUT,
            };

            return axiosClient(retryConfig);
        }

        /*
          Read before anything is removed, so the check below sees the session
          as it was. It is also what keeps one lapsed session from raising the
          signal repeatedly: a page usually has several requests in flight, so
          several 401s arrive together, and only the first of them still finds
          a token here.
        */
        const storedToken = localStorage.getItem("token");

        // 401 with a token of our own = the session behind it has ended
        if (isSessionRejection(error, storedToken)) {

            // Clear the rejected credentials before anyone is told
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            /*
              Storage alone is not the session. React still holds it, which is
              why the header went on offering Sign Out to somebody the server
              had already stopped recognising. SessionExpiryWatcher picks this
              up, ends the session properly and sends them to sign in.
            */
            notifySessionExpired();
        }

        return Promise.reject(error);
    }
);

/**
 * Export Axios Client
 */
export default axiosClient;