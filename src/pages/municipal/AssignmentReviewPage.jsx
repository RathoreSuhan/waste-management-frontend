import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, User, Building2, CalendarClock, Navigation } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import BiText from "@/components/common/BiText";
import Alert from "@/components/ui/Alert";
import AssignmentStatusBadge from "@/components/cleanup/AssignmentStatusBadge";
import BeforeAfterImage from "@/components/reports/BeforeAfterImage";
import CompletionReviewCard from "@/components/municipal/CompletionReviewCard";
import ProposalDetailPanel from "@/components/municipal/ProposalDetailPanel";
import MunicipalActivityLogList from "@/components/municipal/MunicipalActivityLogList";
import ApprovalHistoryList from "@/components/municipal/ApprovalHistoryList";
import ApprovalDecisionDialog from "@/components/municipal/ApprovalDecisionDialog";

import {
    getAssignmentForReview,
    getAssignmentActivityLogs,
    getApprovalHistory,
    getProposalsForAssignment,
    decideCompletion,
} from "@/services/municipalService";
import {
    APPROVAL_STAGE,
    APPROVAL_DECISION,
    getCleanerTypeLabel,
} from "@/constants/municipalConstants";
import {
    ASSIGNMENT_STATUS,
    PROPOSAL_STATUS,
    CLEANUP_PROOF_RADIUS_METRES,
} from "@/constants/assignmentConstants";
import { formatDateTime } from "@/utils/formatters";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Assignment Review File (Phase 15 - Municipal Corporation Console)
 * ============================================================================
 *
 * The complete municipal file for one cleanup assignment, gathered on a single
 * screen so an officer never has to decide from a summary card alone:
 *
 *   1. Assignment summary  - site, status, cleaner, start GPS distance
 *   2. Evidence            - before/after images (full decision panel while
 *                            the assignment is AWAITING_APPROVAL)
 *   3. Approved proposal   - the plan this cleaner was actually awarded
 *   4. Activity diary      - the cleaner's dated on-site record
 *   5. Approval history    - every earlier municipal decision, including any
 *                            rework the corporation has already asked for
 *
 * Everything is read-only except the completion decision, which is only
 * offered while the assignment is waiting on this corporation. Gemini AI and
 * GPS figures on this page are advisory; the officer's recorded decision is
 * what closes the file.
 * ============================================================================
 */

// One labelled fact in the summary block.
function Fact({ icon: Icon, label, labelHi, value }) {
    return (
        <div className="flex items-start gap-2">
            <Icon size={14} className="mt-0.5 text-ink-muted" aria-hidden="true" />

            <div>
                <p className="text-xs font-semibold text-ink-muted">
                    <BiText en={label} hi={labelHi} />
                </p>

                {/* "Not recorded" is more useful to an officer than an empty cell */}
                <p className="text-sm text-ink">{value || "Not recorded"}</p>
            </div>
        </div>
    );
}

