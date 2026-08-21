import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ClipboardList,
    Loader,
    CheckCircle2,
    ArrowRight,
    Search,
    Award,
    FileText,
} from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import StatCard from "@/components/common/StatCard";
import TaskCard from "@/components/cleanup/TaskCard";
import useAssignments from "@/hooks/useAssignments";
import { getMyTasks } from "@/services/cleanupService";
import { getMyRewardSummary } from "@/services/rewardService";
import { ASSIGNMENT_STATUS } from "@/constants/assignmentConstants";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * Cleaner Dashboard (Phase 8)
 * ============================================================================
 *
 * Summary of the cleaner's own workload.
 * Data comes from GET /api/cleanup-assignments/my-tasks.
 *
 * Every figure here is derived from that one response. Nothing is estimated:
 * a metric like "efficiency" would need a target time the backend does not
 * record, so the dashboard reports only what the API can actually support.
 * ============================================================================
 */

export default function CleanerDashboard() {

    // All assignments for this cleaner, in every state
    const { assignments, loading, error, reload } = useAssignments(getMyTasks);

    // Total reward points, loaded independently of the task list
    const [rewardPoints, setRewardPoints] = useState(null);

    /**
     * Fetch the reward total on its own.
     *
     * This is deliberately separate from the assignment request: rewards
     * are a secondary figure, so a failure here must not take down the
     * workload stats or the active task list. The card simply shows a
     * dash instead, and the rest of the dashboard is unaffected.
     */
    useEffect(() => {

        // Avoids setting state after unmount
        let active = true;

        getMyRewardSummary()
            .then((summary) => {
                if (active) {
                    setRewardPoints(summary?.totalRewardPoints ?? 0);
                }
            })
            .catch(() => {
                // Non-fatal - the card falls back to a dash
                if (active) {
                    setRewardPoints(null);
                }
            });

        return () => {
            active = false;
        };
    }, []);

    /**
     * Workload figures, counted from the task list.
     */
    const stats = useMemo(() => {

        // Guard against a non-array response
        const list = Array.isArray(assignments) ? assignments : [];

        /*
          Work the municipal corporation has awarded to this cleaner but
          which has not been started. CLAIMED is counted alongside ASSIGNED
          because rows created before the proposal workflow still carry it.
        */
        const assigned = list.filter(
            (task) =>
                task.assignmentStatus === ASSIGNMENT_STATUS.ASSIGNED ||
                task.assignmentStatus === ASSIGNMENT_STATUS.CLAIMED
        ).length;

        const inProgress = list.filter(
            (task) => task.assignmentStatus === ASSIGNMENT_STATUS.IN_PROGRESS
        ).length;

        const completed = list.filter(
            (task) => task.assignmentStatus === ASSIGNMENT_STATUS.COMPLETED
        ).length;

        return { assigned, inProgress, completed };
    }, [assignments]);

    /**
     * Tasks still to be finished, newest first.
     *
     * In-progress work is listed before assigned work because it is closer to
     * completion and only needs a photograph to close.
     */
    const activeTasks = useMemo(() => {

        const list = Array.isArray(assignments) ? assignments : [];

        return list
            .filter(
                (task) =>
                    task.assignmentStatus === ASSIGNMENT_STATUS.IN_PROGRESS ||
                    task.assignmentStatus === ASSIGNMENT_STATUS.ASSIGNED ||
                    // Legacy rows from before the proposal workflow
                    task.assignmentStatus === ASSIGNMENT_STATUS.CLAIMED
            )
            .sort((a, b) => {

                // In-progress first
                if (a.assignmentStatus !== b.assignmentStatus) {
                    return a.assignmentStatus === ASSIGNMENT_STATUS.IN_PROGRESS
                        ? -1
                        : 1;
                }

                // Then oldest report first - the longest waiting site matters most
                return new Date(a.reportCreatedAt) - new Date(b.reportCreatedAt);
            })
            .slice(0, 3);
    }, [assignments]);

    return (
        <div>
            <PageHeading
                title="Cleaner Dashboard"
                titleHi="सफाई कर्मचारी डैशबोर्ड"
                subtitle="Your current cleanup workload and recent progress."
            />

            <div className="space-y-6">

                {/* Key figures */}
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Assigned"
                        // Dash while the request is running
                        value={loading ? "—" : String(stats.assigned)}
                        description="Awarded to you by the corporation, not yet started."
                        accent="saffron"
                        icon={ClipboardList}
                    />
                    <StatCard
                        title="In Progress"
                        value={loading ? "—" : String(stats.inProgress)}
                        description="Work underway, awaiting a cleanup photograph."
                        accent="navy"
                        icon={Loader}
                    />
                    <StatCard
                        title="Completed"
                        value={loading ? "—" : String(stats.completed)}
                        description="Cleanups verified by AI and closed."
                        accent="green"
                        icon={CheckCircle2}
                    />
                    <StatCard
                        title="Reward Points"
                        // Dash until the total arrives, or if the request failed
                        value={rewardPoints === null ? "—" : String(rewardPoints)}
                        description="Earned across all verified cleanups."
                        accent="green"
                        icon={Award}
                    />
                </section>

                {/* Primary call to action, framed as a notice strip */}
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-gov border border-rule border-l-4 border-l-gov-blue bg-white p-5">
                    <div>
                        <h2 className="font-serif text-lg font-bold text-gov-navy">
                            Find cleanup work in your area
                        </h2>

                        {/*
                          Reworded for the proposal workflow: a site is no
                          longer taken by pressing a button first. The cleaner
                          inspects it, proposes for it, and the municipal
                          corporation decides.
                        */}
                        <p className="mt-1 text-sm text-ink-muted">
                            Citizens report uncollected waste every day. Inspect a site,
                            submit a cleanup proposal, and the municipal corporation
                            decides who carries out the work.
                        </p>
                    </div>

                    {/* Two steps of the same path, so both are offered here */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            to="/cleaner/available"
                            className="inline-flex items-center gap-2 rounded-gov border border-gov-blue bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                        >
                            <Search size={15} aria-hidden="true" />
                            Browse Available Tasks
                        </Link>

                        {/* Where a submitted proposal can be tracked or withdrawn */}
                        <Link
                            to="/cleaner/proposals"
                            className="inline-flex items-center gap-2 rounded-gov border border-rule bg-white px-5 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-paper"
                        >
                            <FileText size={15} aria-hidden="true" />
                            My Proposals
                        </Link>
                    </div>
                </section>

                {/* Work still open */}
                <section className="rounded-gov border border-rule bg-white">

                    {/* Section bar - tinted header strip keeps the grouping clear */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper px-5 py-3">
                        <h2 className="font-serif text-base font-bold text-gov-navy">
                            Active Tasks
                        </h2>

                        <Link
                            to="/cleaner/tasks"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-gov-blue hover:underline"
                        >
                            View all
                            <ArrowRight size={13} aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="p-5">

                        {/* Loading state */}
                        {loading && <ReportListSkeleton count={2} />}

                        {/* Error state with retry */}
                        {!loading && error && (
                            <ReportListError message={error} onRetry={reload} />
                        )}

                        {/* Data state */}
                        {!loading && !error && (
                            activeTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {activeTasks.map((assignment) => (
                                        <TaskCard
                                            key={assignment.assignmentId}
                                            assignment={assignment}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <ReportListEmpty
                                    title="No active tasks"
                                    description="You have no cleanup work in hand. Inspect an available site and submit a proposal to be considered for one."
                                    actionLabel="Browse Available Tasks"
                                    actionTo="/cleaner/available"
                                />
                            )
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
