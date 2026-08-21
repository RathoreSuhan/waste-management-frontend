/**
 * ============================================================================
 * Completion Review Card (Phase 16 - Municipal Officer console)
 * ============================================================================
 *
 * The final human checkpoint of the Clean Bharat workflow.
 *
 *   Cleaner submits completion -> GPS verification -> Gemini before/after
 *   verification -> AI PASS -> MUNICIPAL COMPLETION REVIEW -> APPROVED
 *   -> assignment COMPLETED
 *
 * By the time an assignment reaches this card the platform has already run two
 * automated checks and both passed, which is exactly why the framing matters:
 * the AI result is presented as ADVISORY EVIDENCE, never as a verdict. The card
 * therefore groups what the officer is judging into three explicit blocks:
 *
 *   1. Evidence     - before and after photographs side by side
 *   2. GPS check    - the on-site distance against the 50 m platform rule
 *   3. AI assistance - Gemini's same-location / garbage-removed confidence,
 *                      clearly labelled as advisory input only
 *
 * Only the officer's decision changes state. Approving releases the reward and
 * resolves the citizen's report; requesting rework or rejecting the evidence
 * sends the assignment back to REWORK_REQUIRED so the cleaner can continue on
 * site and resubmit for a fresh round of verification.
 *
 * Presentational only: onDecision(decision, assignment) lets the page own the
 * ApprovalDecisionDialog, the API call and the reload.
 * ============================================================================
 */

import { Link } from "react-router-dom";
import { Bot, Building2, ClipboardList, MapPin, NotebookPen, Ruler } from "lucide-react";
import BiText from "@/components/common/BiText";
import Button from "@/components/ui/Button";
import BeforeAfterImage from "@/components/reports/BeforeAfterImage";
import { CLEANUP_PROOF_RADIUS_METRES, formatConfidence } from "@/constants/assignmentConstants";
import {
    AI_ADVISORY_HINT,
    AI_ADVISORY_NOTICE,
    APPROVAL_STAGE,
    getCleanerTypeLabel,
    getDecisionActions,
} from "@/constants/municipalConstants";
import { formatDateTime, formatRelativeTime } from "@/utils/formatters";

// The three verdicts an officer may record at the COMPLETION stage.
const COMPLETION_ACTIONS = getDecisionActions(APPROVAL_STAGE.COMPLETION);

