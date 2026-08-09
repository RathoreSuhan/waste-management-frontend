import axiosClient from "@/api/axiosClient";
import { LEADERBOARD_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Leaderboard Service (Phase 11)
 * ============================================================================
 *
 * Live cleaner rankings.
 *
 * Backend endpoints:
 *   GET /api/leaderboard               -> national top 10   (public)
 *   GET /api/leaderboard/state/{state} -> state top 10      (public)
 *   GET /api/leaderboard/city/{city}   -> city top 10       (public)
 *   GET /api/leaderboard/me            -> personal ranking  (cleaner only)
 *
 * Every ranking endpoint returns the same LeaderboardResponse shape:
 *
 *   {
 *     leaderboardType: "NATIONAL" | "STATE" | "CITY",
 *     location: "India" | "Bihar" | "Patna",
 *     message: string,
 *     leaderboard: [ { rank, cleanerName, rewardPoints,
 *                      completedCleanups, aiVerifiedCleanups, badge } ]
 *   }
 *
 * When a state or city has no cleaners the backend still returns 200
 * with an empty array and an explanatory message, so an unknown place
 * is an empty result rather than an error.
 * ============================================================================
 */

/**
 * Empty response used when no location has been entered yet.
 *
 * The page calls its fetcher on every render pass, so returning this
 * shape keeps the caller free of null checks and, more importantly,
 * avoids sending a request for /state/undefined.
 */
const EMPTY_LEADERBOARD = {
    leaderboardType: null,
    location: "",
    message: "",
    leaderboard: [],
};

/**
 * Guarantee the array field exists.
 *
 * The backend builds an empty list for the no-data case, but a null
 * would break every caller that maps over it, so this is enforced here
 * rather than in each component.
 */
function normalise(response) {
    const data = response.data || {};

    return {
        ...data,
        leaderboard: data.leaderboard || [],
    };
}

/**
 * National top 10.
 *
 * Public - safe to call while logged out.
 */
export async function getNationalLeaderboard() {
    const response = await axiosClient.get(LEADERBOARD_API);

    return normalise(response);
}

/**
 * Top 10 cleaners in one state.
 *
 * The backend normalises case and trims the value through LocationUtil,
 * so "bihar", "Bihar" and " Bihar " all resolve to the same ranking.
 * encodeURIComponent is still required for names containing spaces,
 * such as "Uttar Pradesh".
 *
 * @param state State name typed by the visitor
 */
export async function getStateLeaderboard(state) {

    // No location yet - do not send /state/undefined to the backend
    if (!state || !state.trim()) {
        return EMPTY_LEADERBOARD;
    }

    const response = await axiosClient.get(
        `${LEADERBOARD_API}/state/${encodeURIComponent(state.trim())}`
    );

    return normalise(response);
}

/**
 * Top 10 cleaners in one city.
 *
 * @param city City name typed by the visitor
 */
export async function getCityLeaderboard(city) {

    // Same guard as the state lookup above
    if (!city || !city.trim()) {
        return EMPTY_LEADERBOARD;
    }

    const response = await axiosClient.get(
        `${LEADERBOARD_API}/city/${encodeURIComponent(city.trim())}`
    );

    return normalise(response);
}

/**
 * Personal ranking for the signed-in cleaner.
 *
 * Cleaner-only: LeaderboardServiceImpl throws
 * UnauthorizedAssignmentAccessException for any other role, so this
 * must not be called from a citizen or admin screen.
 *
 * @returns MyLeaderboardResponse -> { rank, cleanerName, badge,
 *          rewardPoints, completedCleanups, aiVerifiedCleanups,
 *          pointsToNextBadge }
 */
export async function getMyRanking() {
    const response = await axiosClient.get(`${LEADERBOARD_API}/me`);

    return response.data;
}
