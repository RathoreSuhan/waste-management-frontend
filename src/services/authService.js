import axiosClient from "@/api/axiosClient";
import { AUTH_API } from "@/constants/apiConstants";

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
        loginData
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
        registerData
    );

    // Backend returns simple string message
    return response.data;
}


