/**
 * ============================================================================
 * Active Cleanup Card (Phase 16 - Municipal Officer console)
 * ============================================================================
 *
 * One awarded cleanup that is currently on the ground, rendered from the
 * backend CleanupAssignmentResponse.
 *
 * "Active" covers every state between the award and the officer's completion
 * review, which the backend defines as ASSIGNED, CLAIMED (legacy), IN_PROGRESS
 * and REWORK_REQUIRED. The card therefore has to read equally well for work
 * that has not started yet and for work that was sent back for rework, so it
 * leans on AssignmentStatusBadge instead of inventing its own wording.
 *
 * What an officer needs to see at a glance:
 *   - which site, and who was awarded it (name, cleaner type, organisation)
 *   - the live assignment status
 *   - when the cleaner actually started, and how far from the site they were
 *     when they did (the 50 m platform rule, measured server side)
 *   - how many activity-diary entries have been filed so far, which is the only
 *     real signal of ongoing effort before the final proof arrives
 *
 * The card links to the full review screen; it never records a decision itself,
 * because nothing is decidable until the cleaner submits completion proof.
 * ============================================================================
 */

import { Link } from "react-router-dom";
import { Building2, ClipboardList, MapPin, NotebookPen, PlayCircle, Ruler } from "lucide-react";
import BiText from "@/components/common/BiText";
import AssignmentStatusBadge from "@/components/cleanup/AssignmentStatusBadge";
import { ASSIGNMENT_STATUS, CLEANUP_PROOF_RADIUS_METRES } from "@/constants/assignmentConstants";
import { getCleanerTypeLabel } from "@/constants/municipalConstants";
import { formatDateTime, formatRelativeTime } from "@/utils/formatters";

export default function ActiveCleanupCard({ assignment }) {

    // Guard so a partially loaded list cannot break the officer's queue.
    if (!assignment) {
        return null;
    }

    // Distance recorded when the cleaner pressed "Start cleanup" - the only GPS
    // figure the backend persists for an assignment.
    const startDistance = assignment.startDistanceMeters;
    const hasStartDistance = startDistance !== null && startDistance !== undefined;
    const startWithinRadius = hasStartDistance && startDistance <= CLEANUP_PROOF_RADIUS_METRES;

    // Rework is the one active state that needs an explicit explanation, since
    // the officer themselves (or a colleague) sent the work back.
    const isRework = assignment.assignmentStatus === ASSIGNMENT_STATUS.REWORK_REQUIRED;

    return (
        <article className="rounded-gov border border-rule bg-paper p-4 shadow-sm sm:p-5">

            {/* Site + live status */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gov-navy sm:text-lg">
                        {assignment.reportTitle || `Report #${assignment.reportId}`}
                    </h3>
                    <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="min-w-0">
                            {assignment.address}
                            {assignment.city ? `, ${assignment.city}` : ""}
                        </span>
                    </p>
                </div>
                <AssignmentStatusBadge status={assignment.assignmentStatus} />
            </div>

            {/* Who is doing the work - the corporation is accountable for this choice */}
            <div className="mt-4 rounded-gov border border-rule bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                    <BiText en="Assigned cleaner" hi="नियुक्त सफाई कर्मी" />
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{assignment.cleanerName || "-"}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                    <span>{getCleanerTypeLabel(assignment.cleanerType)}</span>
                    {assignment.cleanerOrganization ? (
                        <span className="flex items-center gap-1.5">
                            <Building2 className="h-4 w-4" aria-hidden="true" />
                            {assignment.cleanerOrganization}
                        </span>
                    ) : null}

                    {/* Email is the corporation's only direct contact channel to the cleaner */}
                    {assignment.cleanerEmail ? <span className="truncate">{assignment.cleanerEmail}</span> : null}
                </div>
            </div>

            {/* Progress signals: start time, start GPS verdict, diary entry count */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2">
                    <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-ink-muted">
                            <BiText en="Started" hi="प्रारंभ" />
                        </p>
                        <p className="text-sm font-medium text-ink">
                            {assignment.startedAt ? formatDateTime(assignment.startedAt) : "Not started yet"}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-ink-muted">
                            <BiText en="On-site GPS check" hi="स्थल जीपीएस जाँच" />
                        </p>

                        {/* Green inside the 50 m rule, rose outside it, plain when not started */}
                        <p
                            className={`text-sm font-medium ${
                                hasStartDistance
                                    ? startWithinRadius
                                        ? "text-india-green"
                                        : "text-rose-700"
                                    : "text-ink"
                            }`}
                        >
                            {hasStartDistance ? `${Math.round(startDistance)} m from the site` : "Pending"}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-2">
                    <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                    <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-ink-muted">
                            <BiText en="Activity entries" hi="गतिविधि प्रविष्टियाँ" />
                        </p>
                        <p className="text-sm font-medium text-ink">{assignment.activityLogCount ?? 0}</p>
                    </div>
                </div>
            </div>

            {/* Rework notice: explains why a started cleanup is back with the cleaner */}
            {isRework ? (
                <p className="mt-4 rounded-gov border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
                    <BiText
                        en="This corporation asked for rework. The cleaner is continuing on site and must resubmit fresh proof for verification."
                        hi="इस निगम ने पुनः कार्य के लिए कहा है। सफाई कर्मी स्थल पर कार्य जारी रखते हुए नया प्रमाण प्रस्तुत करेगा।"
                    />
                </p>
            ) : null}

            {/* Footer: award age + the link into the full review screen */}
            <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-muted">
                    <BiText en="Awarded" hi="आवंटित" />{" "}
                    {assignment.claimedAt ? formatRelativeTime(assignment.claimedAt) : "-"}
                </p>

                {/* Everything deeper - activity diary, evidence, approval trail - is on
                    the review page, keeping this list lightweight. */}
                <Link
                    to={`/municipal/assignments/${assignment.assignmentId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-gov border border-gov-blue px-3 py-2 text-sm font-medium text-gov-blue transition hover:bg-blue-50"
                >
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                    Open review file
                </Link>
            </div>
        </article>
    );
}