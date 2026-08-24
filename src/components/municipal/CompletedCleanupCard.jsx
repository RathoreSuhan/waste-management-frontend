/**
 * ============================================================================
 * Completed Cleanup Card (Municipal Officer console - Cleanup History)
 * ============================================================================
 *
 * One cleanup this corporation has already signed off, rendered from the same
 * backend CleanupAssignmentResponse the active and completion desks use.
 *
 * This is the closed end of the workflow, so the card is a record rather than a
 * queue row. Its sibling ActiveCleanupCard leads on progress signals - has the
 * cleaner arrived, how far from the site, how many diary entries. None of that
 * is a live question once the work is approved, so the emphasis moves to what
 * the corporation actually put its name to:
 *
 *   - when the completion was approved (the date this list is ordered on)
 *   - the before/after evidence the decision was taken on
 *   - who did the work, and under whose organisation
 *   - the AI assessment that supported the review, stated as advisory
 *
 * There are no decision buttons. A COMPLETED assignment is final on the backend,
 * and the full case file - activity diary, evidence, the whole approval trail
 * including any earlier rework - stays one click away on the review screen.
 * ============================================================================
 */

import { Link } from "react-router-dom";
import {
    Building2,
    ClipboardList,
    MapPin,
    NotebookPen,
    ShieldCheck,
    CalendarCheck,
} from "lucide-react";

import BiText from "@/components/common/BiText";
import AssignmentStatusBadge from "@/components/cleanup/AssignmentStatusBadge";
import BeforeAfterImage from "@/components/reports/BeforeAfterImage";
import { formatConfidence } from "@/constants/assignmentConstants";
import { getCleanerTypeLabel } from "@/constants/municipalConstants";
import { formatDateTime, formatRelativeTime } from "@/utils/formatters";

export default function CompletedCleanupCard({ assignment }) {

    // Guard so a partially loaded list cannot break the officer's history.
    if (!assignment) {
        return null;
    }

    // Confidence is optional on legacy rows, so the helper may return "".
    const aiConfidence = formatConfidence(assignment.aiConfidence);

    return (
        <article className="rounded-gov border border-rule bg-paper p-4 shadow-sm sm:p-5">

            {/* Site + the closed status */}
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

            {/*
              The sign-off date, given its own row because it is what this list
              is ordered on - the reader is scanning for "when did we approve
              this", not for when the report was filed.
            */}
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-gov border border-green-300 bg-green-50 p-3 text-sm text-green-900">
                <CalendarCheck className="h-4 w-4 shrink-0 text-india-green" aria-hidden="true" />
                <span className="font-semibold">
                    <BiText en="Completion approved" hi="पूर्णता स्वीकृत" />
                </span>
                {assignment.completedAt ? (
                    <span>
                        {formatDateTime(assignment.completedAt)}
                        <span className="text-ink-muted">
                            {" "}&bull; {formatRelativeTime(assignment.completedAt)}
                        </span>
                    </span>
                ) : (
                    // Legacy rows closed before completedAt was recorded
                    <span className="text-ink-muted">date not recorded</span>
                )}
            </p>

            {/* Who did the work - the corporation is accountable for this choice */}
            <div className="mt-4 rounded-gov border border-rule bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                    <BiText en="Cleaner" hi="सफाई कर्मी" />
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

                    <span className="flex items-center gap-1.5">
                        <NotebookPen className="h-4 w-4" aria-hidden="true" />
                        <BiText en="Activity entries" hi="गतिविधि प्रविष्टियाँ" />
                        {": "}
                        {assignment.activityLogCount ?? 0}
                    </span>
                </div>
            </div>

            {/*
              The evidence the decision rested on. BeforeAfterImage renders the
              pair in one fixed frame each, so photographs taken on different
              phones still line up for the comparison.
            */}
            <BeforeAfterImage
                beforeUrl={assignment.beforeImageUrl}
                afterUrl={assignment.afterImageUrl}
                title={assignment.reportTitle || "this site"}
                caption="Evidence on record for this cleanup, before and after."
            />

            {/*
              The AI pass, stated as what it was: support for the review. The
              corporation's own approval is what closed this cleanup, and the
              wording must not let the two be confused.
            */}
            {assignment.aiVerified ? (
                <p className="mt-4 flex items-start gap-2 rounded-gov border border-rule bg-white p-3 text-sm text-ink-muted">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-india-green" aria-hidden="true" />
                    <span>
                        AI assessment supported this review
                        {aiConfidence ? ` at ${aiConfidence} confidence` : ""}. The
                        approval recorded by this corporation is what closed the
                        cleanup.
                    </span>
                </p>
            ) : null}

            {/* Footer: the report age, and the full case file */}
            <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-muted">
                    <BiText en="Reported" hi="सूचित" />{" "}
                    {assignment.reportCreatedAt ? formatRelativeTime(assignment.reportCreatedAt) : "-"}
                </p>

                {/* Same destination the active and completion desks use, so the
                    approval trail is read in one familiar place. */}
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
