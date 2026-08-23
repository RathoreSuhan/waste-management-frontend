/**
 * ============================================================================
 * Proposal Review Card (Phase 16 - Municipal Officer console)
 * ============================================================================
 *
 * Renders ONE cleanup proposal (backend CleanupProposalResponse) as a bid card
 * inside the municipal officer's proposal queue.
 *
 * Why this card looks different from every other card in the console
 * ------------------------------------------------------------------
 * ActiveCleanupCard and CompletionReviewCard each describe a *decided* piece of
 * work: one site, one cleaner, nothing to choose. This card describes an *offer*
 * - and several offers may exist for the same site, stacked one under the other
 * in the same list. If they were styled alike, an officer scrolling the queue
 * could not tell where one bid ended and the next began, nor which of two cards
 * belonged to the same site.
 *
 * So a bid is deliberately given its own visual grammar:
 *   - a saffron rail down the left edge, which the other cards never use
 *   - a tinted header band carrying PROPOSAL #id and a "Proposal 2 of 3 for
 *     this site" chip, so position within the contest is readable at a glance
 *   - a hairline four-column comparison strip (duration | manpower | start date
 *     | inspection distance) always in the same order, so an officer can read
 *     straight down the stack and compare like with like
 *   - one filled action, Approve & Assign, placed last after the softer verdicts
 *
 * The full cleaning plan is NOT expanded here. It opens on its own page via
 * `detailPath`, because an officer comparing bids needs to reload, bookmark and
 * share a plan - an in-card panel could do none of that.
 *
 * Decision buttons come from getDecisionActions(APPROVAL_STAGE.PROPOSAL) so the
 * available verdicts are defined once in municipalConstants and never drift
 * between screens. The card only raises onDecision(decision, proposal) - the
 * page owns the dialog, the API call and the reload, keeping this presentational.
 *
 * Nothing here is automated: the platform never picks a winning proposal on the
 * officer's behalf, it only lays the evidence out side by side.
 * ============================================================================
 */

import { Link } from "react-router-dom";
import { Building2, CalendarClock, CalendarDays, FileText, History, MapPin, Ruler, Users } from "lucide-react";
import BiText from "@/components/common/BiText";
import Button from "@/components/ui/Button";
import AssignmentStatusBadge from "@/components/cleanup/AssignmentStatusBadge";
import ProposalStatusBadge from "@/components/cleanup/ProposalStatusBadge";
import { INSPECTION_RADIUS_METRES, PROPOSAL_STATUS } from "@/constants/assignmentConstants";
import {
    APPROVAL_DECISION,
    APPROVAL_STAGE,
    getCleanerTypeLabel,
    getDecisionActions,
} from "@/constants/municipalConstants";
import { formatRelativeTime } from "@/utils/formatters";

/*
  The three verdicts an officer may record at the PROPOSAL stage, reversed so
  the order on screen reads Reject -> Request Revision -> Approve & Assign.
  Awarding the work is the one irreversible act on this screen, so the officer
  travels past the softer options to reach it. Derived from the shared list
  rather than retyped, so wording and variants stay in one place.
*/
const PROPOSAL_ACTIONS = [...getDecisionActions(APPROVAL_STAGE.PROPOSAL)].reverse();

/*
  Proposal states in which the paper is closed: the officer has already ruled on
  it, or the cleaner pulled it back. No further verdict can be recorded, so the
  card shows the plan and nothing else.
*/
const CLOSED_PROPOSAL_STATUSES = [
    PROPOSAL_STATUS.APPROVED,
    PROPOSAL_STATUS.REJECTED,
    PROPOSAL_STATUS.WITHDRAWN,
];

/*
  Left rail colour per PROPOSAL state - the fastest way for an officer scrolling
  the desk to separate bids they have never touched (saffron) from bids they
  have already acted on. Deliberately reuses the badge palette in
  PROPOSAL_STATUS_META so rail and pill can never disagree.
*/
const PROPOSAL_RAIL_CLASS = {
    [PROPOSAL_STATUS.SUBMITTED]: "border-l-saffron", // untouched: still awaiting a first verdict
    [PROPOSAL_STATUS.REVISION_REQUIRED]: "border-l-orange-500", // sent back, waiting on the cleaner
    [PROPOSAL_STATUS.APPROVED]: "border-l-india-green",
    [PROPOSAL_STATUS.REJECTED]: "border-l-rose-500",
    [PROPOSAL_STATUS.WITHDRAWN]: "border-l-ink-muted",
};

