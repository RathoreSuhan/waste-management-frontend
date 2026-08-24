import { useMemo, useRef } from "react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/common/Pagination";
import CompletedCleanupCard from "@/components/municipal/CompletedCleanupCard";
import usePagination from "@/hooks/usePagination";
import useAssignments from "@/hooks/useAssignments";

import { REVIEW_PAGE_SIZE } from "@/constants/paginationConstants";
import { getCompletedCleanups } from "@/services/municipalService";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * Cleanup History (Municipal Corporation Console)
 * ============================================================================
 *
 * The corporation's own record of closed work: every cleanup in this city that
 * an officer has approved.
 *
 * Why it needed a desk of its own
 * -------------------------------
 * Approving a completion removed the card from the console entirely - it left
 * the Completion Review queue and was never in Active Cleanups, so the review
 * file the officer had just been reading became unreachable from the sidebar.
 * The work was still there and still theirs; only the way in had gone. This
 * page is that way back in.
 *
 * Read-only by design. COMPLETED is final on the backend, so there is nothing
 * to decide here - each card links to the same review file the other desks use,
 * where the evidence and the full approval trail (including any rework rounds
 * that came before the sign-off) are on record.
 *
 * Ordering and paging
 * -------------------
 * Newest approval at the top, oldest at the bottom - the reverse of the cleaner's
 * activity diary, because this is a ledger of decisions rather than a narrative:
 * what was signed off most recently is what an officer is asked about. The
 * backend already orders it that way; the sort below only guarantees it.
 *
 * Five cards to a page. Each one carries a before/after photograph pair, so five
 * is already a tall page - the same figure the other municipal review desks use.
 * ============================================================================
 */

/**
 * Sortable timestamp for one closed cleanup, newest first.
 *
 * completedAt is the approval itself, which is what this list is about. A legacy
 * row saved before that column was populated falls back to the assignment id, so
 * it keeps a stable position instead of jumping to the top as a zero date.
 */
function completionOrder(assignment) {

    const approved = assignment.completedAt
        ? new Date(assignment.completedAt).getTime()
        : Number.NaN;

    return Number.isNaN(approved) ? (assignment.assignmentId ?? 0) : approved;
}

export default function CleanupHistoryPage() {

    // Same list hook the other municipal desks use; the fetcher is a stable import.
    const { assignments, loading, error, reload } = useAssignments(getCompletedCleanups);

    // Anchor for the jump back up when the page changes.
    const listTopRef = useRef(null);

    /*
      Newest approval first, guaranteed. Sorted on a copy, since the hook's array
      is state owned by useAssignments.
    */
    const orderedAssignments = useMemo(
        () => [...assignments].sort((a, b) => completionOrder(b) - completionOrder(a)),
        [assignments]
    );

    // Five closed cleanups to a page, latest at the top of page 1.
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(orderedAssignments, REVIEW_PAGE_SIZE);

    return (
        <div>
            <PageHeading
                title="Cleanup History"
                titleHi="सफाई इतिहास"
                subtitle="Cleanups your corporation has approved, most recently signed off first."
            />

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing approved yet - not a fault, just an early-days corporation */}
            {!loading && !error && total === 0 && (
                <ReportListEmpty
                    title="No completed cleanups yet"
                    description="A cleanup appears here once you approve its completion on the Completion Review desk. Nothing has been signed off for this corporation so far."
                />
            )}

            {!loading && !error && total > 0 && (
                <>
                    {/* Says plainly what the page is, and what it is not */}
                    <div className="mb-4">
                        <Alert type="info" title="Record Only">
                            These cleanups are closed and cannot be reopened from this
                            page. Open a card&apos;s review file to re-read the evidence
                            and the full approval trail, including any rework that was
                            requested before sign-off.
                        </Alert>
                    </div>

                    {/* space-y-4: a card here is tall and photograph-heavy, so a
                        wider gutter than the queue lists use keeps two adjacent
                        before/after pairs from reading as one block */}
                    <div ref={listTopRef} className="space-y-4">
                        {pageItems.map((assignment) => (
                            <CompletedCleanupCard
                                key={assignment.assignmentId}
                                assignment={assignment}
                            />
                        ))}

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                            onPageChange={goToPage}
                            itemLabel="cleanups"
                            scrollTargetRef={listTopRef}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
