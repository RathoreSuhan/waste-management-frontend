import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Users, Clock, Layers, FileText, Pencil, CheckCircle2 } from "lucide-react"; // Pencil marks the revise/edit actions, CheckCircle2 the resubmitted revision

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Pagination from "@/components/common/Pagination";
import ProposalStatusBadge from "@/components/cleanup/ProposalStatusBadge";
import usePagination from "@/hooks/usePagination";
import { CLEANER_PAGE_SIZE } from "@/constants/paginationConstants";
import useProposals from "@/hooks/useProposals";

import { withdrawProposal } from "@/services/cleanupService";
import { isProposalEditable, PROPOSAL_STATUS } from "@/constants/assignmentConstants"; // PROPOSAL_STATUS separates "asked to revise" from "still waiting"
import { isRevisionAnswered } from "@/constants/municipalConstants"; // reads the approval ledger, the same field the officer's desk uses
import { getErrorMessage } from "@/utils/errorMessage";
import { formatRelativeTime } from "@/utils/formatters"; // "3 hours ago", so the receipt feels immediate
import {
    clearProposalDraft,     // throws one unfinished draft away
    countFilledDraftFields, // powers the "N answers saved" line
    listProposalDrafts,     // every unfinished draft in this browser session
} from "@/utils/proposalDraft";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * My Proposals (Phase 14)
 * ============================================================================
 *
 * Every cleanup proposal this cleaner has submitted, with the municipal
 * decision on each.
 *
 * The page is written to explain waiting. A proposal sits at "Under Review"
 * until an officer compares it with the other proposals for the same site, so
 * each card shows how many cleaners are competing for that site and keeps the
 * withdraw action available while the decision is still open.
 *
 * A proposal form that was started but never submitted also belongs here. Those
 * drafts live in the browser session only (see utils/proposalDraft), so they are
 * shown above the submitted list in amber, and they disappear on sign out.
 * ============================================================================
 */