export default function CompletionReviewCard({ assignment, onDecision, busy = false }) {

    if (!assignment) {
        return null;
    }

    // GPS: the backend re-measured this when the cleaner started on site, so it
    // is the corporation's own record, not a value the phone could fake later.
    const distance = assignment.startDistanceMeters;
    const hasDistance = distance !== null && distance !== undefined;
    const withinRadius = hasDistance && distance <= CLEANUP_PROOF_RADIUS_METRES;

    // Gemini's advisory outcome. aiVerified is true only when the model saw the
    // same location, judged the garbage removed, and cleared the confidence bar.
    const aiConfidence = formatConfidence(assignment.aiConfidence);

    return (
        <article className="rounded-gov border border-rule bg-paper p-4 shadow-sm sm:p-5">

            {/* Which site is being signed off */}
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
                <p className="text-xs text-ink-muted">
                    <BiText en="Submitted" hi="प्रस्तुत" />{" "}
                    {assignment.completedAt ? formatRelativeTime(assignment.completedAt) : "-"}
                </p>
            </div>

            {/* 1. Evidence: the comparison the whole decision rests on */}
            <BeforeAfterImage
                beforeUrl={assignment.beforeImageUrl}
                afterUrl={assignment.afterImageUrl}
                title={assignment.reportTitle || "this cleanup"}
                caption="Citizen's original photograph and the cleaner's completion proof."
            />

            {/* 2 + 3. The two verification aids, deliberately kept separate so the
                officer can see that they are independent inputs. */}
            <div className="mt-4 grid gap-3 lg:grid-cols-2">

                {/* GPS verification - a hard platform rule with a clear pass/fail */}
                <div className="rounded-gov border border-rule bg-white p-3">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
                        <Ruler className="h-4 w-4" aria-hidden="true" />
                        <BiText en="GPS verification" hi="जीपीएस सत्यापन" />
                    </p>

                    <p className={`mt-2 text-sm font-semibold ${withinRadius ? "text-india-green" : "text-rose-700"}`}>
                        {hasDistance
                            ? `${Math.round(distance)} m from the reported location`
                            : "Distance not recorded"}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">

                        {/* States the rule itself so the officer is not asked to remember it */}
                        {hasDistance
                            ? withinRadius
                                ? `Within the ${CLEANUP_PROOF_RADIUS_METRES} m platform verification rule.`
                                : `Outside the ${CLEANUP_PROOF_RADIUS_METRES} m platform verification rule - please examine the evidence carefully.`
                            : "This cleanup has no recorded on-site distance."}
                    </p>

                    <p className="mt-2 text-xs text-ink-muted">
                        <BiText en="Work started" hi="कार्य प्रारंभ" primaryOnly />:{" "}
                        {assignment.startedAt ? formatDateTime(assignment.startedAt) : "-"}
                    </p>
                </div>

                {/* AI assistance - advisory framing is mandatory here */}
                <div className="rounded-gov border border-indigo-200 bg-indigo-50/50 p-3">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-gov-blue">
                        <Bot className="h-4 w-4" aria-hidden="true" />
                        <BiText en={AI_ADVISORY_NOTICE.title} hi={AI_ADVISORY_NOTICE.titleHi} />
                    </p>

                    <p className="mt-2 text-sm font-semibold text-ink">
                        {assignment.aiVerified
                            ? `Gemini found the cleanup consistent${aiConfidence ? ` (${aiConfidence} confidence)` : ""}`
                            : `Gemini could not confirm the cleanup${aiConfidence ? ` (${aiConfidence} confidence)` : ""}`}
                    </p>

                    {/* The model's own words, when it returned any */}
                    {assignment.aiRemarks ? (
                        <p className="mt-1 whitespace-pre-line text-sm text-ink-muted">{assignment.aiRemarks}</p>
                    ) : null}

                    {/* The non-negotiable caveat: AI assists, the officer decides */}
                    <p className="mt-2 border-t border-indigo-200 pt-2 text-xs text-gov-blue">
                        <BiText en={AI_ADVISORY_NOTICE.body} hi={AI_ADVISORY_NOTICE.bodyHi} />
                    </p>
                    <p className="mt-1 text-xs font-medium text-gov-navy">{AI_ADVISORY_HINT}</p>
                </div>
            </div>

            {/* Who did the work, and how much of a diary they left behind */}
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-gov border border-rule bg-white p-3">
                <div className="min-w-0">
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
                        {assignment.cleanerEmail ? <span className="truncate">{assignment.cleanerEmail}</span> : null}
                    </div>
                </div>

                <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <NotebookPen className="h-4 w-4" aria-hidden="true" />
                    {assignment.activityLogCount ?? 0} activity entries
                </p>
            </div>

            {/* Footer: the full file on the left, the decision on the right */}
            <div className="mt-4 flex flex-col gap-3 border-t border-rule pt-4 sm:flex-row sm:items-center sm:justify-between">

                {/* Activity diary and the approval trail live on the review page */}
                <Link
                    to={`/municipal/assignments/${assignment.assignmentId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-gov border border-gov-blue px-3 py-2 text-sm font-medium text-gov-blue transition hover:bg-blue-50"
                >
                    <ClipboardList className="h-4 w-4" aria-hidden="true" />
                    Open review file
                </Link>

                <div className="flex flex-wrap gap-2">

                    {/* Approve / Request rework / Reject - all from one shared definition */}
                    {COMPLETION_ACTIONS.map((action) => (
                        <Button
                            key={action.decision}
                            type="button"
                            variant={action.variant}
                            fullWidth={false}
                            disabled={busy}
                            className="px-3 py-2 text-sm"
                            onClick={() => onDecision?.(action.decision, assignment)}
                        >
                            {action.label}
                        </Button>
                    ))}
                </div>
            </div>
        </article>
    );
}