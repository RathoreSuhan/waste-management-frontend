import axiosClient from "@/api/axiosClient";
import { AUTH_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Authentication Service
 * ============================================================================
 *
 * Responsible only for authentication-related API calls.
 *
 * Login
 * Register
 * Logout (later)
 * Refresh Token (later)
 *
 * UI components should NEVER call Axios directly.
 * ============================================================================
 */

/**
 * Login User
 *
 * @param {Object} loginData
 * @returns Backend response
 */
export async function login(loginData) {

    const response = await axiosClient.post(

        `${AUTH_API}/login`,

        loginData

    );

    return response.data;
}

/**
 * Register User
 *
 * @param {Object} registerData
 * @returns Backend response
 */
export async function register(registerData) {

    const response = await axiosClient.post(

        `${AUTH_API}/register`,

        registerData

    );

    return response.data;
}