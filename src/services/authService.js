import axiosClient from "@/api/axiosClient";
import { AUTH_API, COLD_START_TIMEOUT } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Authentication Service
 * ============================================================================
 *
 * Handles all authentication-related API calls.
 * Responsible for login, register, and future token refresh.
 *
 * Usage:
 * - Pages should NEVER call Axios directly
 * - Always use this service as the single source of API truth
 * ============================================================================
 */

/**
 * Login User
 *
 * @param {Object} loginData - { email, password }
 * @returns Backend AuthResponse { token, email, role }
 * @throws Error with message from backend or generic message
 */
export async function login(loginData) {

    /*
      Errors are deliberately not caught here.

      Callers turn an Axios error into wording for the screen through
      getErrorMessage, which needs the original error and its response
      body. Catching it here only to rethrow it unchanged added nothing.
    */
    const response = await axiosClient.post(
        `${AUTH_API}/login`,
        loginData,

        /*
          Sign-in is very often the call that meets a cold start: the visitor
          opens the site and presses the button before the container has
          finished starting. axiosClient's one-retry rule covers reads only -
          a POST must never be re-sent - so this needs the longer budget
          directly, or the request aborts at 10s while the server is still
          coming up.
        */
        { timeout: COLD_START_TIMEOUT }
    );

    // Backend returns { token, email, role }
    return response.data;
}


/**
 * Register User
 *
 * @param {Object} registerData - { name, email, password, role, state, city, cleanerType?, organizationName? }
 * @returns Backend success message string
 * @throws Error with message from backend or generic message
 */
export async function register(registerData) {

    // Errors propagate untouched, as in login above
    const response = await axiosClient.post(
        `${AUTH_API}/register`,
        registerData,

        // Same cold-start budget as login, for the same reason
        { timeout: COLD_START_TIMEOUT }
    );

    // Backend returns simple string message
    return response.data;
}


