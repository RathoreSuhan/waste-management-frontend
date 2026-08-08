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
    try {
        const response = await axiosClient.post(
            `${AUTH_API}/login`,
            loginData
        );
        // Backend returns { token, email, role }
        return response.data;
    } catch (error) {
        // Re-throw with backend message if available
        throw error;
    }
}

/**
 * Register User
 *
 * @param {Object} registerData - { name, email, password, role, state, city, cleanerType?, organizationName? }
 * @returns Backend success message string
 * @throws Error with message from backend or generic message
 */
export async function register(registerData) {
    try {
        const response = await axiosClient.post(
            `${AUTH_API}/register`,
            registerData
        );
        // Backend returns simple string message
        return response.data;
    } catch (error) {
        // Re-throw with backend message if available
        throw error;
    }
}