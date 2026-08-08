import axios from "axios";

import { API_BASE_URL } from "@/constants/apiConstants";

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
 * Response Interceptor
 * 
 * Handle authentication errors globally.
 * If token is invalid/expired, clear it and redirect to login.
 */
axiosClient.interceptors.response.use(
    (response) => {
        // Success response - return as-is
        return response;
    },
    (error) => {
        // 401 Unauthorized = token expired or invalid
        if (error.response?.status === 401) {
            // Clear corrupted/expired token from storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            
            // Optionally redirect to login (if in browser, not in test/dev)
            if (typeof window !== "undefined") {
                // window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Export Axios Client
 */
export default axiosClient;