import { useRef, useState } from "react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import TaskCard from "@/components/cleanup/TaskCard";
import CleanupUploadDialog from "@/components/cleanup/CleanupUploadDialog";
import CleanupDisclaimerDialog from "@/components/cleanup/CleanupDisclaimerDialog";
import StartCleanupDialog from "@/components/cleanup/StartCleanupDialog";
import ActivityLogDialog from "@/components/cleanup/ActivityLogDialog";
import Pagination from "@/components/common/Pagination";
import useAssignments from "@/hooks/useAssignments";
import useCleanupDisclaimer from "@/hooks/useCleanupDisclaimer";
import usePagination from "@/hooks/usePagination";

import { getMyTasks } from "@/services/cleanupService";
import { ASSIGNMENT_STATUS } from "@/constants/assignmentConstants";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * My Tasks (Phase 8, extended in Phases 14-16)
 * ============================================================================
 *
 * Every assignment belonging to the logged-in cleaner, grouped by lifecycle
 * stage so the work that needs attention sits at the top.
 *
 * A single /my-tasks call feeds all the groups. The backend also offers
 * /claimed, /in-progress and /completed, but calling one endpoint and
 * grouping locally avoids three round trips that can disagree with each
 * other when a task changes state between requests.
 *
 * Nothing arrives here by being claimed any more. A task appears only once
 * the municipal corporation has approved this cleaner's proposal for it, at
 * which point the assignment carries ASSIGNED.
 *
 * Starting work is a two-step gate. The bilingual presence notice is shown
 * first, because the proof photograph is only accepted from within a fixed
 * radius of the reported location. Once acknowledged, StartCleanupDialog
 * captures the position the work actually began from - the backend stores it
 * as the start evidence for the cleanup and refuses an unapproved task.
 *
 * While a cleanup is in progress the cleaner may keep an optional activity
 * log. It exists for cleanups that run over several visits or days; a small
 * one-day job can be finished without a single entry.
 *
 * Uploading proof is not the end of the road. GPS and AI checks only advise
 * the municipal corporation; the officer then approves the completion or
 * sends the work back. A returned assignment carries REWORK_REQUIRED, which
 * reopens exactly the same actions as IN_PROGRESS - keep logging, then submit
 * fresh proof - so the cleaner can finish the job rather than lose it.
 * ============================================================================
 */

/*
  Groups in the order a cleaner works through them.

  Each group lists the statuses it collects rather than a single one, because
  approved work now carries ASSIGNED while rows created before the proposal
  workflow still carry CLAIMED. Both mean the same thing to the cleaner -
  yours, not yet started - so they are shown together.
*/
const GROUPS = [
    {
        /*
          Rework sits first, above even In Progress. It is the only group that
          the corporation is actively waiting on, and burying it under other
          work is how a returned cleanup gets forgotten.
        */
        key: "rework-required",
        statuses: [ASSIGNMENT_STATUS.REWORK_REQUIRED],
        title: "Rework Requested",
        description:
            "The municipal corporation reviewed your proof and asked for more work. Continue the cleanup, record what you do, then upload fresh proof - it returns for review automatically.",
    },
    {
        key: "in-progress",
        statuses: [ASSIGNMENT_STATUS.IN_PROGRESS],
        title: "In Progress",
        description:
            "Work you have started. Record activity entries if the job runs over several visits, and upload a photograph once the site is clear.",
    },
    {
        key: "assigned",
        statuses: [ASSIGNMENT_STATUS.ASSIGNED, ASSIGNMENT_STATUS.CLAIMED],
        title: "Assigned to You",
        description:
            "Approved by the municipal corporation and awaiting your start.",
    },
    {
        /*
          Proof accepted by AI but not yet signed off. Without this group the
          card would disappear the moment the upload succeeded, leaving the
          cleaner unsure whether the work had been recorded at all.
        */
        key: "awaiting-approval",
        statuses: [ASSIGNMENT_STATUS.AWAITING_APPROVAL],
        title: "Awaiting Municipal Approval",
        // Wording is careful: the officer may still return the work for rework
        description:
            "Proof checked by AI and forwarded to the municipal corporation. Nothing is needed from you unless an officer asks for rework.",
    },
    {
        key: "completed",
        statuses: [ASSIGNMENT_STATUS.COMPLETED],
        // Closure is a municipal decision, not an AI one - see Phase 15
        title: "Completed",
        description:
            "Cleanups approved by the municipal corporation and closed.",
    },
];

/**
 * One lifecycle group, with its own pager.
 *
 * This is a component rather than inline JSX because each group needs its
 * own page counter, and a hook cannot be called from inside a map callback.
 */
