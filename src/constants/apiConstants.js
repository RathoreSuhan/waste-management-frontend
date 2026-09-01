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
 *
 * Read from the build environment so the same source can serve a local
 * machine and a deployed site. Vite inlines VITE_ prefixed variables at
 * build time, so this is resolved when the bundle is produced, not when
 * it runs - changing it on the host requires a rebuild, which is why it
 * is set in the Vercel project settings rather than shipped in a file.
 *
 * The localhost fallback keeps `npm run dev` working with no .env
 * present, which is how the project has been developed so far.
 *
 * Trailing slashes are trimmed: every path constant below begins with a
 * slash, and a base ending in one would produce //api/reports.
 */
export const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(
        /\/+$/,
        ""
    );

/**
 * Authentication APIs
 */
export const AUTH_API = "/api/auth";

/**
 * Authenticated Account APIs
 */
export const ACCOUNT_API = "/api/account";

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
 * Used by ROLE_CLEANER to list open sites, start work the municipal
 * corporation has assigned, upload completion proof, and list tasks by
 * lifecycle state. Taking a site directly is no longer possible - see
 * CLEANUP_PROPOSALS_API below.
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
 * Leaderboard APIs (Phase 11)
 *
 * Live cleaner rankings, computed on demand from users, cleanup
 * assignments and reward history. There is no leaderboard table, so
 * the numbers are always current and nothing needs refreshing.
 *
 * The three ranking endpoints ARE listed under permitAll() in the
 * backend SecurityConfig:
 *   GET /api/leaderboard              -> national top 10
 *   GET /api/leaderboard/state/{state} -> state top 10
 *   GET /api/leaderboard/city/{city}   -> city top 10
 *
 * /api/leaderboard/me is the exception: it falls through to
 * anyRequest().authenticated(), and LeaderboardServiceImpl further
 * rejects any role other than ROLE_CLEANER, so it must only be called
 * from a signed-in cleaner's screen.
 *
 * Ranking is competition style - equal points share a rank and the
 * next rank skips - so duplicate rank numbers are correct, not a bug.
 */
export const LEADERBOARD_API = "/api/leaderboard";

/**
 * Municipal Corporation APIs (Phase 5)
 *
 * City-wise municipal contact details, maintained by administrators
 * instead of being hardcoded in the application.
 *
 * The whole path is restricted to hasRole("ADMIN") in the backend
 * SecurityConfig - GET included - so none of these calls can be made
 * from a citizen or cleaner screen, nor while logged out.
 *
 * Backend endpoints:
 *   POST   /api/municipal-corporations
 *   GET    /api/municipal-corporations
 *   GET    /api/municipal-corporations/{id}
 *   GET    /api/municipal-corporations/city/{city}
 *   PUT    /api/municipal-corporations/{id}
 *   DELETE /api/municipal-corporations/{id}
 *
 * Note: DELETE returns a plain string, not the usual JSON envelope,
 * so its body must not be read as { message }.
 */
export const MUNICIPAL_CORPORATIONS_API = "/api/municipal-corporations";

/**
 * Admin Portal APIs (Phase 12)
 *
 * Platform statistics, user administration and report administration.
 *
 * /api/admin/** is restricted to hasRole("ADMIN") in the backend
 * SecurityConfig, so every call here belongs behind the ROLE_ADMIN
 * route guard.
 *
 * Backend endpoints:
 *   GET    /api/admin/dashboard
 *   GET    /api/admin/users?role=
 *   GET    /api/admin/users/search?keyword=&role=
 *   GET    /api/admin/users/{id}
 *   PUT    /api/admin/users/{id}/promote
 *   DELETE /api/admin/users/{id}
 *   GET    /api/admin/reports/search?keyword=
 *   GET    /api/admin/reports/filter?status=&city=&state=
 *   DELETE /api/admin/reports/{id}
 *
 * Deleting a report is not a soft delete: the backend also removes the
 * Cloudinary image, votes, comments, the cleanup assignment, reward
 * history and feed analytics, and rolls back the cleaner's points.
 * Nothing about it can be undone from the UI, which is why both delete
 * actions are placed behind an explicit confirmation step.
 */
export const ADMIN_API = "/api/admin";

/**
 * Longer timeout for report creation.
 * Creating a report uploads an image and waits for AI image
 * validation on the backend, so it needs more than the default 10s.
 */
export const UPLOAD_TIMEOUT = 120000;


/**
 * Backend wake-up ping (free-plan cold start)
 *
 * The backend is hosted on a free plan that stops the container after a spell
 * with no traffic, and starting it again takes close to a minute. Nothing can
 * be served during that time - not even the login form's own request.
 *
 * So the site calls this endpoint the moment it opens, which starts the
 * container while the visitor is still reading the page. It is public, cheap
 * and touches no database - see HealthController on the backend.
 */
export const HEALTH_API = "/api/health";


