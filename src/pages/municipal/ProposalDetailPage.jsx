import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Users } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import BiText from "@/components/common/BiText";
import AssignmentStatusBadge from "@/components/cleanup/AssignmentStatusBadge";
import ProposalDetailPanel from "@/components/municipal/ProposalDetailPanel";
import ApprovalDecisionDialog from "@/components/municipal/ApprovalDecisionDialog";
import Pagination from "@/components/common/Pagination";
import { ReportListSkeleton, ReportListError } from "@/components/reports/ReportListStates";
import usePagination from "@/hooks/usePagination";

import { getProposalsForAssignment, decideProposal } from "@/services/municipalService";
import { isProposalEditable } from "@/constants/assignmentConstants";
import {
    APPROVAL_STAGE,
    getCleanerTypeLabel,
    getDecisionActions,
} from "@/constants/municipalConstants";
import { REVIEW_PAGE_SIZE } from "@/constants/paginationConstants"; // five rival bids to a page
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Proposal Detail Page (Municipal Officer console)
 * ============================================================================
 *
 * One cleanup proposal, read in full on its own page.
 *
 * The plan used to unfold inside its card in the Proposal Review queue, which
 * made a long document behave like a drawer: it pushed the neighbouring bids
 * off-screen, could not be linked to, and vanished on reload. A plan is
 * evidence the officer reads, quotes in their remarks and returns to later, so
 * it now has an address of its own - exactly like a citizen's report at
 * /app/reports/{id}.
 *
 * WHY THE URL CARRIES TWO IDS
 * ---------------------------
 *   /municipal/proposals/{assignmentId}/{proposalId}
 *
 * The backend exposes proposals only per site
 * (GET /assignment/{assignmentId}/proposals); there is no GET /proposal/{id}.
 * Keeping the assignment id in the path means this page can rebuild itself from
 * the URL alone - one authorised request, no dependence on state handed over by
 * the queue - so a reload, a bookmark or a second tab all still work.
 *
 * A useful side effect: the same request returns the rival bids for the site,
 * which are listed at the foot of the page so the officer can move straight
 * from one plan to the next while comparing them.
 * ============================================================================
 */

// The three verdicts available at the PROPOSAL stage, resolved once.
const PROPOSAL_ACTIONS = getDecisionActions(APPROVAL_STAGE.PROPOSAL);

