import axios from "axios";

import { API_BASE_URL } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Axios Client
 * ============================================================================
 *
 * This is the single Axios instance used throughout the application.
 *
 * Future responsibilities:
 * - Attach JWT automatically
 * - Global error handling
 * - Request logging
 * - Response interceptors
 * ============================================================================
 */

const axiosClient = axios.create({

    // Spring Boot Backend URL
    baseURL: API_BASE_URL,

    // Maximum waiting time
    timeout: 10000,

    // Default request headers
    headers: {
        "Content-Type": "application/json",
    },

});

/**
 * Export Axios Client
 */
export default axiosClient;