/* Matching header wash, kept faint so the plan figures stay the loudest thing. */
const PROPOSAL_HEADER_CLASS = {
    [PROPOSAL_STATUS.SUBMITTED]: "bg-paper",
    [PROPOSAL_STATUS.REVISION_REQUIRED]: "bg-orange-50",
    [PROPOSAL_STATUS.APPROVED]: "bg-emerald-50",
    [PROPOSAL_STATUS.REJECTED]: "bg-rose-50",
    [PROPOSAL_STATUS.WITHDRAWN]: "bg-slate-50",
};

/**
 * May this verdict still be recorded against a proposal in this state?
 *
 * Mirrors the backend guard: CleanupApprovalServiceImpl refuses a second
 * decision on a proposal it has already approved or rejected, so offering the
 * button would only produce a failed request.
 */
function canRecordDecision(status) {
    return !CLOSED_PROPOSAL_STATUSES.includes(status);
}

/**
 * Is this particular verdict temporarily out of reach?
 *
 * Once a revision has been requested the ball is with the cleaner: approving a
 * plan the officer has just called inadequate, or asking twice for the same
 * changes, would both be meaningless. Rejecting it outright still is not, so
 * that one verdict stays live.
 */
function isDecisionLocked(status, decision) {
    return (
        status === PROPOSAL_STATUS.REVISION_REQUIRED &&
        decision !== APPROVAL_DECISION.REJECTED
    );
}

/**
 * Date-only formatter for the proposed start date.
 *
 * The backend sends a LocalDate ("2026-08-21"), so formatDateTime would invent a
 * midnight clock reading that the cleaner never promised.
 */
