import { Link } from "react-router-dom";
import {
    MapPin,
    Building2,
    Clock,
    ShieldCheck,
    ExternalLink,
    ImageIcon,
    NotebookPen,
    History,        // the activity already on record, on its own page
    PlayCircle,
    Hourglass,      // proof lodged, corporation yet to rule on it
    RotateCcw,      // corporation sent the work back for rework
} from "lucide-react";

import AssignmentStatusBadge from "@/components/cleanup/AssignmentStatusBadge";
import Button from "@/components/ui/Button";
import { formatRelativeTime, formatDateTime } from "@/utils/formatters";
import {
    ASSIGNMENT_STATUS,
    canPropose,
    canStart,
    canUpload,
    formatConfidence,
} from "@/constants/assignmentConstants";

/**
 * ============================================================================
 * Task Card (Phase 8)
 * ============================================================================
 *
 * One cleanup assignment, with whichever action its current state allows.
 *
 * The card is deliberately self-contained. The backend exposes no
 * GET /api/cleanup-assignments/{id}, so there is no assignment detail page to
 * link to - everything a cleaner needs to act must be visible here.
 *
 * Actions follow the backend's strict lifecycle: propose for an open site,
 * start work the corporation awarded, then upload proof once started.
 * Completed tasks show the AI verdict instead of an action.
 *
 * Task 4 adds one secondary action alongside the proof upload - the optional
 * activity log. It sits next to "Upload Cleanup Proof" rather than replacing
 * it, because a work diary must never be a step on the way to finishing.
 * ============================================================================
 */

/*
  The action row mixes padded buttons with plain text links. Without a shared
  height the links float against the buttons, so both links carry a min-height
  equal to a Button's own (py-2.5 + text-sm + 1px border = 2.625rem). All four
  controls then share one centre line and one uniform gap.
*/
const ROW_LINK_CLASS =
    "inline-flex min-h-[2.625rem] items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline";

