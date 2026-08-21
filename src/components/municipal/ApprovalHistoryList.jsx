/**
 * ============================================================================
 * Approval History List (Phase 16 - Municipal Officer console)
 * ============================================================================
 *
 * The audit trail of every municipal decision recorded against one assignment,
 * rendered from the backend CleanupApprovalResponse rows.
 *
 * Each row is an immutable administrative act: which stage it belonged to
 * (PROPOSAL or COMPLETION), what was decided, who decided it, for which
 * corporation, when, and the remarks they were required to give when refusing.
 *
 * This matters most in the rework loop - an assignment can pass through
 * COMPLETION review several times, so the officer looking at it today needs to
 * see what a colleague objected to last week before deciding again.
 *
 * Purely presentational: the page fetches the trail via
 * municipalService.getApprovalHistory(assignmentId) and passes it in.
 * ============================================================================
 */

import { History, User } from "lucide-react";
import BiText from "@/components/common/BiText";
import ApprovalDecisionBadge from "@/components/municipal/ApprovalDecisionBadge";
import { APPROVAL_STAGE_META } from "@/constants/municipalConstants";
import { formatDateTime } from "@/utils/formatters";

export default function ApprovalHistoryList({ approvals = [], loading = false, error = "" }) {

    return (
        <section className="rounded-gov border border-rule bg-paper p-4 sm:p-5">

            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gov-navy">
                <History className="h-4 w-4" aria-hidden="true" />
                <BiText en="Decision history" hi="निर्णय इतिहास" />
            </h3>

            {/* Explains why the trail exists rather than leaving it unexplained */}
            <p className="mt-1 text-xs text-ink-muted">
                <BiText
                    en="Every municipal decision on this assignment, newest first. Records cannot be edited or removed."
                    hi="इस कार्य पर निगम के सभी निर्णय, नवीनतम पहले। रिकॉर्ड बदले या हटाए नहीं जा सकते।"
                />
            </p>

            {/* Loading / error / empty are handled before the trail itself */}
            {loading ? (
                <p className="mt-4 text-sm text-ink-muted">Loading decision history...</p>
            ) : error ? (
                <p className="mt-4 text-sm text-rose-700">{error}</p>
            ) : approvals.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                    <BiText
                        en="No municipal decision has been recorded for this assignment yet."
                        hi="इस कार्य पर अभी तक निगम का कोई निर्णय दर्ज नहीं हुआ है।"
                    />
                </p>
            ) : (
                <ol className="mt-4 space-y-3">
                    {approvals.map((approval) => {

                        // Falls back to PROPOSAL wording if a future stage is added backend side
                        const stageMeta = APPROVAL_STAGE_META[approval.stage] || APPROVAL_STAGE_META.PROPOSAL;

                        return (
                            <li key={approval.approvalId} className="rounded-gov border border-rule bg-white p-3">

                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                        <BiText en={stageMeta.label} hi={stageMeta.labelHi} />
                                    </p>

                                    {/* Colour-coded verdict, shared with every other officer screen */}
                                    <ApprovalDecisionBadge decision={approval.decision} />
                                </div>

                                {/* Remarks are mandatory for refusals, so they usually exist here */}
                                {approval.remarks ? (
                                    <p className="mt-2 whitespace-pre-line text-sm text-ink">{approval.remarks}</p>
                                ) : null}

                                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                                    <User className="h-3.5 w-3.5" aria-hidden="true" />

                                    {/* decidedByName is the officer, municipalCorporationName the body they act for */}
                                    <span className="font-medium text-ink">{approval.decidedByName || "-"}</span>
                                    {approval.municipalCorporationName ? (
                                        <span>&middot; {approval.municipalCorporationName}</span>
                                    ) : null}
                                    <span>&middot; {approval.decidedAt ? formatDateTime(approval.decidedAt) : "-"}</span>
                                </p>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}