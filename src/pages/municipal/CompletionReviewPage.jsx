import { useRef, useState } from "react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/common/Pagination";
import CompletionReviewCard from "@/components/municipal/CompletionReviewCard";
import ApprovalDecisionDialog from "@/components/municipal/ApprovalDecisionDialog";
import usePagination from "@/hooks/usePagination";
import useAssignments from "@/hooks/useAssignments";

import { getCompletionQueue, decideCompletion } from "@/services/municipalService";
import {
    APPROVAL_STAGE,
    APPROVAL_DECISION,
    AI_ADVISORY_NOTICE,
} from "@/constants/municipalConstants";
import { getErrorMessage } from "@/utils/errorMessage";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * Completion Review (Phase 15 - Municipal Corporation Console)
 * ============================================================================
 *
 * The final desk, and the only place an assignment can be closed.
 *
 * Each card carries everything needed for the judgement:
 *   - the citizen's before image and the cleaner's after image
 *   - the GPS result measured against the 50 m site radius
 *   - Gemini's advisory verdict and confidence
 *   - the cleaner's identity, type/organisation and diary entry count
 *
 * Three outcomes:
 *   Approve Completion - assignment COMPLETED, report RESOLVED, reward released
 *   Request Rework     - assignment REWORK_REQUIRED, cleaner continues and resubmits
 *   Reject Evidence    - assignment REWORK_REQUIRED, evidence refused outright
 *
 * The AI verdict is advisory. A PASS never closes an assignment on its own -
 * only the officer's recorded decision does, and rework keeps the loop open
 * until the officer is satisfied.
 * ============================================================================
 */

export default function CompletionReviewPage() {

    // Same list hook as the other queues; the fetcher is a stable import.
    const {
        assignments,
        loading,
        error,
        reload,
        refresh,
    } = useAssignments(getCompletionQueue);

    // Decision currently being taken: { assignment, decision }.
    const [pendingDecision, setPendingDecision] = useState(null);
    const [decisionBusy, setDecisionBusy] = useState(false);
    const [decisionError, setDecisionError] = useState("");
    const [decisionMessage, setDecisionMessage] = useState("");

    // Anchor for the jump back up when the page changes.
    const listTopRef = useRef(null);

    // Ten submissions to a page.
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(assignments);

    /**
     * A decision button was pressed - open the remarks dialog first.
     *
     * Rework and rejection both require written reasons, because that text is
     * the only instruction the cleaner receives about what to fix.
     */
    function handleDecisionRequest(decision, assignment) {
        setDecisionError("");
        setDecisionMessage("");
        setPendingDecision({ assignment, decision });
    }

    /**
     * Record the officer's completion decision.
     *
     * APPROVED closes the assignment, resolves the report and releases the
     * cleaner's reward. Anything else sends the assignment back to
     * REWORK_REQUIRED so the cleaner can continue and submit fresh proof.
     */
    async function handleDecisionSubmit(payload) {
        if (!pendingDecision) {
            return;
        }

        const { assignment, decision } = pendingDecision;

        setDecisionBusy(true);
        setDecisionError("");

        try {
            await decideCompletion(assignment.assignmentId, payload);

            // Spell out the consequence, since the two branches differ sharply.
            setDecisionMessage(
                decision === APPROVAL_DECISION.APPROVED
                    ? `Completion approved. "${assignment.reportTitle}" is closed and the report is marked resolved.`
                    : `"${assignment.reportTitle}" has been returned to ${assignment.cleanerName} for rework. It will come back here once fresh proof is submitted.`
            );

            setPendingDecision(null);

            // Quiet re-fetch, so the decided submission leaves the queue.
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
            <PageHeading
                title="Completion Review"
                titleHi="पूर्णता समीक्षा"
                subtitle="Cleanup proof awaiting your verification. Only your approval closes an assignment."
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
            {loading && <ReportListSkeleton count={2} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing waiting on the officer */}
            {!loading && !error && assignments.length === 0 && (
                <ReportListEmpty
                    title="No completions awaiting review"
                    description="When a cleaner submits before/after proof that clears the GPS and AI checks, the assignment will appear here for your decision."
                />
            )}

            {!loading && !error && assignments.length > 0 && (
                <>
                    {/* The governing principle, restated where the decision is taken */}
                    <div className="mb-4">
                        <Alert type="info" title={AI_ADVISORY_NOTICE.title}>
                            {AI_ADVISORY_NOTICE.body}
                        </Alert>
                    </div>

                    <div ref={listTopRef} className="space-y-4">
                        {pageItems.map((assignment) => (
                            <CompletionReviewCard
                                key={assignment.assignmentId}
                                assignment={assignment}
                                busy={
                                    decisionBusy &&
                                    pendingDecision?.assignment?.assignmentId ===
                                        assignment.assignmentId
                                }
                                onDecision={handleDecisionRequest}
                            />
                        ))}

                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            rangeStart={rangeStart}
                            rangeEnd={rangeEnd}
                            onPageChange={goToPage}
                            itemLabel="submissions"
                            scrollTargetRef={listTopRef}
                        />
                    </div>
                </>
            )}

            {/* Remarks dialog - the decision is only sent from here */}
            <ApprovalDecisionDialog
                open={Boolean(pendingDecision)}
                stage={APPROVAL_STAGE.COMPLETION}
                decision={pendingDecision?.decision}
                subject={pendingDecision?.assignment?.reportTitle}
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