/**
 * ============================================================================
 * API Configuration
 * ============================================================================
 *
 * Central place for backend URLs.
 * Never hardcode URLs inside components or services.
 * ============================================================================
 */

/**
 * Spring Boot Backend URL
 */
export const API_BASE_URL = "http://localhost:8080";

/**
 * Authentication APIs
 */
export const AUTH_API = "/api/auth";

/**
 * Garbage Report APIs (Phase 2)
 */
export const REPORTS_API = "/api/reports";

/**
 * Community Voting APIs (Phase 6)
 *
 * Restricted to ROLE_CITIZEN in the backend SecurityConfig,
 * so other roles receive 403 and must not be shown the control.
 */
export const VOTES_API = "/api/votes";

/**
 * Community Discussion APIs (Phase 7)
 *
 * Open to every authenticated role (citizen, cleaner, admin).
 */
export const COMMENTS_API = "/api/comments";


/**
 * Longer timeout for report creation.
 * Creating a report uploads an image and waits for AI image
 * validation on the backend, so it needs more than the default 10s.
 */
export const UPLOAD_TIMEOUT = 120000;