export default function ProposalDetailPage() {
    const { assignmentId, proposalId } = useParams();
    const navigate = useNavigate();

    // Everything filed for this site; the page picks its own row out of it.
    const [siteProposals, setSiteProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Bumped by Retry to re-run the read, the same counter pattern the other
    // review screens use instead of holding a fetch function in state.
    const [reloadKey, setReloadKey] = useState(0);

    // Anchor for the jump back to the rivals heading when its page changes.
    const rivalsTopRef = useRef(null);

    // Decision in flight: the chosen verdict, plus dialog state.
    const [pendingDecision, setPendingDecision] = useState(null);
    const [decisionBusy, setDecisionBusy] = useState(false);
    const [decisionError, setDecisionError] = useState("");

    /**
     * Read the proposals filed for this site.
     *
     * One request serves the whole page: the plan being read, and the rival bids
     * listed at the foot of it.
     *
     * Nothing is set synchronously in the effect body - `loading` already starts
     * true, and Retry raises it again itself - so this never triggers a
     * cascading render.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        getProposalsForAssignment(assignmentId)
            .then((rows) => {
                if (ignore) {
                    return;
                }

                setSiteProposals(rows);
                setError("");
            })
            .catch((requestError) => {
                if (ignore) {
                    return;
                }

                setError(
                    getErrorMessage(
                        requestError,
                        "This cleanup plan could not be loaded. Please try again."
                    )
                );
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [assignmentId, reloadKey]);

    /*
      The row this page is about. Path params are strings and the ids are
      numbers, so the comparison is made on strings deliberately.
    */
    const proposal = useMemo(
        () =>
            siteProposals.find(
                (row) => String(row.proposalId) === String(proposalId)
            ) || null,
        [siteProposals, proposalId]
    );

    // The other bids for the same site, still open for a decision.
    const rivalProposals = useMemo(
        () =>
            siteProposals.filter(
                (row) =>
                    String(row.proposalId) !== String(proposalId) &&
                    isProposalEditable(row)
            ),
        [siteProposals, proposalId]
    );

    /*
      A busy site can carry many bids, so the list below is paged five at a
      time - the same size as the Proposal Review queue itself.

      Pagination renders nothing at a single page, so a site with five rivals
      or fewer looks exactly as it did before.
    */
    const {
        page: rivalPage,
        pageItems: rivalPageItems,
        totalPages: rivalTotalPages,
        total: rivalTotal,
        rangeStart: rivalRangeStart,
        rangeEnd: rivalRangeEnd,
        goToPage: goToRivalPage,
    } = usePagination(rivalProposals, REVIEW_PAGE_SIZE);

    // Only a live proposal may still be decided; a decided one is read-only here.
    const decidable = proposal ? isProposalEditable(proposal) : false;

    /** A verdict was pressed - collect the officer's remarks before sending. */
    function handleDecisionRequest(decision) {
        setDecisionError("");
        setPendingDecision(decision);
    }

    /**
     * Record the decision, then return to the queue.
     *
     * The queue is the officer's working list, and this proposal has just left
     * it, so staying on a page that no longer needs a decision would be
     * misleading. The outcome is announced there via navigation state.
     */
    async function handleDecisionSubmit(payload) {
        if (!proposal?.proposalId) {
            setDecisionError(
                "This proposal could not be identified. Please reload the page and try again."
            );
            return;
        }

        setDecisionBusy(true);
        setDecisionError("");

        try {
            await decideProposal(proposal.proposalId, payload);

            setPendingDecision(null);

            // Back to the desk, where the list re-reads itself on mount
            navigate("/municipal/proposals");
        } catch (requestError) {
            setDecisionError(
                getErrorMessage(
                    requestError,
                    "This decision could not be recorded. Please try again."
                )
            );
        } finally {
            setDecisionBusy(false);
        }
    }

    return (
        <div>
            {/* Always available, even while loading or after a failure */}
            <Link
                to="/municipal/proposals"
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
            >
                <ArrowLeft size={15} aria-hidden="true" />
                Back to Proposal Review
            </Link>

            <PageHeading
                title="Cleanup Plan"
                titleHi="सफाई योजना"
                subtitle="The complete inspection record and cleaning plan behind one proposal."
            />

            {loading && <ReportListSkeleton count={2} />}

            {!loading && error && (
                <ReportListError
                    message={error}

                    // Re-runs the effect above rather than duplicating the read;
                    // the skeleton is shown again by raising loading here
                    onRetry={() => {
                        setLoading(true);
                        setReloadKey((key) => key + 1);
                    }}
                />
            )}

            {/* Loaded, but the id in the URL is not part of this site */}
            {!loading && !error && !proposal && (
                <Alert type="error" title="Proposal not found">
                    This proposal is not on record for this site. It may have been
                    withdrawn, or the address may be mistyped. Return to Proposal Review
                    and open it from the queue.
                </Alert>
            )}

            {!loading && !error && proposal && (
                <>
                    {/* Which site and which cleaner, so the page stands alone */}
                    <section className="rounded-gov border border-rule bg-paper p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                    Proposal #{proposal.proposalId}
                                </p>

                                <h2 className="mt-1 font-serif text-lg font-bold text-gov-navy">
                                    {proposal.reportTitle || `Report #${proposal.reportId}`}
                                </h2>

                                <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-muted">
                                    <MapPin
                                        className="mt-0.5 h-4 w-4 shrink-0"
                                        aria-hidden="true"
                                    />
                                    <span className="min-w-0">
                                        {proposal.address}
                                        {proposal.city ? `, ${proposal.city}` : ""}
                                    </span>
                                </p>
                            </div>

                            <AssignmentStatusBadge status={proposal.assignmentStatus} />
                        </div>

                        {/* Cleaner identity, repeated here because rival bids share the title */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-gov border border-rule bg-white p-3">
                                <p className="text-xs tracking-wide text-ink-muted uppercase">
                                    <BiText en="Proposed by" hi="प्रस्तावकर्ता" />
                                </p>
                                <p className="mt-1 text-sm font-semibold text-ink">
                                    {proposal.cleanerName || "-"}
                                </p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                                    <span>{getCleanerTypeLabel(proposal.cleanerType)}</span>
                                    {proposal.cleanerOrganization ? (
                                        <span className="flex items-center gap-1.5">
                                            <Building2
                                                className="h-4 w-4"
                                                aria-hidden="true"
                                            />
                                            {proposal.cleanerOrganization}
                                        </span>
                                    ) : null}
                                </p>
                            </div>

                            <div className="rounded-gov border border-rule bg-white p-3">
                                <p className="text-xs tracking-wide text-ink-muted uppercase">
                                    <BiText en="Offer" hi="प्रस्तावित" />
                                </p>
                                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
                                    <span>
                                        {proposal.estimatedDurationDays
                                            ? `${proposal.estimatedDurationDays} day${proposal.estimatedDurationDays > 1 ? "s" : ""}`
                                            : "Duration not stated"}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4" aria-hidden="true" />
                                        {proposal.manpowerCount
                                            ? `${proposal.manpowerCount} people`
                                            : "Manpower not stated"}
                                    </span>
                                </p>

                                {/* Links the paperwork back to the citizen's original report */}
                                <Link
                                    to={`/app/reports/${proposal.reportId}`}
                                    className="mt-2 inline-block text-sm font-semibold text-gov-blue hover:underline"
                                >
                                    View the citizen's report
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* The plan itself - the same panel the queue used to unfold inline */}
                    <div className="mt-4">
                        <ProposalDetailPanel proposal={proposal} />
                    </div>

                    {/* Decisions, taken from this page so the officer need not go back */}
                    <section className="mt-4 rounded-gov border border-rule bg-paper p-4 sm:p-5">
                        <h3 className="text-sm font-semibold tracking-wide text-gov-navy uppercase">
                            <BiText en="Your decision" hi="आपका निर्णय" />
                        </h3>

                        {decidable ? (
                            <>
                                <p className="mt-1 text-sm text-ink-muted">
                                    Approving this plan authorises {proposal.cleanerName} to
                                    clean the site. Any other proposal for the same site is
                                    then rejected automatically.
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {PROPOSAL_ACTIONS.map((action) => (
                                        <Button
                                            key={action.decision}
                                            type="button"
                                            variant={action.variant}
                                            fullWidth={false}
                                            disabled={decisionBusy}
                                            className="px-3 py-2 text-sm"
                                            onClick={() =>
                                                handleDecisionRequest(action.decision)
                                            }
                                        >
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            // Already decided: the page stays readable as a record
                            <p className="mt-1 text-sm text-ink-muted">
                                A decision has already been recorded for this proposal, so
                                no further action is available here. The audit trail is on
                                the assignment's review page.
                            </p>
                        )}
                    </section>

                    {/* Rival bids for the same site, one click apart */}
                    {rivalProposals.length > 0 && (
                        <section
                            ref={rivalsTopRef}
                            className="mt-4 rounded-gov border border-rule bg-white p-4 sm:p-5"
                        >
                            <h3 className="text-sm font-semibold tracking-wide text-gov-navy uppercase">
                                <BiText
                                    en="Other proposals for this site"
                                    hi="इस स्थल के अन्य प्रस्ताव"
                                />
                            </h3>

                            <ul className="mt-3 divide-y divide-rule">
                                {rivalPageItems.map((rival) => (
                                    <li
                                        key={rival.proposalId}
                                        className="flex flex-wrap items-center justify-between gap-2 py-2"
                                    >
                                        <span className="min-w-0 text-sm text-ink">
                                            {rival.cleanerName || `Proposal #${rival.proposalId}`}
                                            <span className="text-ink-muted">
                                                {" "}
                                                · {getCleanerTypeLabel(rival.cleanerType)}
                                                {rival.estimatedDurationDays
                                                    ? ` · ${rival.estimatedDurationDays} day${rival.estimatedDurationDays > 1 ? "s" : ""}`
                                                    : ""}
                                            </span>
                                        </span>

                                        {/* Same two-id address, so comparing is just a link away */}
                                        <Link
                                            to={`/municipal/proposals/${rival.assignmentId}/${rival.proposalId}`}
                                            className="text-sm font-semibold text-gov-blue hover:underline"
                                        >
                                            Compare this plan
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            {/* Silent on a single page, so short lists are unaffected */}
                            <Pagination
                                page={rivalPage}
                                totalPages={rivalTotalPages}
                                total={rivalTotal}
                                rangeStart={rivalRangeStart}
                                rangeEnd={rivalRangeEnd}
                                onPageChange={goToRivalPage}
                                itemLabel="proposals"
                                scrollTargetRef={rivalsTopRef}
                            />
                        </section>
                    )}
                </>
            )}

            {/* Remarks dialog - the decision is only sent from here */}
            <ApprovalDecisionDialog
                open={Boolean(pendingDecision)}
                stage={APPROVAL_STAGE.PROPOSAL}
                decision={pendingDecision}
                subject={
                    proposal
                        ? [proposal.reportTitle, proposal.cleanerName]
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