export default function AssignmentReviewPage() {

    // Which assignment file the officer opened.
    const { assignmentId } = useParams();

    // The four parts of the file, each with its own failure message so one
    // broken section never hides the rest.
    const [assignment, setAssignment] = useState(null);
    const [logs, setLogs] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [proposals, setProposals] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [logsError, setLogsError] = useState("");
    const [historyError, setHistoryError] = useState("");

    // Counter used to re-read the file after a decision (house hook pattern).
    const [reloadKey, setReloadKey] = useState(0);

    // Completion decision in progress, when the file is awaiting approval.
    const [pendingDecision, setPendingDecision] = useState(null);
    const [decisionBusy, setDecisionBusy] = useState(false);
    const [decisionError, setDecisionError] = useState("");
    const [decisionMessage, setDecisionMessage] = useState("");

    /**
     * Read the whole file in one pass.
     *
     * allSettled is deliberate: a missing activity diary or approval trail
     * must not blank out the evidence the officer came here to examine.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        Promise.allSettled([
            getAssignmentForReview(assignmentId),
            getAssignmentActivityLogs(assignmentId),
            getApprovalHistory(assignmentId),
            getProposalsForAssignment(assignmentId),
        ]).then((results) => {
            if (ignore) {
                return;
            }

            const [fileResult, logsResult, historyResult, proposalsResult] = results;

            // 1. The assignment itself - without this there is no file
            if (fileResult.status === "fulfilled") {
                setAssignment(fileResult.value);
                setError("");
            } else {
                setError(
                    getErrorMessage(
                        fileResult.reason,
                        "This cleanup file could not be loaded."
                    )
                );
            }

            // 2. Cleaner's activity diary
            setLogs(logsResult.status === "fulfilled" ? logsResult.value : []);
            setLogsError(
                logsResult.status === "rejected"
                    ? getErrorMessage(
                          logsResult.reason,
                          "The activity record could not be loaded."
                      )
                    : ""
            );

            // 3. Earlier municipal decisions, including any rework already asked for
            setApprovals(historyResult.status === "fulfilled" ? historyResult.value : []);
            setHistoryError(
                historyResult.status === "rejected"
                    ? getErrorMessage(
                          historyResult.reason,
                          "The approval history could not be loaded."
                      )
                    : ""
            );

            // 4. Proposals filed for this site, used to show the approved plan
            setProposals(proposalsResult.status === "fulfilled" ? proposalsResult.value : []);

            setLoading(false);
        });

        // Cleanup runs when the component unmounts or reloads
        return () => {
            ignore = true;
        };
    }, [assignmentId, reloadKey]);

    /**
     * Quiet re-read after a decision - keeps the file on screen while it catches up.
     */
    const refresh = useCallback(() => {
        setReloadKey((key) => key + 1);
    }, []);

    // The plan this cleaner was actually awarded, if the officer has approved one.
    const approvedProposal = proposals.find(
        (proposal) => proposal.status === PROPOSAL_STATUS.APPROVED
    );

    // Only an assignment waiting on this corporation can be decided here.
    const awaitingDecision =
        assignment?.assignmentStatus === ASSIGNMENT_STATUS.AWAITING_APPROVAL;

    /*
      Where "back" goes. A closed file is reached from Cleanup History, and
      Active Cleanups no longer lists it, so sending the officer there would be
      a dead end. Every other state is still active work, which is where the
      link has always pointed.
    */
    const isClosed = assignment?.assignmentStatus === ASSIGNMENT_STATUS.COMPLETED;

    /**
     * Record the officer's completion decision on this file.
     *
     * Approval closes the assignment; anything else returns it for rework and
     * the cleaner may submit fresh proof, which reopens this same file.
     */
    async function handleDecisionSubmit(payload) {
        if (!pendingDecision) {
            return;
        }

        const { decision } = pendingDecision;

        setDecisionBusy(true);
        setDecisionError("");

        try {
            await decideCompletion(assignment.assignmentId, payload);

            setDecisionMessage(
                decision === APPROVAL_DECISION.APPROVED
                    ? "Completion approved. The assignment is closed and the report is marked resolved."
                    : `Returned to ${assignment.cleanerName} for rework. Your remarks have been recorded on this file.`
            );

            setPendingDecision(null);

            // Re-read so the status, history and diary all reflect the decision.
            refresh();
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
            {/* Back to the desk this file actually belongs to */}
            <Link
                to={isClosed ? "/municipal/history" : "/municipal/active"}
                className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                {isClosed ? "Back to Cleanup History" : "Back to Active Cleanups"}
            </Link>

            <PageHeading
                title="Cleanup Review File"
                titleHi="सफाई समीक्षा फ़ाइल"
                subtitle="Evidence, plan, activity record and decision history for one assignment."
            />

            {/* Outcome of the last decision taken on this file */}
            {decisionMessage && (
                <div className="mb-4">
                    <Alert type="success" title="Decision Recorded">
                        {decisionMessage}
                    </Alert>
                </div>
            )}

            {/* First load */}
            {loading && (
                <div
                    className="h-40 animate-pulse rounded-gov border border-rule bg-paper"
                    aria-hidden="true"
                />
            )}

            {/* The file itself could not be read */}
            {!loading && error && (
                <Alert type="error" title="File Unavailable">
                    {error}
                </Alert>
            )}

            {!loading && !error && assignment && (
                <div className="space-y-4">

                    {/* 1. Assignment summary */}
                    <section className="rounded-gov border border-rule bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <h2 className="font-serif text-lg font-bold text-gov-navy">
                                {assignment.reportTitle}
                            </h2>

                            <AssignmentStatusBadge status={assignment.assignmentStatus} />
                        </div>

                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                            <MapPin size={14} aria-hidden="true" />
                            {assignment.address || "Address not recorded"}
                            {assignment.city && ` \u2022 ${assignment.city}`}
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <Fact
                                icon={User}
                                label="Assigned cleaner"
                                labelHi="नियुक्त सफाईकर्मी"
                                value={assignment.cleanerName}
                            />

                            <Fact
                                icon={Building2}
                                label="Cleaner type"
                                labelHi="सफाईकर्मी प्रकार"
                                value={
                                    // Organisation name is more informative when present
                                    assignment.cleanerOrganization ||
                                    getCleanerTypeLabel(assignment.cleanerType)
                                }
                            />

                            <Fact
                                icon={CalendarClock}
                                label="Work started"
                                labelHi="कार्य आरंभ"
                                value={formatDateTime(assignment.startedAt)}
                            />

                            <Fact
                                icon={Navigation}
                                label="Start GPS distance"
                                labelHi="आरंभ जीपीएस दूरी"
                                value={
                                    // Measured against the same 50 m rule the backend enforces
                                    assignment.startDistanceMeters === null ||
                                    assignment.startDistanceMeters === undefined
                                        ? null
                                        : `${Math.round(assignment.startDistanceMeters)} m from site (limit ${CLEANUP_PROOF_RADIUS_METRES} m)`
                                }
                            />

                            <Fact
                                icon={CalendarClock}
                                label="Assignment created"
                                labelHi="असाइनमेंट निर्मित"
                                value={formatDateTime(assignment.claimedAt)}
                            />

                            <Fact
                                icon={CalendarClock}
                                label="Completion submitted"
                                labelHi="पूर्णता प्रस्तुत"
                                value={formatDateTime(assignment.completedAt)}
                            />
                        </div>
                    </section>

                    {/* 2. Evidence. While the file awaits this corporation the full
                        decision panel is shown; otherwise the images are read-only. */}
                    {awaitingDecision ? (
                        <CompletionReviewCard
                            assignment={assignment}
                            busy={decisionBusy}
                            onDecision={(decision) => {
                                setDecisionError("");
                                setDecisionMessage("");
                                setPendingDecision({ decision });
                            }}
                        />
                    ) : (
                        <section className="rounded-gov border border-rule bg-white p-4">
                            <h2 className="mb-3 font-serif text-lg font-bold text-gov-navy">
                                <BiText en="Site Evidence" hi="स्थल साक्ष्य" />
                            </h2>

                            <BeforeAfterImage
                                beforeUrl={assignment.beforeImageUrl}
                                afterUrl={assignment.afterImageUrl}
                                title={assignment.reportTitle}
                                caption="The after image appears once the cleaner submits proof for review."
                            />
                        </section>
                    )}

                    {/* 3. The plan this cleaner was awarded */}
                    <section>
                        <h2 className="mb-2 font-serif text-lg font-bold text-gov-navy">
                            <BiText en="Approved Cleanup Plan" hi="स्वीकृत सफाई योजना" />
                        </h2>

                        {approvedProposal ? (
                            <ProposalDetailPanel proposal={approvedProposal} />
                        ) : (
                            <Alert type="info" title="No Approved Plan On File">
                                No cleanup proposal has been approved for this site yet, so
                                there is no agreed plan to compare the work against.
                            </Alert>
                        )}
                    </section>

                    {/* 4. Cleaner's dated on-site record */}
                    <section>
                        <h2 className="mb-2 font-serif text-lg font-bold text-gov-navy">
                            <BiText en="Cleaner Activity Record" hi="सफाईकर्मी गतिविधि विवरण" />
                        </h2>

                        <MunicipalActivityLogList logs={logs} error={logsError} />
                    </section>

                    {/* 5. Every municipal decision taken on this file so far */}
                    <section>
                        <h2 className="mb-2 font-serif text-lg font-bold text-gov-navy">
                            <BiText en="Municipal Decision History" hi="नगरपालिका निर्णय इतिहास" />
                        </h2>

                        <ApprovalHistoryList approvals={approvals} error={historyError} />
                    </section>
                </div>
            )}

            {/* Remarks dialog - the decision is only sent from here */}
            <ApprovalDecisionDialog
                open={Boolean(pendingDecision)}
                stage={APPROVAL_STAGE.COMPLETION}
                decision={pendingDecision?.decision}
                subject={assignment?.reportTitle}
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