function TaskGroup({ group, onStart, onUpload, onActivityLog, busyId }) {

    // Ten tasks to a page, counted separately for each group
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(group.items);

    // Anchor for the jump back up when the page changes
    const groupTopRef = useRef(null);

    return (
        <section ref={groupTopRef}>

            <div className="mb-3 border-b border-rule pb-2">
                <h2 className="font-serif text-lg font-bold text-gov-navy">
                    {group.title}

                    {/* Count, so the workload is obvious at a glance */}
                    <span className="ml-2 text-sm font-normal text-ink-muted">
                        ({total})
                    </span>
                </h2>

                <p className="mt-0.5 text-sm text-ink-muted">
                    {group.description}
                </p>
            </div>

            <div className="space-y-3">
                {pageItems.map((assignment) => (
                    <TaskCard
                        key={assignment.assignmentId}
                        assignment={assignment}
                        onStart={onStart}
                        onUpload={onUpload}
                        // The card shows this only while the task is in progress
                        onActivityLog={onActivityLog}
                        busyId={busyId}
                    />
                ))}
            </div>

            <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onPageChange={goToPage}
                itemLabel="tasks"
                scrollTargetRef={groupTopRef}
            />
        </section>
    );
}

export default function MyTasksPage() {


    // Every task of this cleaner, in all states
    const { assignments, loading, error, reload, refresh } =
        useAssignments(getMyTasks);

    // Assignment whose start dialog is open
    const [startTarget, setStartTarget] = useState(null);

    // Assignment whose upload dialog is open
    const [uploadTarget, setUploadTarget] = useState(null);

    // Assignment whose activity log is open
    const [activityTarget, setActivityTarget] = useState(null);

    // Feedback from the most recent action
    const [actionMessage, setActionMessage] = useState("");

    /**
     * Open the start dialog for an assignment.
     *
     * No request is sent from here. StartCleanupDialog captures the cleaner's
     * position first and performs the call itself, because the backend records
     * that position as the start evidence for the cleanup.
     */
    function handleStart(assignment) {
        setActionMessage("");
        setStartTarget(assignment);
    }

    /*
      The notice stands between the card's Start button and handleStart, so the
      distance requirement is acknowledged before the cleaner travels.
    */
    const disclaimer = useCleanupDisclaimer(handleStart);

    /**
     * Called once the backend has moved the assignment to IN_PROGRESS.
     */
    function handleStarted(assignment) {
        setStartTarget(null);

        setActionMessage(
            `Work started on "${assignment.reportTitle}". You may record activity entries as the work proceeds, and must upload a photograph once the site is clear.`
        );

        // Quietly move the card into the In Progress group
        refresh();
    }

    /**
     * Called only when AI accepted the cleanup photograph.
     *
     * The task now waits on the municipal corporation: AI verification alone
     * neither closes the report nor releases the reward.
     */
    function handleVerified() {
        /*
          Deliberately does not congratulate the cleaner on finishing. The AI
          pass only forwards the proof; an officer may still request rework,
          in which case the task returns to the Rework Requested group above.
        */
        setActionMessage(
            "Cleanup proof checked by AI and sent to the municipal corporation for review. The report is closed and your reward recorded only once an officer approves the completion - if rework is requested, the task reopens for you."
        );

        refresh();
    }

    // Split the flat list into lifecycle groups for display
    const grouped = GROUPS.map((group) => ({
        ...group,
        // A group may cover more than one status - see GROUPS above
        items: assignments.filter((assignment) =>
            group.statuses.includes(assignment.assignmentStatus)
        ),
    }));

    // True when the cleaner has no assignments at all
    const empty = assignments.length === 0;

    return (
        <div>
            <PageHeading
                title="My Tasks"
                titleHi="मेरे कार्य"
                subtitle="Cleanup work assigned to you, in progress, and completed."
            />

            {actionMessage && (
                <div className="mb-4">
                    <Alert type="success" title="Updated">
                        {actionMessage}
                    </Alert>
                </div>
            )}

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing assigned yet - point at where proposals begin */}
            {!loading && !error && empty && (
                <ReportListEmpty
                    title="No tasks yet"
                    description="No cleanup work has been assigned to you yet. Inspect an available site and submit a proposal to be considered."
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
                            <TaskGroup
                                key={group.key}
                                group={group}
                                // Opens the notice; the start dialog follows on acceptance
                                onStart={disclaimer.requestAcknowledgement}
                                onUpload={setUploadTarget}
                                onActivityLog={setActivityTarget}
                                // The Start button stays busy while its dialog is open
                                busyId={startTarget?.assignmentId}
                            />
                        );
                    })}

                </div>
            )}

            {/* Location capture and the actual start call for the selected task */}
            {startTarget && (
                <StartCleanupDialog
                    assignment={startTarget}
                    onClose={() => setStartTarget(null)}
                    onStarted={() => handleStarted(startTarget)}
                />
            )}

            {/* AI verification dialog for the selected task */}
            {uploadTarget && (
                <CleanupUploadDialog
                    assignment={uploadTarget}
                    onClose={() => setUploadTarget(null)}
                    onVerified={handleVerified}
                />
            )}

            {/*
              Optional work diary. onChanged refreshes the list so the entry
              count on the card keeps pace with what was just recorded.
            */}
            {activityTarget && (
                <ActivityLogDialog
                    assignment={activityTarget}
                    onClose={() => setActivityTarget(null)}
                    onChanged={refresh}
                />
            )}

            {/* Presence undertaking - shown afresh every time work is started */}
            <CleanupDisclaimerDialog
                open={Boolean(disclaimer.pendingAssignment)}
                reportTitle={disclaimer.pendingAssignment?.reportTitle}
                onAccept={disclaimer.accept}
                onCancel={disclaimer.cancel}
            />
        </div>
    );
}