function formatPlanDate(value) {
    if (!value) return "Not stated";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not stated";

    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * One cell of the comparison strip.
 *
 * Fixed height wording and a fixed column order are the whole point: the
 * officer reads down a stack of bids, not across a single card.
 */
function CompareCell({ icon: Icon, label, labelHi, value, valueClass = "text-ink", note }) {
    return (
        <div className="bg-white p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-ink-muted uppercase">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <BiText en={label} hi={labelHi} />
            </p>
            <p className={`mt-1 text-sm font-semibold ${valueClass}`}>{value}</p>
            {note ? <p className="mt-0.5 text-[11px] text-ink-muted">{note}</p> : null}
        </div>
    );
}

export default function ProposalReviewCard({
    proposal,
    // Position of this bid among the live proposals for the same site, supplied
    // by the queue page - the card cannot know what else is in the list.
    liveCount = 1,
    siteRank = 1,
    // Where the full cleaning plan lives; omitted, the link is simply not shown.
    detailPath,
    onDecision,
    busy = false,
}) {

    // Defensive guard: the queue endpoint should never return holes, but a card
    // rendering "undefined" in a government console is worse than rendering nothing.
    if (!proposal) {
        return null;
    }

    // The backend measures the inspection distance server side; anything above the
    // 50 m platform rule is flagged so the officer weighs the evidence accordingly.
    const distance = proposal.inspectionDistanceMeters;
    const hasDistance = distance !== null && distance !== undefined;
    const withinRadius = hasDistance && distance <= INSPECTION_RADIUS_METRES;

    // All-time submissions for this site, rejected ones included. Shown only when
    // it exceeds the live count, where it explains a gap the officer can see.
    const totalEverSubmitted = proposal.totalProposalsForAssignment ?? liveCount;
    const hasWithdrawnHistory = totalEverSubmitted > liveCount;

    // A single offer needs different wording: "Proposal 1 of 1" reads like a bug.
    const isContested = liveCount > 1;

    // Initial disc stands in for a photograph the platform deliberately does not hold.
    const cleanerInitial = (proposal.cleanerName || "?").trim().charAt(0).toUpperCase();

    /*
      The proposal's OWN state, which is what this card is about. The site status
      (proposal.assignmentStatus) reads "Under Review" for every bid on a site
      the moment any one cleaner offers, so showing it as the headline badge made
      a proposal the officer had already sent back look untouched.
    */
    const status = proposal.status;
    const isRevisionPending = status === PROPOSAL_STATUS.REVISION_REQUIRED;
    const showDecisions = canRecordDecision(status); // decided papers get no verdict buttons

    /*
      A revision keeps its original submittedAt on purpose (the audit trail must
      remember when the cleaner first bid), so a plan revised minutes ago would
      otherwise still read "Submitted 3 days ago". updatedAt is only surfaced
      once it actually moves ahead of submittedAt.
    */
    const revisedAt =
        proposal.updatedAt && proposal.submittedAt && new Date(proposal.updatedAt) > new Date(proposal.submittedAt)
            ? proposal.updatedAt
            : null;

    return (
        <article
            className={`overflow-hidden rounded-gov border border-rule border-l-4 bg-white shadow-sm ${
                PROPOSAL_RAIL_CLASS[status] || "border-l-saffron"
            }`}
        >
            {/*
              Header band. Tinted and ruled off, so a stack of bids for the same
              site reads as separate documents rather than one long column. The
              wash follows the proposal status, so touched and untouched bids are
              distinguishable before a single word is read.
            */}
            <div className={`border-b border-rule px-4 py-3 ${PROPOSAL_HEADER_CLASS[status] || "bg-paper"}`}>
                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">

                        {/* The proposal's own identity - what the officer quotes in a query */}
                        <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Proposal #{proposal.proposalId}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-gov-navy sm:text-lg">
                            {proposal.reportTitle || `Report #${proposal.reportId}`}
                        </h3>
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span className="min-w-0">
                                {proposal.address}
                                {proposal.city ? `, ${proposal.city}` : ""}
                            </span>
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">

                        {/* Headline badge: the state of THIS proposal, not of the site */}
                        <ProposalStatusBadge status={status} />

                        {/* Site state kept as a quieter second line, still useful context */}
                        <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                            <BiText en="Site" hi="स्थल" />
                            <AssignmentStatusBadge status={proposal.assignmentStatus} />
                        </span>

                        {/* Where this bid sits in the contest for the site */}
                        <span className="rounded-gov border border-gov-blue/30 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-gov-navy">
                            {isContested
                                ? `Proposal ${siteRank} of ${liveCount} for this site`
                                : "Only proposal for this site"}
                        </span>

                        {/* Explains why the live count is lower than the total ever sent */}
                        {hasWithdrawnHistory ? (
                            <span className="text-[11px] text-ink-muted">
                                {totalEverSubmitted} submitted here in total
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/*
              Revision band. Without it an officer returning to the desk cannot
              tell why a bid they already handled is still listed - the paper is
              back with the cleaner, and nothing is expected of the officer until
              a revised plan arrives.
            */}
            {isRevisionPending ? (
                <div className="border-b border-orange-200 bg-orange-50 px-4 py-2.5">
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-orange-800 uppercase">
                        <BiText en="Revision requested" hi="संशोधन मांगा गया" />
                    </p>
                    <p className="mt-0.5 text-sm text-orange-900">
                        Waiting for {proposal.cleanerName || "the cleaner"} to submit a revised plan. Your
                        instructions are on the full plan page, with the decision trail.
                    </p>
                </div>
            ) : null}

            {/* Who is offering. Named first, because the officer is choosing a party. */}
            <div className="flex items-start gap-3 px-4 py-3">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-gov border border-rule bg-blue-50 text-sm font-bold text-gov-navy"
                    aria-hidden="true"
                >
                    {cleanerInitial}
                </span>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        <BiText en="Proposed by" hi="प्रस्तावक" />
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-ink">{proposal.cleanerName || "-"}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">

                        {/* Individual vs NGO vs contractor materially changes how a bid is judged */}
                        <span className="rounded-gov border border-rule bg-paper px-2 py-0.5 text-[11px] font-medium text-ink">
                            {getCleanerTypeLabel(proposal.cleanerType)}
                        </span>
                        {proposal.cleanerOrganization ? (
                            <span className="flex min-w-0 items-center gap-1.5">
                                <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                                <span className="truncate">{proposal.cleanerOrganization}</span>
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            {/*
              Comparison strip. The gap-px on a ruled background draws hairlines
              in both directions, so the four figures stay aligned column by
              column across every card in the stack.
            */}
            <div className="grid grid-cols-2 gap-px border-y border-rule bg-rule sm:grid-cols-4">
                <CompareCell
                    icon={CalendarClock}
                    label="Duration"
                    labelHi="अवधि"
                    value={
                        proposal.estimatedDurationDays
                            ? `${proposal.estimatedDurationDays} day${proposal.estimatedDurationDays > 1 ? "s" : ""}`
                            : "-"
                    }
                />
                <CompareCell
                    icon={Users}
                    label="Manpower"
                    labelHi="श्रमशक्ति"
                    value={proposal.manpowerCount ? `${proposal.manpowerCount} people` : "-"}
                />
                <CompareCell
                    icon={CalendarDays}
                    label="Can start"
                    labelHi="प्रारंभ संभव"
                    value={formatPlanDate(proposal.proposedStartDate)}
                />
                <CompareCell
                    icon={Ruler}
                    label="Inspected at"
                    labelHi="निरीक्षण दूरी"
                    value={hasDistance ? `${Math.round(distance)} m away` : "Not recorded"}

                    // Green inside the 50 m rule, rose when the platform flagged it
                    valueClass={
                        hasDistance ? (withinRadius ? "text-india-green" : "text-rose-700") : "text-ink"
                    }
                    note={
                        hasDistance && !withinRadius
                            ? `Outside the ${INSPECTION_RADIUS_METRES} m rule`
                            : hasDistance
                                ? `Within the ${INSPECTION_RADIUS_METRES} m rule`
                                : null
                    }
                />
            </div>

            {/* Inspection photograph: proof the cleaner stood where they say they did */}
            <div className="flex items-center gap-3 px-4 py-3">
                {proposal.inspectionImageUrl ? (
                    <img
                        src={proposal.inspectionImageUrl}
                        alt="Site inspection evidence"
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-gov border border-rule object-cover"
                    />
                ) : null}
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        <BiText en="Inspection evidence" hi="निरीक्षण प्रमाण" />
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                        {proposal.inspectionImageUrl
                            ? "Photograph captured by the cleaner during their site visit."
                            : "No photograph attached - judge this bid on the plan and the GPS reading alone."}
                    </p>
                </div>
            </div>

            {/* Footer: submission age, the full plan, then the three verdicts */}
            <div className="flex flex-col gap-3 border-t border-rule bg-paper px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-xs text-ink-muted">
                    <p>
                        <BiText en="Submitted" hi="प्रस्तुत" />{" "}
                        {proposal.submittedAt ? formatRelativeTime(proposal.submittedAt) : "-"}
                    </p>

                    {/* Only appears on a plan the cleaner has actually changed since */}
                    {revisedAt ? (
                        <p className="mt-0.5 flex items-center gap-1.5 font-semibold text-gov-navy">
                            <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <BiText en="Revised" hi="संशोधित" /> {formatRelativeTime(revisedAt)}
                        </p>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">

                    {/* Waste handling, equipment and method open on their own page */}
                    {detailPath ? (
                        <Link
                            to={detailPath}
                            className="inline-flex items-center justify-center gap-2 rounded-gov border border-gov-blue px-3 py-2 text-sm font-semibold text-gov-blue transition hover:bg-blue-50"
                        >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            View full plan
                        </Link>
                    ) : null}

                    {/*
                      Decision buttons are data-driven so wording stays identical
                      everywhere, and gated on the proposal's own state so the
                      officer is never offered a verdict the backend would refuse.
                    */}
                    {showDecisions
                        ? PROPOSAL_ACTIONS.map((action) => {
                            const locked = isDecisionLocked(status, action.decision);

                            return (
                                <Button
                                    key={action.decision}
                                    type="button"
                                    variant={action.variant}
                                    fullWidth={false}
                                    disabled={busy || locked}
                                    className="px-3 py-2 text-sm"

                                    // Hover text explains the lock, since a greyed button alone does not
                                    title={
                                        locked
                                            ? "Unlocks once the cleaner submits the revised plan"
                                            : undefined
                                    }
                                    onClick={() => onDecision?.(action.decision, proposal)}
                                >
                                    {action.label}
                                </Button>
                            );
                        })
                        : (
                            // Closed paper: state the outcome instead of dead buttons
                            <span className="text-xs font-semibold text-ink-muted">
                                Decision already recorded - this proposal is closed.
                            </span>
                        )}
                </div>
            </div>
        </article>
    );
}
