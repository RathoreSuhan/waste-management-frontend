import { useRef } from "react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/common/Pagination";
import ActiveCleanupCard from "@/components/municipal/ActiveCleanupCard";
import usePagination from "@/hooks/usePagination";
import useAssignments from "@/hooks/useAssignments";

import { getActiveCleanups } from "@/services/municipalService";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * Active Cleanups (Phase 15 - Municipal Corporation Console)
 * ============================================================================
 *
 * Monitoring desk, not a decision desk. Every assignment your corporation has
 * already awarded appears here while the work is running:
 *
 *   ASSIGNED         - approved, cleaner has not reached the site yet
 *   IN_PROGRESS      - cleaner started on site within 50 m and is working
 *   REWORK_REQUIRED  - you returned an earlier submission; work continues
 *
 * There are no approve/reject buttons on this page by design. Nothing is
 * decided until the cleaner submits proof, at which point the assignment moves
 * to the Completion Review desk. Open a card's review file to read the
 * cleaner's activity diary and the approval history so far.
 * ============================================================================
 */

export default function ActiveCleanupsPage() {

    // Same list hook the other queues use; the fetcher is a stable import.
    const { assignments, loading, error, reload } = useAssignments(getActiveCleanups);

    // Anchor for the jump back up when the page changes.
    const listTopRef = useRef(null);

    // Ten cleanups to a page.
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(assignments);

    return (
        <div>
            <PageHeading
                title="Active Cleanups"
                titleHi="चालू सफाई"
                subtitle="Assignments your corporation has awarded and that are currently under way."
            />

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing running right now */}
            {!loading && !error && assignments.length === 0 && (
                <ReportListEmpty
                    title="No cleanups in progress"
                    description="Approve a cleanup proposal to assign a site. Once the cleaner begins work, the assignment will be tracked here."
                />
            )}

            {!loading && !error && assignments.length > 0 && (
                <>
                    {/* Sets expectations: this page watches, it does not decide */}
                    <div className="mb-4">
                        <Alert type="info" title="Monitoring Only">
                            No approval is taken on this page. When a cleaner submits
                            before/after proof, the assignment moves to Completion Review
                            for your decision.
                        </Alert>
                    </div>

                    <div ref={listTopRef} className="space-y-3">
                        {pageItems.map((assignment) => (
                            <ActiveCleanupCard
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