import axiosClient from "@/api/axiosClient";
import { VOTES_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Community Voting Service (Phase 6)
 * ============================================================================
 *
 * Citizens rate how urgent a garbage report is on a 1-5 scale.
 * The backend keeps one vote per citizen per report (a database unique
 * constraint on user_id + report_id) and simply overwrites the rating when
 * the same citizen votes again, so calling this twice is safe.
 *
 * Backend endpoint:
 * POST /api/votes -> submit or update a vote
 *
 * Note: the backend exposes no "read my vote" endpoint, so the frontend
 * cannot discover an existing rating on page load. Only the report's
 * average (urgencyScore) is available from the report itself.
 * ============================================================================
 */

/**
 * Submit or update the logged-in citizen's vote.
 *
 * @param {number|string} reportId - report being rated
 * @param {number} rating - urgency between 1 and 5
 * @returns Backend VoteResponse -> { reportId, rating, votedBy, urgencyScore }
 */
export async function submitVote(reportId, rating) {
    const response = await axiosClient.post(VOTES_API, {
        // Field names mirror VoteRequest on the backend
        reportId,
        rating,
    });

    return response.data;
}
