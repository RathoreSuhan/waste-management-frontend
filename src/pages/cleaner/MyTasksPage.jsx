import { useState } from "react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import TaskCard from "@/components/cleanup/TaskCard";
import CleanupUploadDialog from "@/components/cleanup/CleanupUploadDialog";
import useAssignments from "@/hooks/useAssignments";
import { getMyTasks, startCleanup } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import { ASSIGNMENT_STATUS } from "@/constants/assignmentConstants";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * My Tasks (Phase 8)
 * ============================================================================
 *
 * Every assignment belonging to the logged-in cleaner, grouped by lifecycle
 * stage so the work that needs attention sits at the top.
 *
 * A single /my-tasks call feeds all four groups. The backend also offers
 * /claimed, /in-progress and /completed, but calling one endpoint and
 * grouping locally avoids three round trips that can disagree with each
 * other when a task changes state between requests.
 * ============================================================================
 */

// Groups in the order a cleaner works through them
const GROUPS = [
    {
        status: ASSIGNMENT_STATUS.IN_PROGRESS,
        title: "In Progress",
        description: "Work you have started. Upload a photograph once the site is clear.",
    },
    {
        status: ASSIGNMENT_STATUS.CLAIMED,
        title: "Claimed",
        description: "Tasks you have taken on but not yet started.",
    },
    {
        status: ASSIGNMENT_STATUS.COMPLETED,
        title: "Completed",
        description: "Cleanups verified by AI and closed.",
    },
];

export default function MyTasksPage() {

    // Every task of this cleaner, in all states
    const { assignments, loading, error, reload, refresh } =
        useAssignments(getMyTasks);

    // Assignment currently being started
    const [startingId, setStartingId] = useState(null);

    // Assignment whose upload dialog is open
    const [uploadTarget, setUploadTarget] = useState(null);

    // Feedback from the most recent action
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");

    /**
     * Move a claimed task into active work.
     * The backend requires this before it will accept a cleanup photograph.
     */
    async function handleStart(assignment) {

        setStartingId(assignment.assignmentId);
        setActionError("");
        setActionMessage("");

        try {
            await startCleanup(assignment.assignmentId);

            setActionMessage(
                `Work started on "${assignment.reportTitle}". Upload a photograph once the site is clear.`
            );

            // Quietly move the card into the In Progress group
            refresh();
        } catch (requestError) {
            setActionError(
                getErrorMessage(
                    requestError,
                    "This task could not be started. Please try again."
                )
            );
        } finally {
            setStartingId(null);
        }
    }

    /**
     * Called only when AI accepted the cleanup, so the task can move to
     * Completed. A rejected upload leaves everything exactly as it was.
     */
    function handleVerified() {
        setActionMessage(
            "Cleanup verified. The report has been marked resolved and your reward recorded."
        );

        refresh();
    }

    // Split the flat list into lifecycle groups for display
    const grouped = GROUPS.map((group) => ({
        ...group,
        items: assignments.filter(
            (assignment) => assignment.assignmentStatus === group.status
        ),
    }));

    // True when the cleaner has no assignments at all
    const empty = assignments.length === 0;

    return (
        <div>
            <PageHeading
                title="My Tasks"
                titleHi="मेरे कार्य"
                subtitle="Cleanup work you have claimed, in progress, and completed."
            />

            {actionMessage && (
                <div className="mb-4">
                    <Alert type="success" title="Updated">
                        {actionMessage}
                    </Alert>
                </div>
            )}

            {actionError && (
                <div className="mb-4">
                    <Alert type="error" title="Action Failed">
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

            {/* No work claimed yet - point at where to find some */}
            {!loading && !error && empty && (
                <ReportListEmpty
                    title="No tasks yet"
                    description="You have not claimed any cleanup work. Available Tasks lists the reports waiting in your area."
                    actionLabel="Browse Available Tasks"
                    actionTo="/cleaner/available"
                />
            )}

            {/* Lifecycle groups */}
            {!loading && !error && !empty && (
                <div className="space-y-8">
                    {grouped.map((group) => {

                        // Groups with nothing in them are simply omitted
                        if (group.items.length === 0) {
                            return null;
                        }

                        return (
                            <section key={group.status}>

                                <div className="mb-3 border-b border-rule pb-2">
                                    <h2 className="font-serif text-lg font-bold text-gov-navy">
                                        {group.title}

                                        {/* Count, so the workload is obvious at a glance */}
                                        <span className="ml-2 text-sm font-normal text-ink-muted">
                                            ({group.items.length})
                                        </span>
                                    </h2>

                                    <p className="mt-0.5 text-sm text-ink-muted">
                                        {group.description}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {group.items.map((assignment) => (
                                        <TaskCard
                                            key={assignment.assignmentId}
                                            assignment={assignment}
                                            onStart={handleStart}
                                            onUpload={setUploadTarget}
                                            busyId={startingId}
                                        />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {/* AI verification dialog for the selected task */}
            {uploadTarget && (
                <CleanupUploadDialog
                    assignment={uploadTarget}
                    onClose={() => setUploadTarget(null)}
                    onVerified={handleVerified}
                />
            )}
        </div>
    );
}