/**
 * Cleanup proposal endpoints (ROLE_CLEANER only).
 *
 * A cleaner inspects an open site and submits a costed cleanup proposal here
 * instead of directly claiming the work, so several cleaners can compete for
 * the same site and a municipal officer decides who is awarded the cleanup.
 */
export const CLEANUP_PROPOSALS_API = "/api/cleanup-proposals";


/**
 * Cleanup activity log endpoints (ROLE_CLEANER only).
 *
 * The optional work diary an authorised cleaner keeps while a cleanup is
 * IN_PROGRESS. Multi-day jobs can be written up entry by entry; a small
 * one-day cleanup can be finished without a single entry.
 *
 * Restricted to hasRole("CLEANER") in the backend SecurityConfig, and the
 * service layer additionally checks that the caller is the cleaner the
 * municipality authorised for that assignment.
 *
 * Backend endpoints:
 *   POST   /api/cleanup-activity-logs/assignment/{assignmentId}  (multipart)
 *   GET    /api/cleanup-activity-logs/assignment/{assignmentId}
 *   DELETE /api/cleanup-activity-logs/{activityLogId}
 */
export const CLEANUP_ACTIVITY_LOGS_API = "/api/cleanup-activity-logs";


/**
 * Municipal approval endpoints (ROLE_MUNICIPAL_OFFICER only).
 *
 * The municipal officer's own desk: it is the corporation - not the platform
 * administrator - that authorises a cleaner and signs off finished work. Every
 * read and write here is scoped by the backend to the officer's own municipal
 * corporation (matched on the officer's city), so an officer never sees or
 * decides another city's cleanups.
 *
 * Restricted to hasRole("MUNICIPAL_OFFICER") in the backend SecurityConfig,
 * and CleanupApprovalServiceImpl re-checks jurisdiction on every call.
 *
 * Backend endpoints:
 *   GET  /api/cleanup-approvals/stats                              (dashboard counters)
 *   GET  /api/cleanup-approvals/proposal-queue                     (PROPOSAL_SUBMITTED)
 *   GET  /api/cleanup-approvals/assignment/{id}/proposals          (competing bids)
 *   POST /api/cleanup-approvals/proposal/{proposalId}              (approve & assign / reject / revise)
 *   GET  /api/cleanup-approvals/completion-queue                   (AWAITING_APPROVAL)
 *   POST /api/cleanup-approvals/completion/{assignmentId}          (approve / request rework)
 *   GET  /api/cleanup-approvals/active-cleanups                    (ASSIGNED..REWORK_REQUIRED)
 *   GET  /api/cleanup-approvals/assignment/{id}                    (single assignment detail)
 *   GET  /api/cleanup-approvals/assignment/{id}/activity-logs      (cleaner's work diary)
 *   GET  /api/cleanup-approvals/assignment/{id}/history            (decision trail)
 *
 * Note: the AI verdict carried on these responses is advisory evidence for the
 * officer. It never closes an assignment on its own - only an officer's
 * APPROVED completion decision does.
 */
export const CLEANUP_APPROVALS_API = "/api/cleanup-approvals";


/**
 * ============================================================================
 * Cold-start timings
 * ============================================================================
 *
 * All four values exist for one reason: the free host stops the backend when
 * it is idle, and the restart takes about fifty seconds. The default 10s
 * timeout in axiosClient is right for a running server and hopeless for one
 * that is still starting, so the paths that can meet a restart are given their
 * own budget rather than raising the default for everything.
 * ============================================================================
 */

/**
 * One warm-up attempt.
 *
 * Short on purpose. A starting container usually refuses the connection or
 * hangs, and there is nothing to be gained by waiting a long time on any
 * single attempt when the next one is 1.5s away.
 */
export const HEALTH_PING_TIMEOUT = 8000;

/**
 * Gap between warm-up attempts, so a restart is not hammered.
 */
export const WARMUP_RETRY_DELAY = 1500;

/**
 * How long the warm-up keeps trying before calling the server unreachable.
 *
 * Comfortably past the observed restart time: if two minutes of retries have
 * produced nothing, the problem is not a cold start and saying so is more
 * useful than a spinner that never resolves.
 */
export const WARMUP_MAX_WAIT = 120000;

/**
 * How long an unanswered ping is tolerated before the notice appears.
 *
 * A warm server replies in well under this, so a visitor arriving at a running
 * site never sees the notice at all. Anything slower is worth explaining.
 */
export const WAKE_NOTICE_AFTER = 2500;

/**
 * Request budget for anything that may be the call that starts the container:
 * sign-in, registration and the one retry axiosClient allows a timed-out GET.
 *
 * Sized above the observed restart with margin. It is not applied globally
 * because on a running server a request that takes this long is broken, not
 * slow, and should fail quickly.
 */
export const COLD_START_TIMEOUT = 90000;

