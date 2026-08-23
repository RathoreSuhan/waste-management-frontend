import {
    getProposalQueue,
    getProposalsForAssignment,
} from "@/services/municipalService";
import {
    isProposalEditable,
    PROPOSAL_STATUS,
} from "@/constants/assignmentConstants";

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
 * Where each proposal status belongs in the review order.
 *
 * An untouched SUBMITTED bid is the only kind the officer can actually decide
 * right now; a REVISION_REQUIRED one is parked until its cleaner resubmits. So
 * the actionable rows come first and the parked ones sink to the bottom of
 * their site group.
 */
const PROPOSAL_REVIEW_PRIORITY = {
    [PROPOSAL_STATUS.SUBMITTED]: 0,         // needs a first decision
    [PROPOSAL_STATUS.REVISION_REQUIRED]: 1, // waiting on the cleaner
};

/**
 * Hidden marker carrying "how many sites failed to load" alongside the list.
 *
 * loadPendingProposals must keep returning a plain array (useAssignments stores
 * whatever it resolves to), so the count rides on the array itself as a
 * non-enumerable property instead of forcing a second request.
 */
const UNAVAILABLE_SITES_KEY = "__unavailableSites";

/**
 * Sort key for one proposal - unknown statuses sort last rather than crashing.
 */
function reviewPriority(proposal) {
    return PROPOSAL_REVIEW_PRIORITY[proposal.status] ?? 2;
}

/**
 * Millisecond timestamp used as the tie-breaker, tolerant of a missing date.
 */
function submittedTime(proposal) {
    return proposal.submittedAt ? new Date(proposal.submittedAt).getTime() : 0;
}

/**
 * Orders the bids filed for ONE site: actionable first, then oldest first.
 *
 * Applied per site so the site grouping the desk relies on stays intact.
 *
 * @param {Array} proposals CleanupProposalResponse[] for a single assignment
 * @returns {Array} new array, ordered for review
 */
function sortByReviewUrgency(proposals) {
    return [...proposals].sort((first, second) => {

        // Untouched bids outrank ones already sent back for revision
        const byPriority = reviewPriority(first) - reviewPriority(second);

        if (byPriority !== 0) {
            return byPriority;
        }

        return submittedTime(first) - submittedTime(second); // oldest bid first
    });
}

/**
 * Attaches the failed-site count without making it part of the list contents.
 */
function withUnavailableSites(proposals, unavailableSites) {
    Object.defineProperty(proposals, UNAVAILABLE_SITES_KEY, {
        value: unavailableSites,
        enumerable: false, // stays out of map/JSON - read it via countUnavailableSites
    });

    return proposals;
}

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
 * @returns {Promise<Array>} CleanupProposalResponse[] - newest site first, actionable bid first
 */
export async function loadPendingProposals() {

    // Level 1: the sites where a municipal decision is due
    const queue = await getProposalQueue();

    if (queue.length === 0) {
        return [];
    }

    // Level 2: every competing plan for those sites, fetched in parallel.
    // allSettled, not all: one unreachable site used to reject the whole batch
    // and blank the entire review desk, hiding every other pending decision.
    const results = await Promise.allSettled(
        queue.map((site) => getProposalsForAssignment(site.assignmentId))
    );

    const proposals = [];
    let unavailableSites = 0; // sites whose bids could not be fetched this time

    for (const result of results) {

        if (result.status !== "fulfilled") {
            unavailableSites += 1; // skipped, but the rest of the desk still loads
            continue;
        }

        // Narrowed to the live bids, then ordered inside this site's group
        proposals.push(...sortByReviewUrgency(result.value.filter(isProposalEditable)));
    }

    return withUnavailableSites(proposals, unavailableSites);
}

/**
 * How many sites were dropped from the last load because their request failed.
 *
 * Lets the desk admit "2 sites couldn't be loaded" instead of quietly showing
 * an incomplete queue as if it were the whole truth.
 *
 * @param {Array} proposals the array returned by loadPendingProposals
 * @returns {number} failed site count, 0 when everything loaded
 */
export function countUnavailableSites(proposals) {

    // Guard: null on first render, and derived copies carry no marker
    if (!Array.isArray(proposals)) {
        return 0;
    }

    return proposals[UNAVAILABLE_SITES_KEY] ?? 0;
}

/**
 * How many of the given proposals are parked awaiting a cleaner's revision.
 *
 * These still occupy the queue - the site cannot be awarded while they are
 * open - but no municipal decision is possible until the cleaner resubmits, so
 * the desk states them separately from the bids actually waiting on an officer.
 *
 * @param {Array} proposals CleanupProposalResponse[]
 * @returns {number} REVISION_REQUIRED count
 */
export function countAwaitingRevision(proposals) {

    // Guard: the list is null while the first request is still in flight
    if (!Array.isArray(proposals)) {
        return 0;
    }

    return proposals.filter(
        (proposal) => proposal.status === PROPOSAL_STATUS.REVISION_REQUIRED
    ).length;
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