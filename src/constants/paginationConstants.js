/**
 * ============================================================================
 * Pagination Constants
 * ============================================================================
 *
 * One page size for the whole portal.
 *
 * Every list endpoint on the backend returns its full result set in a
 * single array - there is no page parameter to pass. So paging happens
 * here, over the array already in memory: the request is unchanged, but
 * the reader is never handed four hundred rows at once.
 *
 * Ten is the figure the leaderboard already uses. The backend caps that
 * ranking at ten entries server-side, and matching it everywhere else
 * means a page of results is the same size wherever you are in the site.
 * ============================================================================
 */

export const PAGE_SIZE = 10;

/**
 * Page size for the municipal review desks.
 *
 * A cleanup proposal is not a row to be skimmed - the officer reads each plan,
 * compares it against the rival bids for the same site and writes remarks. Ten
 * of those on one screen buries the comparison, so the review lists (the
 * Proposal Review queue, and "Other proposals for this site" on a plan) page
 * five at a time. Everything else in the portal keeps PAGE_SIZE.
 */
export const REVIEW_PAGE_SIZE = 5;

/**
 * Page size for the cleaner's own record pages.
 *
 * A cleaner is not skimming a queue - they are reading their own work. My
 * Proposals mixes the bid that is still live with the ones the corporation has
 * already ruled on, and My Tasks mixes the site being cleaned today with sites
 * closed weeks ago. Ten of those on one screen buries the one card that matters
 * now under nine pieces of history.
 *
 * Five keeps the current card and its immediate history on one screen, and
 * pushes the rest behind a page button where it stays readable. The activity
 * diary uses the same figure, for the same reason: five entries is about as
 * much of a timeline as anyone reads at once.
 */
export const CLEANER_PAGE_SIZE = 5;

/**
 * The slice of `items` belonging to `page`.
 *
 * Pages are 1-based, because that is what the buttons say. A page past
 * the end returns an empty array rather than throwing - usePagination
 * clamps before it gets here, but a bare call should not be able to
 * blow up a render.
 */
export function paginate(items, page, pageSize = PAGE_SIZE) {

    if (!Array.isArray(items)) {
        return [];
    }

    const start = (page - 1) * pageSize;

    return items.slice(start, start + pageSize);
}

/**
 * How many pages `total` items need.
 *
 * An empty list still has one page, so the reader lands on page 1 with
 * an empty state rather than page 0 with nothing at all.
 */
export function countPages(total, pageSize = PAGE_SIZE) {
    return Math.max(1, Math.ceil(total / pageSize));
}
