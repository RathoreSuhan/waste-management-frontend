import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,      // back to the list the cleaner came from
    MapPin,         // the site
    Users,          // manpower
    Clock,          // duration
    CalendarDays,   // proposed start
    Layers,         // competing proposals
    Pencil,         // the revise route, only while the paper is still open
    Ruler,          // how far the inspection stood from the reported spot
    Trash2,         // waste handling
    Wrench,         // equipment
} from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import ProposalStatusBadge from "@/components/cleanup/ProposalStatusBadge";
import {
    ReportListSkeleton,
    ReportListError,
} from "@/components/reports/ReportListStates";

import { getProposal } from "@/services/cleanupService";
import { isProposalEditable, PROPOSAL_STATUS } from "@/constants/assignmentConstants";
import { getErrorMessage } from "@/utils/errorMessage";
import { formatDistance } from "@/utils/geo";
import {
    buildMapsUrl,
    formatCoordinates,
    formatDateTime,
    formatRelativeTime,
} from "@/utils/formatters";

/**
 * ============================================================================
 * Proposal Details (cleaner, read-only)
 * ============================================================================
 *
 * One filed cleanup proposal, opened from My Proposals.
 *
 * Why this page exists at all: the only route into a proposal used to be the
 * edit form, and that link is hidden the moment the corporation rules on the
 * paper. So a cleaner whose bid was approved - or passed over in favour of
 * another - could no longer read back what they had actually promised, even
 * though every word of it is still on file and still binding on them.
 *
 * It is deliberately a reading page, not a second form. Nothing here submits.
 * The one action offered is "Revise & Resubmit", and only while the proposal is
 * genuinely still open (isProposalEditable), so an approved plan cannot be
 * quietly rewritten after the fact.
 *
 * The decision the corporation recorded is stated at the top rather than the
 * bottom: it is the thing the cleaner opened the page to find out.
 * ============================================================================
 */

