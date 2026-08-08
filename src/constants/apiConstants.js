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
 * Cleanup Assignment APIs (Phase 8)
 *
 * Used by ROLE_CLEANER to claim pending assignments, start cleanup
 * work, upload completion proof, and list tasks by lifecycle state.
 *
 * Note: these endpoints are NOT role-restricted in the backend
 * SecurityConfig - they fall through to anyRequest().authenticated().
 * The service layer rejects non-cleaners with 403, but frontend gating
 * is not a security control; worth a hasRole("CLEANER") matcher later.
 */
export const CLEANUP_ASSIGNMENTS_API = "/api/cleanup-assignments";

/**
 * Reward APIs (Phase 9)
 *
 * Points earned by a cleaner for AI-verified cleanups.
 *
 * Note the summary path is /me, not /my-summary.
 *
 * Same caveat as the assignment endpoints: /api/rewards/** is NOT
 * role-restricted in the backend SecurityConfig. RewardServiceImpl
 * rejects non-cleaners, but a hasRole("CLEANER") matcher would be
 * the correct place to enforce that.
 */
export const REWARDS_API = "/api/rewards";

/**
 * Public Feed APIs (Phase 10)
 *
 * AI-verified completed cleanups, shown as community success stories.
 *
 * Listed under permitAll() in the backend SecurityConfig, so these
 * endpoints work while logged out and must never assume a token.
 *
 * This is also the only public source of an after-cleanup image:
 * ReportResponse carries just imageUrl, so a resolved report has to
 * read its after photograph from here.
 *
 * Caveat: the view/like/share endpoints take no user identity and do
 * no de-duplication, so the counts can be inflated by repeat calls.
 */
export const PUBLIC_FEED_API = "/api/public-feed";

/**
 * Engagement Analytics APIs (Phase 8)
 *
 * Engagement score = urgency score + (comments x 2) + (replies x 1),
 * recalculated by the backend on every vote, comment and reply.
 *
 * NOT listed under permitAll() in the backend SecurityConfig, so these
 * endpoints fall through to anyRequest().authenticated() and cannot be
 * used on the logged-out homepage.
 *
 * Note the trending response carries only counts and ids - no title,
 * image or timestamp - so it has to be joined against /api/reports to
 * be renderable. ReportResponse already includes engagementScore, so
 * the join is needed only for the comment and reply breakdown.
 */
export const ANALYTICS_API = "/api/analytics";

/**
 * Longer timeout for report creation.
 * Creating a report uploads an image and waits for AI image
 * validation on the backend, so it needs more than the default 10s.
 */
export const UPLOAD_TIMEOUT = 120000;