export default function TaskCard({
    assignment,
    // Handlers are optional; a list omits the ones it does not support
    onPropose,
    onStart,
    onUpload,
    // Opens the optional work diary for an in-progress cleanup
    onActivityLog,
    // Set when this cleaner still holds a LIVE proposal here (withdrawn ones do not count)
    alreadyProposed = false,
    // Id of the assignment currently mid-request, so only it shows a spinner
    busyId,
}) {

    // Whether this specific card is waiting on the backend
    const busy = busyId === assignment.assignmentId;

    /*
      Two post-submission states a cleaner must be able to tell apart at a
      glance. The AI verdict cannot say which one applies: it only advises
      the municipal officer, who alone closes or reopens the assignment.
    */
    const awaitingReview =
        assignment.assignmentStatus === ASSIGNMENT_STATUS.AWAITING_APPROVAL;

    const reworkRequired =
        assignment.assignmentStatus === ASSIGNMENT_STATUS.REWORK_REQUIRED;

    /*
      The site has been awarded: a cleaner is named on it and its status has
      moved past the proposal stage. Nobody else may bid, and this is a very
      different message from "your proposal is being reviewed" - one is the
      end of the road, the other is a wait.
    */
    const allocatedToAnotherCleaner =
        Boolean(assignment.cleanerId) && !canPropose(assignment);

    return (
        <article className="rounded-gov border border-rule bg-white">

            <div className="flex flex-col gap-4 p-4 sm:flex-row">

                {/* ---------------- Photograph ---------------- */}
                <div className="shrink-0">
                    {assignment.beforeImageUrl ? (
                        <img
                            src={assignment.beforeImageUrl}
                            alt={`Waste reported at ${assignment.address || "this location"}`}
                            className="h-32 w-full rounded-gov border border-rule object-cover sm:w-40"
                            loading="lazy"
                        />
                    ) : (
                        // Placeholder keeps the row aligned when an image is missing
                        <div className="flex h-32 w-full items-center justify-center rounded-gov border border-dashed border-rule bg-paper sm:w-40">
                            <ImageIcon
                                size={22}
                                className="text-ink-muted"
                                aria-hidden="true"
                            />
                        </div>
                    )}
                </div>

                {/* ---------------- Details ---------------- */}
                <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-serif text-base font-bold text-gov-navy">
                            {assignment.reportTitle}
                        </h3>

                        <AssignmentStatusBadge status={assignment.assignmentStatus} />
                    </div>

                    {/* Description is clamped so cards stay a predictable height */}
                    {assignment.reportDescription && (
                        <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                            {assignment.reportDescription}
                        </p>
                    )}

                    {/* Location, the detail a cleaner needs most */}
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-ink">
                        <MapPin
                            size={14}
                            className="mt-0.5 shrink-0 text-ink-muted"
                            aria-hidden="true"
                        />

                        <span>
                            {assignment.address || "Address not recorded"}
                            {assignment.city && (
                                <span className="text-ink-muted">
                                    {" "}&bull; {assignment.city}
                                </span>
                            )}
                        </span>
                    </p>

                    {/* Municipal corporation responsible for the area */}
                    {assignment.municipalCorporation && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                            <Building2 size={13} aria-hidden="true" />
                            {assignment.municipalCorporation}
                        </p>
                    )}

                    {/* Age of the report, which signals how overdue it is */}
                    {assignment.reportCreatedAt && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                            <Clock size={13} aria-hidden="true" />
                            <span title={formatDateTime(assignment.reportCreatedAt)}>
                                Reported {formatRelativeTime(assignment.reportCreatedAt)}
                            </span>
                        </p>
                    )}

                    {/*
                      When the work began, recorded the moment the cleaner
                      pressed Start on site. Useful on a multi-day cleanup,
                      where "reported 6 days ago" says nothing about progress.
                    */}
                    {assignment.startedAt && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted">
                            <PlayCircle size={13} aria-hidden="true" />
                            <span title={formatDateTime(assignment.startedAt)}>
                                Work started {formatRelativeTime(assignment.startedAt)}
                            </span>
                        </p>
                    )}

                    {/* ---------------- AI verdict on completed work ---------------- */}
                    {assignment.aiVerified && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-gov border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs text-green-900">
                            <ShieldCheck
                                size={13}
                                className="mt-0.5 shrink-0 text-india-green"
                                aria-hidden="true"
                            />

                            <span>
                                Verified by AI
                                {formatConfidence(assignment.aiConfidence) &&
                                    ` at ${formatConfidence(assignment.aiConfidence)} confidence`}
                                {assignment.completedAt &&
                                    ` on ${formatDateTime(assignment.completedAt)}`}
                            </span>
                        </p>
                    )}

                    {/*
                      Proof is lodged and with the corporation. Said plainly so
                      an AI pass is not mistaken for sign-off - the officer's
                      approval is what marks the assignment complete.
                    */}
                    {awaitingReview && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-gov border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs text-gov-navy">
                            <Hourglass
                                size={13}
                                className="mt-0.5 shrink-0 text-gov-blue"
                                aria-hidden="true"
                            />

                            <span>
                                Submitted for municipal review. The corporation
                                will approve the completion or ask for rework -
                                the AI check above is only advisory.
                            </span>
                        </p>
                    )}

                    {/*
                      Rework path. Officer remarks sit behind an approval-desk
                      endpoint this screen cannot read, so the card states what
                      the cleaner can act on: the work is open again, logging
                      continues, and fresh proof may be resubmitted.
                    */}
                    {reworkRequired && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-gov border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-900">
                            <RotateCcw
                                size={13}
                                className="mt-0.5 shrink-0 text-rose-600"
                                aria-hidden="true"
                            />

                            <span>
                                The municipal corporation has asked for rework.
                                Continue the cleanup, record what you do in the
                                activity log, then upload fresh proof - it goes
                                back for review automatically.
                                {assignment.aiRemarks &&
                                    ` Last AI note: ${assignment.aiRemarks}`}
                            </span>
                        </p>
                    )}

                    {/* ---------------- Actions ---------------- */}
                    {/* gap-x-3 separates the controls, gap-y-2 spaces them once they wrap */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">

                        {/* Propose - an open site is inspected and bid for, never claimed outright */}
                        {onPropose && canPropose(assignment) && !alreadyProposed && (
                            <Button
                                type="button"
                                fullWidth={false}
                                loading={busy}
                                onClick={() => onPropose(assignment)}
                            >
                                Inspect &amp; Propose
                            </Button>
                        )}

                        {/*
                          A live proposal of this cleaner's own is with the
                          officer. Shown only while the site is still open, and
                          only when the proposal has not been withdrawn - a
                          withdrawn offer returns the button above instead.
                        */}
                        {onPropose && canPropose(assignment) && alreadyProposed && (
                            <span className="text-xs font-semibold text-gov-blue">
                                Proposal submitted &bull; awaiting municipal review
                            </span>
                        )}

                        {/*
                          Someone else won the site. Said plainly so a cleaner
                          does not keep waiting for a decision that has already
                          been taken against them.
                        */}
                        {onPropose && allocatedToAnotherCleaner && (
                            <span className="text-xs font-semibold text-ink-muted">
                                Allocated to another cleaner &bull; proposals
                                closed for this site
                            </span>
                        )}

                        {/* Start - the backend requires this before any upload */}
                        {onStart && canStart(assignment) && (
                            <Button
                                type="button"
                                fullWidth={false}
                                loading={busy}
                                onClick={() => onStart(assignment)}
                            >
                                Start Cleanup
                            </Button>
                        )}

                        {/* Upload proof - only once work has started */}
                        {onUpload && canUpload(assignment) && (
                            <Button
                                type="button"
                                variant="success"
                                fullWidth={false}
                                onClick={() => onUpload(assignment)}
                            >
                                {/* Wording follows the state: a rework round is a
                                    resubmission, not a first submission. */}
                                {reworkRequired
                                    ? "Resubmit Cleanup Proof"
                                    : "Upload Cleanup Proof"}
                            </Button>
                        )}

                        {/*
                          Write an entry in the optional work diary. Offered only
                          while the cleanup is in progress, since the backend
                          refuses entries after that. Deliberately secondary
                          styling: it is a record, not a step towards completion.

                          The dialog only writes - reading is the link below.
                        */}
                        {onActivityLog && canUpload(assignment) && (
                            <Button
                                type="button"
                                variant="secondary"
                                fullWidth={false}
                                onClick={() => onActivityLog(assignment)}
                            >
                                <NotebookPen size={14} aria-hidden="true" />
                                Add Activity
                            </Button>
                        )}

                        {/*
                          Read what has been recorded so far.

                          Independent of canUpload: a cleaner is entitled to the
                          record of their own work after the proof has gone in,
                          when there is nothing left to add. Hidden when the
                          count is zero, so a task with no diary carries no
                          link to an empty page.
                        */}
                        {assignment.activityLogCount > 0 && (
                            <Link
                                to={`/cleaner/tasks/${assignment.assignmentId}/activity`}
                                // The log page cannot look a report up by id
                                state={{
                                    reportTitle: assignment.reportTitle,
                                    reportId: assignment.reportId,
                                }}
                                className={ROW_LINK_CLASS}
                            >
                                <History size={14} aria-hidden="true" />
                                {/* Count comes from the assignment response */}
                                View Activity ({assignment.activityLogCount})
                            </Link>
                        )}

                        {/* The report itself is always viewable for full context */}
                        <Link
                            to={`/reports/${assignment.reportId}`}
                            className={ROW_LINK_CLASS}
                        >
                            View Report
                            <ExternalLink size={13} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
