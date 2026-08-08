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