// A date on its own, no clock - proposed start dates carry no time of day
function formatDay(value) {
    if (!value) {
        return "Not specified";
    }

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * One labelled fact in the summary grid.
 *
 * Rendered as a real <dt>/<dd> pair so a screen reader reads "Manpower, six
 * workers" rather than two unrelated fragments.
 */
function Fact({ icon: Icon, label, children }) {
    return (
        <div className="flex items-start gap-2">
            <Icon
                size={15}
                className="mt-0.5 shrink-0 text-ink-muted"
                aria-hidden="true"
            />
            <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {label}
                </dt>
                <dd className="text-sm text-ink">{children}</dd>
            </div>
        </div>
    );
}

/**
 * One long written answer.
 *
 * Skipped entirely when the field is blank - several of the plan fields are
 * optional, and an empty heading reads like something failed to load.
 */
function Passage({ title, titleHi, children }) {
    if (!children) {
        return null;
    }

    return (
        <div>
            <h3 className="font-serif text-sm font-bold text-gov-navy">
                {title}
                <span className="ml-2 font-sans text-xs font-normal text-ink-muted">
                    {titleHi}
                </span>
            </h3>
            {/* whitespace-pre-line keeps the paragraph breaks the cleaner typed */}
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                {children}
            </p>
        </div>
    );
}

export default function ProposalDetailPage() {

    const { proposalId } = useParams();

    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Bumped by Retry, which is all it takes to re-run the effect below
    const [reloadToken, setReloadToken] = useState(0);

    /**
     * Fetch the proposal.
     *
     * The backend scopes GET /api/cleanup-proposals/{id} to the signed-in
     * cleaner, so another cleaner's proposal id returns a refusal rather than
     * their inspection notes. No client-side ownership check is needed.
     *
     * The request is declared inside the effect rather than hoisted into a
     * useCallback above it. A hoisted loader is called synchronously from the
     * effect body, so its first setLoading(true) lands during the same commit
     * and cascades an extra render - which the React Compiler lint rule flags.
     * Keeping it here puts every setState behind an await instead, and the
     * `ignore` flag throws away a reply whose render has already been replaced
     * (a fast second navigation, or Strict Mode's double mount).
     */
    useEffect(() => {

        let ignore = false;

        async function fetchProposal() {
            try {
                const data = await getProposal(proposalId);
                if (!ignore) {
                    setProposal(data);
                    setError("");
                }
            } catch (requestError) {
                if (!ignore) {
                    setError(
                        getErrorMessage(
                            requestError,
                            "This proposal could not be opened. It may have been removed."
                        )
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        fetchProposal();

        return () => {
            ignore = true;   // this render is over; drop whatever comes back
        };
    }, [proposalId, reloadToken]);

    /* Retry is an event handler, so it is free to set state directly */
    function reload() {
        setLoading(true);
        setError("");
        setReloadToken((token) => token + 1);
    }

    // Still open, so the revise route is worth offering
    const editable = isProposalEditable(proposal);

    // An officer has asked for changes - revising is the expected next step
    const revisionRequested = proposal?.status === PROPOSAL_STATUS.REVISION_REQUIRED;

    return (
        <div>
            {/* Back before the heading, because this page is always arrived at from a list */}
            <Link
                to="/cleaner/proposals"
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
            >
                <ArrowLeft size={15} aria-hidden="true" />
                Back to My Proposals
            </Link>

            <PageHeading
                title="Proposal Details"
                titleHi="प्रस्ताव विवरण"
                subtitle="The cleanup plan you filed for this site, exactly as the municipal corporation received it."
            />

            {loading && <ReportListSkeleton count={2} />}

            {!loading && error && <ReportListError message={error} onRetry={reload} />}

            {!loading && !error && proposal && (
                <div className="space-y-4">

                    {/* ---- Identity of the site and the ruling on the bid ---- */}
                    <section className="rounded-gov border border-rule bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <h2 className="font-serif text-lg font-bold text-gov-navy">
                                {proposal.reportTitle}
                            </h2>

                            <ProposalStatusBadge status={proposal.status} />
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                            <MapPin size={14} aria-hidden="true" />
                            {proposal.address || "Address not recorded"}
                            {proposal.city && ` \u2022 ${proposal.city}`}
                        </p>

                        {/*
                          The outcome, in words, above everything else.

                          The badge alone says APPROVED or Not Selected; this says what
                          that means for the cleaner and when it was decided, which is
                          the question that brought them here.
                        */}
                        {proposal.status === PROPOSAL_STATUS.APPROVED && (
                            <div className="mt-3">
                                <Alert type="success" title="Approved by the municipal corporation">
                                    This site was awarded to you
                                    {proposal.latestDecisionAt
                                        ? ` ${formatRelativeTime(proposal.latestDecisionAt)}`
                                        : ""}
                                    . The plan below is the one you are expected to carry
                                    out - it appears in My Tasks as an active cleanup.
                                </Alert>
                            </div>
                        )}

                        {proposal.status === PROPOSAL_STATUS.REJECTED && (
                            <div className="mt-3">
                                {/*
                                  Warning, never error: nothing went wrong. One proposal per
                                  site can be approved, and another cleaner's was chosen.
                                */}
                                <Alert type="warning" title="Another proposal was selected">
                                    The corporation approved a different cleaner for this
                                    site
                                    {proposal.latestDecisionAt
                                        ? ` ${formatRelativeTime(proposal.latestDecisionAt)}`
                                        : ""}
                                    . Your inspection and plan stay on record, and you may
                                    propose for any other open site.
                                </Alert>
                            </div>
                        )}

                        {revisionRequested && (
                            <div className="mt-3">
                                <Alert type="warning" title="Revision requested">
                                    The corporation has asked you to change this proposal
                                    before it can be approved. Use Revise &amp; Resubmit
                                    below.
                                </Alert>
                            </div>
                        )}

                        {proposal.status === PROPOSAL_STATUS.WITHDRAWN && (
                            <div className="mt-3">
                                <Alert type="info" title="Withdrawn by you">
                                    You pulled this proposal back, so it was never decided.
                                    The record is kept for audit only.
                                </Alert>
                            </div>
                        )}

                        {proposal.status === PROPOSAL_STATUS.SUBMITTED && (
                            <div className="mt-3">
                                <Alert type="info" title="Waiting on the corporation">
                                    An officer compares every proposal filed for this site
                                    before choosing one, so submitting does not reserve the
                                    work.
                                </Alert>
                            </div>
                        )}
                    </section>

                    {/* ---- The plan, as figures ---- */}
                    <section className="rounded-gov border border-rule bg-white p-4">
                        <h2 className="font-serif text-base font-bold text-gov-navy">
                            Cleanup Plan
                            <span className="ml-2 font-sans text-xs font-normal text-ink-muted">
                                सफाई योजना
                            </span>
                        </h2>

                        <dl className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Fact icon={Clock} label="Estimated duration">
                                {proposal.estimatedDurationDays} day
                                {proposal.estimatedDurationDays === 1 ? "" : "s"}
                            </Fact>

                            <Fact icon={Users} label="Manpower">
                                {proposal.manpowerCount} worker
                                {proposal.manpowerCount === 1 ? "" : "s"}
                            </Fact>

                            <Fact icon={CalendarDays} label="Proposed start">
                                {formatDay(proposal.proposedStartDate)}
                            </Fact>

                            {/* Optional on the form, so only shown when it was answered */}
                            {proposal.estimatedWasteVolume && (
                                <Fact icon={Trash2} label="Estimated waste volume">
                                    {proposal.estimatedWasteVolume}
                                </Fact>
                            )}

                            <Fact icon={Layers} label="Proposals for this site">
                                {/* Explains the wait without naming the other cleaners */}
                                {proposal.totalProposalsForAssignment > 1
                                    ? `${proposal.totalProposalsForAssignment} in total`
                                    : "Only yours"}
                            </Fact>

                            <Fact icon={Clock} label="Filed">
                                {formatDateTime(proposal.submittedAt)}
                            </Fact>
                        </dl>

                        <div className="mt-4 space-y-4 border-t border-rule pt-4">
                            <Passage title="Cleaning Method" titleHi="सफाई विधि">
                                {proposal.cleaningMethod}
                            </Passage>

                            <Passage title="Waste Handling" titleHi="कचरा निपटान">
                                {proposal.wasteHandlingPlan}
                            </Passage>

                            <Passage title="Remarks" titleHi="टिप्पणी">
                                {proposal.remarks}
                            </Passage>
                        </div>

                        {/* Equipment reads as a list of kit, so it gets its own icon row */}
                        {proposal.equipment && (
                            <div className="mt-4 flex items-start gap-2 border-t border-rule pt-4">
                                <Wrench
                                    size={15}
                                    className="mt-0.5 shrink-0 text-ink-muted"
                                    aria-hidden="true"
                                />
                                <div>
                                    <h3 className="font-serif text-sm font-bold text-gov-navy">
                                        Equipment
                                        <span className="ml-2 font-sans text-xs font-normal text-ink-muted">
                                            उपकरण
                                        </span>
                                    </h3>
                                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                                        {proposal.equipment}
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ---- The inspection that backs the plan ---- */}
                    <section className="rounded-gov border border-rule bg-white p-4">
                        <h2 className="font-serif text-base font-bold text-gov-navy">
                            Site Inspection
                            <span className="ml-2 font-sans text-xs font-normal text-ink-muted">
                                स्थल निरीक्षण
                            </span>
                        </h2>

                        <p className="mt-1 text-sm text-ink-muted">
                            Recorded on site when you filed the proposal. This is the
                            evidence the corporation weighed the plan against.
                        </p>

                        <Passage title="Observations" titleHi="अवलोकन">
                            {proposal.siteObservations}
                        </Passage>

                        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                            {proposal.inspectedAt && (
                                <Fact icon={Clock} label="Inspected at">
                                    {formatDateTime(proposal.inspectedAt)}
                                </Fact>
                            )}

                            {/*
                              Distance is the reading that actually mattered: the form
                              refuses an inspection taken more than 50 m from the reported
                              spot, so this is the proof the cleaner really stood there.
                            */}
                            {typeof proposal.inspectionDistanceMeters === "number" && (
                                <Fact icon={Ruler} label="Distance from reported site">
                                    {formatDistance(proposal.inspectionDistanceMeters)}
                                </Fact>
                            )}

                            {proposal.inspectionLatitude !== null &&
                                proposal.inspectionLatitude !== undefined && (
                                    <Fact icon={MapPin} label="Inspection coordinates">
                                        {formatCoordinates(
                                            proposal.inspectionLatitude,
                                            proposal.inspectionLongitude
                                        )}
                                        {/* Opens the reading on a map, in a new tab so this page survives */}
                                        <a
                                            href={buildMapsUrl(
                                                proposal.inspectionLatitude,
                                                proposal.inspectionLongitude
                                            )}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-2 font-semibold text-gov-blue hover:underline"
                                        >
                                            View on map
                                        </a>
                                    </Fact>
                                )}
                        </dl>

                        {/* The photograph, shown large - it is the substance of the inspection */}
                        {proposal.inspectionImageUrl && (
                            <img
                                src={proposal.inspectionImageUrl}
                                alt="Photograph taken during your site inspection"
                                loading="lazy"
                                className="mt-3 w-full rounded-gov border border-rule object-cover"
                            />
                        )}
                    </section>

                    {/* ---- Where to go from here ---- */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/*
                          Opens the same form as the list does, which loads the filed
                          proposal and sends a PUT. Hidden once the corporation has ruled,
                          so a decided plan cannot be rewritten from this page.
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
                                {revisionRequested ? "Revise & Resubmit" : "Edit Proposal"}
                            </Link>
                        )}

                        {/* The citizen's original report, for the full context of the site */}
                        <Link
                            to={`/reports/${proposal.reportId}`}
                            className="text-sm font-semibold text-gov-blue hover:underline"
                        >
                            View Report
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}