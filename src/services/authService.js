import axiosClient from "@/api/axiosClient";
import { AUTH_API, COLD_START_TIMEOUT } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Authentication Service
 * ============================================================================
 *
 * Handles all authentication-related API calls.
 *
 * Usage:
 * - Pages should NEVER call Axios directly
 * - Always use this service as the single source of API truth
 *
 * Two ways to create an account, differing only in how the address is proved:
 * register() emails a six-digit code to whatever was typed, googleRegister()
 * takes it from a token Google signed. Neither accepts an address on trust.
 * ============================================================================
 */

/**
 * Register User
 *
 * Called twice for one sign-up. Without a verificationCode the backend emails
 * one and answers { verificationRequired: true, email }, creating nothing. With
 * it, the account is created and a Clean Bharat JWT comes back.
 *
 * The whole form goes on both calls - nothing is parked on the server between
 * them, and every rule is re-checked at the moment the account is created.
 *
 * @param {Object} registerData - { name, email, password, role, state, city,
 *        cleanerType?, organizationName?, verificationCode? }
 * @returns Backend RegisterResponse { verificationRequired, token, email, role }
 * @throws Error with message from backend or generic message
 */
export async function register(registerData) {

    // Errors propagate untouched, as in login below
    const response = await axiosClient.post(
        `${AUTH_API}/register`,
        registerData,

        // Same cold-start budget as login, for the same reason
        { timeout: COLD_START_TIMEOUT }
    );

    return response.data;
}


/**
 * Login User
 *
 * Serves accounts created through either sign-up route, and municipal bodies,
 * whose password is issued by an administrator.
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
 * Sign in with a Google credential.
 *
 * The credential is the ID token Google handed the browser. It is the only
 * thing sent: the backend reads the address, the account id and whether Google
 * verified that address out of the signed token, so there is nothing here for
 * a caller to claim about themselves.
 *
 * @param {string} credential - Google ID token from Google Identity Services
 * @returns GoogleAuthResponse - either { registrationRequired: false, token,
 *          email, name, role }, or { registrationRequired: true, email, name }
 *          for a Google account that has no Clean Bharat account yet
 * @throws Error with message from backend or generic message
 */
export async function googleSignIn(credential) {

    // Errors propagate untouched, as in login above
    const response = await axiosClient.post(
        `${AUTH_API}/google`,
        { credential },

        // Same cold-start budget as login, for the same reason
        { timeout: COLD_START_TIMEOUT }
    );

    return response.data;
}


/**
 * Complete a first-time Google sign-up.
 *
 * The same credential is sent again on purpose. The call above issued nothing
 * and authorised nothing - it only reported that no account existed yet - so
 * the backend verifies the credential a second time before creating anything.
 *
 * @param {Object} registrationData - { credential, name, role, state, city,
 *        cleanerType?, organizationName? }
 * @returns GoogleAuthResponse { registrationRequired: false, token, email, name, role }
 * @throws Error with message from backend or generic message
 */
export async function googleRegister(registrationData) {

    const response = await axiosClient.post(
        `${AUTH_API}/google/register`,
        registrationData,

        { timeout: COLD_START_TIMEOUT }
    );

    return response.data;
}
