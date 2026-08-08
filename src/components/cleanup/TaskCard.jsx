import { Link } from "react-router-dom";
import {
    MapPin,
    Building2,
    Clock,
    ShieldCheck,
    ExternalLink,
    ImageIcon,
} from "lucide-react";

import AssignmentStatusBadge from "@/components/cleanup/AssignmentStatusBadge";
import Button from "@/components/ui/Button";
import { formatRelativeTime, formatDateTime } from "@/utils/formatters";
import {
    canClaim,
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
 * Only one action is ever offered, matching the backend's strict lifecycle:
 * claim a pending task, start a claimed one, upload proof once started.
 * Completed tasks show the AI verdict instead of an action.
 * ============================================================================
 */

export default function TaskCard({
    assignment,
    // Handlers are optional; a list omits the ones it does not support
    onClaim,
    onStart,
    onUpload,
    // Id of the assignment currently mid-request, so only it shows a spinner
    busyId,
}) {

    // Whether this specific card is waiting on the backend
    const busy = busyId === assignment.assignmentId;

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

                    {/* ---------------- Actions ---------------- */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">

                        {/* Claim - only ever offered on a pending task */}
                        {onClaim && canClaim(assignment) && (
                            <Button
                                type="button"
                                fullWidth={false}
                                loading={busy}
                                onClick={() => onClaim(assignment)}
                            >
                                Claim Task
                            </Button>
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
                                Upload Cleanup Proof
                            </Button>
                        )}

                        {/* The report itself is always viewable for full context */}
                        <Link
                            to={`/reports/${assignment.reportId}`}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
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
