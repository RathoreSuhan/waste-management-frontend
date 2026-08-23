import { useMemo, useRef, useState } from "react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import RecordSearchBar from "@/components/common/RecordSearchBar";
import Pagination from "@/components/common/Pagination";
import ProposalReviewCard from "@/components/municipal/ProposalReviewCard";
import ApprovalDecisionDialog from "@/components/municipal/ApprovalDecisionDialog";
import usePagination from "@/hooks/usePagination";
import useAssignments from "@/hooks/useAssignments";

import { decideProposal } from "@/services/municipalService";
import {
    loadPendingProposals,
    countProposalSites,
    countLiveProposalsBySite,
    countAwaitingRevision,
    countUnavailableSites,
} from "@/utils/municipalQueue";
import { APPROVAL_STAGE, APPROVAL_DECISION } from "@/constants/municipalConstants";
import { REVIEW_PAGE_SIZE } from "@/constants/paginationConstants"; // review desks page 5 at a time
import { getErrorMessage } from "@/utils/errorMessage";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * Proposal Queue (Phase 15 - Municipal Corporation Console)
 * ============================================================================
 *
 * The officer's first desk. Every cleanup proposal filed for a site inside
 * this corporation waits here until the officer decides on it.
 *
 * Three decisions are possible, and each is recorded with the officer's own
 * remarks so the file stays auditable:
 *
 *   Approve & Assign  - the site becomes this cleaner's assignment
 *   Request Revision  - the plan returns to the cleaner for changes
 *   Reject Proposal    - the plan is refused
 *
 * The queue is deliberately read-then-decide: the summary card carries enough
 * for an obvious case, and "View full plan" opens the complete inspection
 * record on its OWN page (/municipal/proposals/{assignmentId}/{proposalId}),
 * the same way a report opens at /app/reports/{id}. A plan is a document the
 * officer reads, quotes and returns to - not a drawer inside a list.
 *
 * IMPORTANT - why this screen reads TWO endpoints
 * -----------------------------------------------
 * /proposal-queue answers "which SITES need a decision" (one row per
 * assignment, no proposalId on it). The decision itself is taken per PROPOSAL,
 * and several cleaners may bid for the same site, so the site rows are only a
 * starting point: for each queued site the competing proposals are pulled from
 * /assignment/{id}/proposals. That two-level read now lives in
 * utils/municipalQueue, shared with the dashboard counter, so the tile and this
 * desk can never report different numbers.
 * ============================================================================
 */