// Short, readable date for a submission or a proposed start
function formatDate(value) {
    if (!value) {
        return "Not specified";
    }

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// When a draft was last kept, shown with the time because it is recent work
function formatSavedAt(value) {
    if (!value) {
        return "a moment ago";
    }

    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function MyProposalsPage() {

    // Loading, failure and reload handling all live in the hook
    const { proposals, loading, error, reload, refresh } = useProposals();

    // Forms started but never submitted, read once when the page opens
    const [drafts, setDrafts] = useState(() => listProposalDrafts());

    // Proposal currently being withdrawn, so only that card shows a spinner
    const [withdrawingId, setWithdrawingId] = useState(null);
    const [actionError, setActionError] = useState("");
    const [actionMessage, setActionMessage] = useState("");

    // Five proposals to a page, latest first as the backend already sends them
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
        // Five to a page, not the portal-wide ten. The list mixes the bid still
        // under review with every decision already taken, and the live one has
        // to stay visible rather than sink under its own history.
    } = usePagination(proposals, CLEANER_PAGE_SIZE);

    // Anchor for the jump back up when the page changes
    const listTopRef = useRef(null);

    /**
     * Throw away a draft the cleaner no longer wants.
     *
     * Nothing was ever sent to the server, so only the browser copy is cleared.
     */
    function handleDiscardDraft(assignmentId) {

        clearProposalDraft(assignmentId); // answers, photograph and GPS reading

        setDrafts(listProposalDrafts());  // re-read, so the card leaves at once
    }

    /**
     * Withdraw a proposal that is still open.
     *
     * The backend marks it WITHDRAWN rather than deleting it, so the record of
     * the inspection survives for audit.
     */
    async function handleWithdraw(proposal) {

        setWithdrawingId(proposal.proposalId);
        setActionError("");
        setActionMessage("");

        try {
            await withdrawProposal(proposal.proposalId);

            setActionMessage(
                `Your proposal for "${proposal.reportTitle}" has been withdrawn.`
            );

            // Quiet re-fetch, so the new status appears without blanking the page
            refresh();
        } catch (requestError) {
            setActionError(
                getErrorMessage(
                    requestError,
                    "This proposal could not be withdrawn. Please try again."
                )
            );

            // The officer may have decided in the meantime, so re-read the state
            refresh();
        } finally {
            setWithdrawingId(null);
        }
    }

    return (
        <div>
            <PageHeading
                title="My Proposals"
                titleHi="मेरे प्रस्ताव"
                subtitle="Cleanup proposals you have submitted and the municipal decision on each."
            />

            {/* Outcome of the last withdrawal */}
            {actionMessage && (
                <div className="mb-4">
                    <Alert type="success" title="Proposal Withdrawn">
                        {actionMessage}
                    </Alert>
                </div>
            )}

            {/* Backend refusals, e.g. a proposal already decided */}
            {actionError && (
                <div className="mb-4">
                    <Alert type="error" title="Could Not Withdraw Proposal">
                        {actionError}
                    </Alert>
                </div>
            )}

            {/* Started but never submitted, so the unfinished work is offered back */}
            {drafts.length > 0 && (
                <section className="mb-4 space-y-3">
                    {drafts.map((draft) => {

                        // Site details exist only if the form was opened from Available Tasks
                        const site = draft.site || {};

                        // How much of the long form is already answered
                        const filled = countFilledDraftFields(draft.values);

                        return (
                            <article
                                key={draft.assignmentId}
                                className="rounded-gov border border-amber-300 bg-amber-50 p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h2 className="font-serif text-base font-bold text-gov-navy">
                                        {site.reportTitle || "Cleanup proposal"}
                                    </h2>

                                    {/* Amber, never the badge used for a real submission */}
                                    <span className="inline-flex items-center gap-1.5 rounded-gov border border-amber-400 bg-white px-2 py-1 text-xs font-semibold text-amber-800">
                                        <FileText size={12} aria-hidden="true" />
                                        Draft &mdash; not submitted
                                    </span>
                                </div>

                                {/* Skipped when the page was opened directly by its address */}
                                {site.address && (
                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                                        <MapPin size={14} aria-hidden="true" />
                                        {site.address}
                                        {site.city && ` \u2022 ${site.city}`}
                                    </p>
                                )}

                                <p className="mt-3 text-sm leading-relaxed text-ink">
                                    {filled} answer{filled === 1 ? "" : "s"} saved on this
                                    device. The municipal corporation cannot see any of it
                                    until you submit the proposal.
                                </p>

                                <p className="mt-2 text-xs text-ink-muted">
                                    Last saved {formatSavedAt(draft.savedAt)}
                                    {" \u2022 kept only until you sign out"}
                                </p>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {/* Site details travel back, so the form reads as before */}
                                    <Link
                                        to={`/cleaner/proposals/new/${draft.assignmentId}`}
                                        state={draft.site ? { assignment: draft.site } : undefined}
                                        className="inline-flex items-center justify-center rounded-gov border border-gov-blue bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                                    >
                                        Continue Filling
                                    </Link>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        fullWidth={false}
                                        onClick={() => handleDiscardDraft(draft.assignmentId)}
                                    >
                                        Discard Draft
                                    </Button>

                                    {/* Only offered when the report behind the site is known */}
                                    {site.reportId && (
                                        <Link
                                            to={`/reports/${site.reportId}`}
                                            className="text-sm font-semibold text-gov-blue hover:underline"
                                        >
                                            View Report
                                        </Link>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing submitted and nothing half-written, so offer the next step */}
            {!loading && !error && proposals.length === 0 && drafts.length === 0 && (
                <ReportListEmpty
                    title="No proposals yet"
                    description="Inspect an open site from Available Tasks and submit your cleanup plan. The municipal corporation approves one proposal for each site."
                />
            )}

            {!loading && !error && proposals.length > 0 && (
                <div ref={listTopRef} className="space-y-3">
                    {pageItems.map((proposal) => {

                        // Only this card is disabled while its request is running
                        const busy = withdrawingId === proposal.proposalId;

                        // SUBMITTED or REVISION_REQUIRED may still be changed
                        const editable = isProposalEditable(proposal);

                        // An officer has already read this one and wants changes,
                        // so revising is the expected next step, not an optional one
                        const revisionRequested =
                            proposal.status === PROPOSAL_STATUS.REVISION_REQUIRED;

                        /*
                          The revised plan has been handed back.

                          On resubmission the status returns to SUBMITTED, which alone
                          looks identical to a first-time bid - so a cleaner who had just
                          worked through a revision had no confirmation that their answer
                          actually left the building. The approval ledger records the
                          moment as REVISION_SUBMITTED, and that is what this receipt
                          reads.
                        */
                        const revisionResubmitted = isRevisionAnswered(proposal);

                        return (
                            <article
                                key={proposal.proposalId}
                                className="rounded-gov border border-rule bg-white p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <h2 className="font-serif text-base font-bold text-gov-navy">
                                        {proposal.reportTitle}
                                    </h2>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {/*
                                          Sits beside the status pill rather than replacing it:
                                          the proposal really is back under review, and this only
                                          adds why it is there.
                                        */}
                                        {revisionResubmitted && (
                                            <span className="inline-flex items-center gap-1.5 rounded-gov border border-india-green/30 bg-emerald-50 px-2 py-1 text-xs font-semibold text-india-green">
                                                <CheckCircle2 size={12} aria-hidden="true" />
                                                Revision Resubmitted
                                                <span className="font-normal">
                                                    {" \u2022 "}संशोधन पुनः प्रस्तुत
                                                </span>
                                            </span>
                                        )}

                                        <ProposalStatusBadge status={proposal.status} />
                                    </div>
                                </div>

                                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                                    <MapPin size={14} aria-hidden="true" />
                                    {proposal.address || "Address not recorded"}
                                    {proposal.city && ` \u2022 ${proposal.city}`}
                                </p>

                                {/* The plan an officer weighs, at a glance */}
                                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                                    <div className="flex items-center gap-1.5">
                                        <Clock
                                            size={14}
                                            className="text-ink-muted"
                                            aria-hidden="true"
                                        />
                                        <dt className="sr-only">Estimated duration</dt>
                                        <dd className="text-ink">
                                            {proposal.estimatedDurationDays} day
                                            {proposal.estimatedDurationDays === 1 ? "" : "s"}
                                        </dd>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Users
                                            size={14}
                                            className="text-ink-muted"
                                            aria-hidden="true"
                                        />
                                        <dt className="sr-only">Manpower</dt>
                                        <dd className="text-ink">
                                            {proposal.manpowerCount} worker
                                            {proposal.manpowerCount === 1 ? "" : "s"}
                                        </dd>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <Layers
                                            size={14}
                                            className="text-ink-muted"
                                            aria-hidden="true"
                                        />
                                        <dt className="sr-only">Competing proposals</dt>
                                        <dd className="text-ink">
                                            {/* Explains the wait without naming other cleaners */}
                                            {proposal.totalProposalsForAssignment > 1
                                                ? `${proposal.totalProposalsForAssignment} proposals for this site`
                                                : "Only your proposal so far"}
                                        </dd>
                                    </div>
                                </dl>

                                <p className="mt-3 text-sm leading-relaxed text-ink">
                                    {proposal.siteObservations}
                                </p>

                                <p className="mt-2 text-xs text-ink-muted">
                                    Submitted {formatDate(proposal.submittedAt)}
                                    {proposal.proposedStartDate &&
                                        ` \u2022 proposed start ${formatDate(proposal.proposedStartDate)}`}
                                </p>

                                {/*
                                  An officer asked for changes, so say so plainly. Never shown
                                  next to the resubmitted receipt: the moment the revised plan
                                  is filed the backend returns the status to SUBMITTED, so the
                                  two states cannot both be true.
                                */}
                                {revisionRequested && (
                                    <div className="mt-3">
                                        <Alert type="warning" title="Revision requested">
                                            The municipal corporation has asked you to
                                            revise this proposal before it can be approved.
                                        </Alert>
                                    </div>
                                )}

                                {/* The receipt itself: what was sent, when, and what happens next */}
                                {revisionResubmitted && (
                                    <div className="mt-3 rounded-gov border border-india-green/30 bg-emerald-50 p-3">
                                        <p className="flex items-center gap-1.5 text-sm font-semibold text-india-green">
                                            <CheckCircle2 size={14} aria-hidden="true" />
                                            Revised proposal submitted
                                            <span className="font-normal text-ink-muted">
                                                {" \u2022 "}संशोधित प्रस्ताव प्रस्तुत
                                            </span>
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-ink">
                                            Your updated plan reached the municipal corporation
                                            {proposal.latestDecisionAt
                                                ? ` ${formatRelativeTime(proposal.latestDecisionAt)}`
                                                : ""}
                                            {" "}and is now waiting for their decision. No further
                                            action is needed from you.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    {/*
                                      Both links open the same form at
                                      /cleaner/proposals/<id>/edit, which loads the
                                      filed proposal and sends a PUT instead of a POST.
                                      Only the wording and weight differ: a revision was
                                      asked for, an edit was not.
                                    */}
                                    {editable && (
                                        <Link
                                            to={`/cleaner/proposals/${proposal.proposalId}/edit`}
                                            className={
                                                revisionRequested
                                                    ? "inline-flex items-center gap-2 rounded-gov border border-gov-blue bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                                                    : "inline-flex items-center gap-2 rounded-gov border border-rule bg-white px-5 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-paper"
                                            }
                                        >
                                            <Pencil size={14} aria-hidden="true" />
                                            {revisionRequested
                                                ? "Revise & Resubmit"
                                                : "Edit Proposal"}
                                        </Link>
                                    )}

                                    {editable && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            fullWidth={false}
                                            disabled={busy}
                                            onClick={() => handleWithdraw(proposal)}
                                        >
                                            {busy ? "Please wait..." : "Withdraw Proposal"}
                                        </Button>
                                    )}

                                    {/*
                                      The proposal itself, readable at every status.

                                      Once the corporation has ruled, isProposalEditable()
                                      turns false and the Edit link disappears - which used
                                      to leave the cleaner with no way back into their own
                                      filed plan even though the record is still there. This
                                      opens it read-only, so an approved or rejected bid can
                                      always be re-read.
                                    */}
                                    <Link
                                        to={`/cleaner/proposals/${proposal.proposalId}`}
                                        className="inline-flex items-center gap-2 rounded-gov border border-rule bg-white px-5 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-paper"
                                    >
                                        <FileText size={14} aria-hidden="true" />
                                        View Proposal
                                    </Link>

                                    <Link
                                        to={`/reports/${proposal.reportId}`}
                                        className="text-sm font-semibold text-gov-blue hover:underline"
                                    >
                                        View Report
                                    </Link>
                                </div>
                            </article>
                        );
                    })}

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onPageChange={goToPage}
                        itemLabel="proposals"
                        scrollTargetRef={listTopRef}
                    />
                </div>
            )}
        </div>
    );
}