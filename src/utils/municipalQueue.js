import {
    getProposalQueue,
    getProposalsForAssignment,
} from "@/services/municipalService";
import { isProposalEditable } from "@/constants/assignmentConstants";

/**
 * ============================================================================
 * Municipal proposal-queue helpers
 * ============================================================================
 *
 * One definition of "a proposal awaiting this corporation's decision", shared
 * by every screen that states the figure.
 *
 * It exists because the backend counts two different things and both are
 * legitimate:
 *
 *   /cleanup-approvals/proposal-queue      -> one row per SITE (assignment)
 *   /cleanup-approvals/assignment/{id}/proposals -> one row per PROPOSAL
 *
 * The dashboard summary counts assignments sitting in PROPOSAL_SUBMITTED, so
 * two cleaners bidding for the same site are one row there. The Proposal Review
 * desk decides per proposal, so the same situation is two rows here. Read from
 * the two places independently, the officer sees "1" on one screen and "2" on
 * the next and has no way to tell which is wrong.
 *
 * So both screens now derive their figures from the functions below. The
 * numbers agree by construction rather than by coincidence.
 * ============================================================================
 */

/**
 * Every proposal this corporation may still act on.
 *
 * Two levels, because the backend models sites and bids separately:
 *   1. the queue of SITES currently in PROPOSAL_SUBMITTED
 *   2. the competing PROPOSALS filed for each of those sites
 *
 * Only SUBMITTED / REVISION_REQUIRED rows are returned. A site stays in the
 * queue while even one live bid remains, so its already rejected or withdrawn
 * bids would otherwise be counted - and shown with decision buttons the
 * backend refuses.
 *
 * Declared at module level so the reference is stable: useAssignments re-runs
 * whenever the fetcher identity changes.
 *
 * @returns {Promise<Array>} CleanupProposalResponse[] - newest site first, oldest bid first
 */
export async function loadPendingProposals() {

    // Level 1: the sites where a municipal decision is due
    const queue = await getProposalQueue();

    if (queue.length === 0) {
        return [];
    }

    // Level 2: every competing plan for those sites, fetched in parallel
    const proposalsPerSite = await Promise.all(
        queue.map((site) => getProposalsForAssignment(site.assignmentId))
    );

    // Flattened to one row per proposal, then narrowed to the live ones
    return proposalsPerSite.flat().filter(isProposalEditable);
}

/**
 * How many distinct SITES the given proposals belong to.
 *
 * Lets both screens say "2 proposals across 1 site" rather than implying two
 * separate cleanups.
 *
 * @param {Array} proposals CleanupProposalResponse[]
 * @returns {number} distinct assignment count
 */
export function countProposalSites(proposals) {

    // Guard: the list is null while the first request is still in flight
    if (!Array.isArray(proposals)) {
        return 0;
    }

    return new Set(proposals.map((proposal) => proposal.assignmentId)).size;
}

/**
 * Live bids per site: assignmentId -> number of proposals still decidable.
 *
 * The backend's totalProposalsForAssignment counts EVERY row ever filed for a
 * site, including the ones already rejected, so a card using it would promise
 * more competing plans than the officer can actually see. This counts only
 * what the queue really holds.
 *
 * @param {Array} proposals CleanupProposalResponse[]
 * @returns {Map<number, number>} assignmentId -> live proposal count
 */
export function countLiveProposalsBySite(proposals) {
    const counts = new Map();

    // Guard: same first-load case as above
    if (!Array.isArray(proposals)) {
        return counts;
    }

    for (const proposal of proposals) {
        counts.set(
            proposal.assignmentId,
            (counts.get(proposal.assignmentId) ?? 0) + 1 // count only live bids
        );
    }

    return counts;
}