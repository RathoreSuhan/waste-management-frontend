import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import TaskCard from "@/components/cleanup/TaskCard";
import Pagination from "@/components/common/Pagination";
import useAssignments from "@/hooks/useAssignments";
import usePagination from "@/hooks/usePagination";

import { getPendingAssignments, claimAssignment } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * Available Tasks (Phase 8)
 * ============================================================================
 *
 * Unclaimed cleanup assignments any cleaner may take on.
 *
 * The backend only lets a cleaner claim work inside their own registered city
 * and state, but the pending list is not filtered by that rule, so tasks from
 * elsewhere can appear here. Rather than hide that, a failed claim surfaces
 * the backend's explanation verbatim - it names the actual restriction.
 * ============================================================================
 */

export default function AvailableTasksPage() {

    const navigate = useNavigate();

    // Pending assignments, loaded once on mount
    const { assignments, loading, error, reload, refresh } =
        useAssignments(getPendingAssignments);

    // Assignment currently being claimed, so only that card shows a spinner
    const [claimingId, setClaimingId] = useState(null);

    // Result of the most recent claim attempt
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");

    // Ten tasks to a page
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(assignments);

    // Anchor for the jump back up when the page changes
    const listTopRef = useRef(null);

    /**
     * Take ownership of a pending assignment.
     */

    async function handleClaim(assignment) {

        setClaimingId(assignment.assignmentId);
        setActionError("");
        setActionMessage("");

        try {
            await claimAssignment(assignment.assignmentId);

            setActionMessage(
                `"${assignment.reportTitle}" is now yours. It has moved to My Tasks, where you can start work.`
            );

            /**
             * Quiet refresh - the claimed task drops off this list, and a
             * visible reload would blank the page mid-read for no reason.
             */
            refresh();
        } catch (requestError) {
            setActionError(
                getErrorMessage(
                    requestError,
                    "This task could not be claimed. Please try again."
                )
            );

            /**
             * Someone else may have claimed it first, so the list is
             * re-fetched to drop tasks that are no longer available.
             */
            refresh();
        } finally {
            setClaimingId(null);
        }
    }

    return (
        <div>
            <PageHeading
                title="Available Tasks"
                titleHi="उपलब्ध कार्य"
                subtitle="Unclaimed cleanup work reported by citizens. Claim a task to add it to your list."
            />

            {/* Outcome of the last claim */}
            {actionMessage && (
                <div className="mb-4">
                    <Alert type="success" title="Task Claimed">
                        {actionMessage}
                    </Alert>
                </div>
            )}

            {/* Backend refusals land here, including the city/state rule */}
            {actionError && (
                <div className="mb-4">
                    <Alert type="error" title="Could Not Claim Task">
                        {actionError}
                    </Alert>
                </div>
            )}

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing waiting - a good state, so it is worded positively */}
            {!loading && !error && assignments.length === 0 && (
                <ReportListEmpty
                    title="No tasks waiting"
                    description="Every reported site has been claimed. Check back later for newly reported waste in your area."
                />
            )}

            {/* Claimable work */}
            {!loading && !error && assignments.length > 0 && (
                <div ref={listTopRef} className="space-y-3">
                    {pageItems.map((assignment) => (
                        <TaskCard
                            key={assignment.assignmentId}
                            assignment={assignment}
                            onClaim={handleClaim}
                            busyId={claimingId}
                        />
                    ))}

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onPageChange={goToPage}
                        itemLabel="tasks"
                        scrollTargetRef={listTopRef}
                    />
                </div>

            )}

            {/* Route to the claimed work, shown once something was claimed */}
            {actionMessage && (
                <button
                    type="button"
                    onClick={() => navigate("/cleaner/tasks")}
                    className="mt-4 text-sm font-semibold text-gov-blue hover:underline"
                >
                    Go to My Tasks
                </button>
            )}
        </div>
    );
}
