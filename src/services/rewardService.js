import axiosClient from "@/api/axiosClient";
import { REWARDS_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Reward Service (Phase 9)
 * ============================================================================
 *
 * Reward points a cleaner earns for AI-verified cleanups.
 *
 * Backend endpoints:
 *   GET /api/rewards/me      -> { cleanerName, totalRewardPoints }
 *   GET /api/rewards/history -> [ { points, reason, createdAt } ]
 *
 * Both are cleaner-only: RewardServiceImpl throws for any other role,
 * so these must never be called from a citizen or admin screen.
 * ============================================================================
 */

/**
 * Total points earned by the logged-in cleaner.
 *
 * The total is a cached column on the user row, not a sum over the
 * history, so it stays correct even as the ledger grows.
 *
 * @returns Backend RewardSummaryResponse -> { cleanerName, totalRewardPoints }
 */
export async function getMyRewardSummary() {
    const response = await axiosClient.get(`${REWARDS_API}/me`);

    return response.data;
}

/**
 * Individual reward entries, newest first.
 *
 * Ordering is done by the backend
 * (findByCleanerOrderByCreatedAtDesc), so the list is not re-sorted here.
 *
 * @returns Array of RewardHistoryResponse -> { points, reason, createdAt }
 */
export async function getMyRewardHistory() {
    const response = await axiosClient.get(`${REWARDS_API}/history`);

    // Guard against a null body so callers can always map over the result
    return response.data || [];
}