export default function ProposalQueuePage() {

    // Same list hook the cleaner screens use; the fetcher is a stable import.
    const {
        assignments: proposals,
        loading,
        error,
        reload,
        refresh,
    } = useAssignments(loadPendingProposals);

    /*
      Two separate values, deliberately.

      `query` is what the officer is typing; `appliedQuery` is what the list is
      actually filtered by. They only meet when Search is pressed, so a queue
      being read line by line does not rearrange itself mid-word.
    */
    const [query, setQuery] = useState("");
    const [appliedQuery, setAppliedQuery] = useState("");

    // Decision currently being taken: { proposal, decision }.
    const [pendingDecision, setPendingDecision] = useState(null);
    const [decisionBusy, setDecisionBusy] = useState(false);
    const [decisionError, setDecisionError] = useState("");
    const [decisionMessage, setDecisionMessage] = useState("");

    // Anchor for the jump back up when the page changes or a search is run.
    const listTopRef = useRef(null);

    // Filtering is cheap, but memoised so pagination stays stable between renders.
    const visibleProposals = useMemo(() => {
        const needle = appliedQuery.trim().toLowerCase();

        if (!needle) {
            return proposals;
        }

        return proposals.filter((proposal) =>
            [
                proposal.reportTitle,
                proposal.address,
                proposal.city,
                proposal.cleanerName,
                proposal.cleanerOrganization,
            ]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(needle))
        );
    }, [proposals, appliedQuery]);

    /*
      Five proposals to a page, not the portal's usual ten.

      Each card is a plan the officer weighs against the rival bids for the same
      site, so a shorter page keeps a contested site visible in one glance
      instead of scrolling past ten unrelated ones.
    */
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(visibleProposals, REVIEW_PAGE_SIZE);

    /**
     * How many distinct sites are represented, so the intro line can say
     * "4 proposals across 2 sites" instead of implying four separate cleanups.
     */
    const siteCount = useMemo(() => countProposalSites(proposals), [proposals]);

    /**
     * Live bids per site: assignmentId -> number of proposals still decidable.
     *
     * The backend's totalProposalsForAssignment counts EVERY row ever filed for
     * the site, including ones already rejected, so using it on the cards would
     * promise more competing plans than this queue actually shows.
     */
    const liveCountByAssignment = useMemo(
        () => countLiveProposalsBySite(proposals),
        [proposals]
    );

    /**
     * Bids parked with the cleaner after a revision request.
     *
     * They still hold their site open, but the officer cannot decide on them
     * until the cleaner resubmits - so the intro line states them separately
     * from the plans genuinely waiting on this desk.
     */
    const awaitingRevision = useMemo(
        () => countAwaitingRevision(proposals),
        [proposals]
    );

    // What is left once the parked ones are set aside: the real workload
    const awaitingDecision = proposals.length - awaitingRevision;

    /**
     * Sites whose competing bids could not be fetched on the last load.
     *
     * The queue is assembled from two endpoints, so a single failing site is
     * skipped rather than allowed to blank the desk - but the officer is told,
     * because a silently short queue looks like an empty one.
     */
    const unavailableSites = useMemo(
        () => countUnavailableSites(proposals),
        [proposals]
    );

    /**
     * Position of each bid within its own site: proposalId -> 1, 2, 3...
     *
     * Read together with the live count it becomes "Proposal 2 of 3 for this
     * site", which is what the officer is actually comparing.
     */
    const siteRankByProposal = useMemo(() => {
        const ranks = new Map();
        const seenPerSite = new Map();

        for (const proposal of proposals) {
            const nextRank = (seenPerSite.get(proposal.assignmentId) ?? 0) + 1;

            seenPerSite.set(proposal.assignmentId, nextRank);
            ranks.set(proposal.proposalId, nextRank); // oldest bid ranks first
        }

        return ranks;
    }, [proposals]);

    /** Search pressed (button or Enter) - apply the typed text, then jump up. */
    function handleSearch() {
        setAppliedQuery(query);

        // A narrowed list is shorter, so page 7 of the old result set is meaningless
        goToPage(1);

        listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /** Clear resets the box AND the applied term, so the full queue returns. */
    function handleClearSearch() {
        setQuery("");
        setAppliedQuery("");
        goToPage(1);
    }

    /**
     * A decision button was pressed - open the remarks dialog first.
     *
     * Nothing is sent until the officer confirms, because REJECTED and
     * REVISION_REQUIRED both require written reasons.
     */
    function handleDecisionRequest(decision, proposal) {
        setDecisionError("");
        setDecisionMessage("");
        setPendingDecision({ proposal, decision });
    }

    /**
     * Record the officer's decision on one proposal.
     *
     * On approval the backend assigns the work to that cleaner and closes the
     * other proposals for the same site, so the queue is re-read afterwards.
     */
    async function handleDecisionSubmit(payload) {
        if (!pendingDecision) {
            return;
        }

        const { proposal, decision } = pendingDecision;

        // Guard: never post an address built from a missing id
        if (!proposal?.proposalId) {
            setDecisionError(
                "This proposal could not be identified. Please reload the queue and try again."
            );
            return;
        }

        setDecisionBusy(true);
        setDecisionError("");

        try {
            await decideProposal(proposal.proposalId, payload);

            // Say plainly what the decision did to the site.
            setDecisionMessage(
                decision === APPROVAL_DECISION.APPROVED
                    ? `Approved. "${proposal.reportTitle}" is now assigned to ${proposal.cleanerName}.`
                    : `Your decision on "${proposal.reportTitle}" has been recorded and sent to ${proposal.cleanerName}.`
            );

            setPendingDecision(null);

            // Quiet re-fetch of both levels, so approved sites and their
            // auto-rejected rivals leave together without blanking the page.
            refresh();
        } catch (requestError) {
            setDecisionError(
                getErrorMessage(
                    requestError,
                    "This decision could not be recorded. Please try again."
                )
            );

            // A refusal usually means this card is out of date - the site was
            // awarded elsewhere or the cleaner already resubmitted. Re-read the
            // queue behind the dialog so the retry is made against the truth.
            refresh();
        } finally {
            setDecisionBusy(false);
        }
    }

    return (
        <div>
            <PageHeading
                title="Proposal Review"
                titleHi="प्रस्ताव समीक्षा"
                subtitle="Cleanup plans awaiting your corporation's decision. Approving one proposal assigns the site to that cleaner."
            />

            {/* Outcome of the last decision */}
            {decisionMessage && (
                <div className="mb-4">
                    <Alert type="success" title="Decision Recorded">
                        {decisionMessage}
                    </Alert>
                </div>
            )}

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing pending - the desk is genuinely clear */}
            {!loading && !error && proposals.length === 0 && (
                <ReportListEmpty
                    title="No proposals awaiting review"
                    description="When a cleaner inspects a reported site in your jurisdiction and files a cleanup plan, it will appear here for your decision."
                />
            )}

            {/* Part of the queue is missing - said plainly, at every stage */}
            {!loading && unavailableSites > 0 && (
                <div className="mb-4">
                    <Alert type="warning" title="Some sites could not be loaded">
                        {unavailableSites} site{unavailableSites === 1 ? "" : "s"} in this
                        queue could not be read just now, so {unavailableSites === 1 ? "its" : "their"}{" "}
                        proposals are not listed below. Everything else is shown as usual -
                        reload to try the missing {unavailableSites === 1 ? "site" : "sites"} again.
                    </Alert>
                </div>
            )}

            {!loading && !error && proposals.length > 0 && (
                <>
                    {/* Reminds the officer that one site can carry several bids */}
                    <div className="mb-4">
                        <Alert type="info" title="One decision per proposal">
                            {awaitingDecision} proposal{awaitingDecision === 1 ? "" : "s"}{" "}
                            {awaitingDecision === 1 ? "is" : "are"} awaiting your decision
                            across {siteCount} site{siteCount === 1 ? "" : "s"}. Where
                            several cleaners have bid for the same site, compare their
                            plans and approve only one - the rest are rejected
                            automatically.

                            {/* Parked bids are still listed, so say why they cannot be decided */}
                            {awaitingRevision > 0 && (
                                <span className="mt-1 block">
                                    {awaitingRevision} further proposal
                                    {awaitingRevision === 1 ? " has" : "s have"} been sent
                                    back for revision and {awaitingRevision === 1 ? "is" : "are"}{" "}
                                    waiting on the cleaner. {awaitingRevision === 1 ? "It stays" : "They stay"}{" "}
                                    listed because the site cannot be awarded while{" "}
                                    {awaitingRevision === 1 ? "it is" : "they are"} open.
                                </span>
                            )}
                        </Alert>
                    </div>

                    {/* Same search panel as the Public Reports register: the list
                        moves on Search, not on every keystroke */}
                    <div className="mb-4">
                        <RecordSearchBar
                            title="Search Proposals"
                            placeholder="Search by site, city or cleaner"
                            ariaLabel="Search proposals by site, city or cleaner"
                            value={query}
                            onChange={setQuery}
                            onSearch={handleSearch}
                            onClear={handleClearSearch}
                        >

                            {/* States what the list is currently showing, so a
                                filtered queue is never mistaken for the whole one */}
                            <p className="text-xs text-ink-muted">
                                {appliedQuery
                                    ? `Showing ${visibleProposals.length} of ${proposals.length} proposals matching "${appliedQuery}".`
                                    : "Searches the site name, address, city, cleaner and organisation."}
                            </p>
                        </RecordSearchBar>
                    </div>

                    {/* Search matched nothing, so say so instead of showing a blank list */}
                    {visibleProposals.length === 0 ? (
                        <ReportListEmpty
                            title="No proposals match this search"
                            description="Clear the search to see every proposal awaiting your decision."
                        />
                    ) : (
                        <div ref={listTopRef} className="space-y-3">
                            {pageItems.map((proposal, index) => {

                                // Competing bids arrive next to each other, so the
                                // site is announced once above its first card.
                                const startsNewSite =
                                    index === 0 ||
                                    pageItems[index - 1].assignmentId !==
                                        proposal.assignmentId;

                                // Counted from the live queue rather than the
                                // all-time backend total, so the banner can
                                // never disagree with the cards below it
                                const liveCount =
                                    liveCountByAssignment.get(proposal.assignmentId) ?? 1;

                                // Which bid this is for that site (1, 2, 3...)
                                const siteRank =
                                    siteRankByProposal.get(proposal.proposalId) ?? 1;

                                // Only worth a banner when the site is contested
                                const isContested = liveCount > 1;

                                return (
                                    <div key={proposal.proposalId}>
                                        {startsNewSite && isContested && (
                                            <p className="mb-2 rounded-gov border border-gov-blue/30 bg-blue-50/60 px-3 py-2 text-xs font-semibold tracking-wide text-gov-navy uppercase">
                                                {liveCount} competing proposals for this
                                                site
                                            </p>
                                        )}

                                        <ProposalReviewCard
                                            proposal={proposal}
                                            liveCount={liveCount}
                                            siteRank={siteRank}

                                            // The full plan is a page of its own,
                                            // so it can be linked, reloaded and
                                            // opened in a second tab beside a rival bid
                                            detailPath={`/municipal/proposals/${proposal.assignmentId}/${proposal.proposalId}`}
                                            busy={
                                                decisionBusy &&
                                                pendingDecision?.proposal?.proposalId ===
                                                    proposal.proposalId
                                            }
                                            onDecision={handleDecisionRequest}
                                        />
                                    </div>
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
                </>
            )}

            {/* Remarks dialog - the decision is only sent from here */}
            <ApprovalDecisionDialog
                open={Boolean(pendingDecision)}
                stage={APPROVAL_STAGE.PROPOSAL}
                decision={pendingDecision?.decision}

                // Names the site AND the cleaner, since rival bids share a title
                subject={
                    pendingDecision
                        ? [
                            pendingDecision.proposal?.reportTitle,
                            pendingDecision.proposal?.cleanerName,
                        ]
                            .filter(Boolean)
                            .join(" — ")
                        : ""
                }
                error={decisionError}
                busy={decisionBusy}
                onSubmit={handleDecisionSubmit}
                onClose={() => {
                    // Never drop a dialog mid-request
                    if (!decisionBusy) {
                        setPendingDecision(null);
                        setDecisionError("");
                    }
                }}
            />
        </div>
    );
}