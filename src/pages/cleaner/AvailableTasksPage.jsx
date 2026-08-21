import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import TaskCard from "@/components/cleanup/TaskCard";
import CleanupDisclaimerDialog from "@/components/cleanup/CleanupDisclaimerDialog";
import Pagination from "@/components/common/Pagination";
import useAssignments from "@/hooks/useAssignments";
import useCleanupDisclaimer from "@/hooks/useCleanupDisclaimer";
import usePagination from "@/hooks/usePagination";

import { getPendingAssignments, getMyProposals } from "@/services/cleanupService";
import { blocksNewProposal } from "@/constants/assignmentConstants"; // withdrawn/rejected offers must not block a fresh one
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * Available Tasks (Phase 14)
 * ============================================================================
 *
 * Open cleanup assignments a cleaner may inspect and propose for.
 *
 * A cleaner no longer claims work here. Instead the card leads to an on-site
 * inspection and a written cleanup proposal, which a municipal officer reviews
 * against the proposals of other cleaners. Because nothing is taken off the
 * list by proposing, a site stays visible to everyone until an officer approves
 * one proposal.
 *
 * The backend only accepts work inside a cleaner's own registered city and
 * state, but the open list is not filtered by that rule, so sites from
 * elsewhere can appear. The refusal is left to the proposal request, which
 * names the actual restriction.
 * ============================================================================
 */

export default function AvailableTasksPage() {

    const navigate = useNavigate();

    // Open assignments, loaded once on mount
    const { assignments, loading, error, reload } =
        useAssignments(getPendingAssignments);

    // Sites where this cleaner still holds a LIVE proposal, so cards can say so
    const [proposedAssignmentIds, setProposedAssignmentIds] = useState([]);

    // Ten sites to a page
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(assignments);

    // Anchor for the jump back up when the page changes
    const listTopRef = useRef(null);

    /*
      Own proposals are fetched separately because CleanupAssignmentResponse
      carries no per-cleaner proposal flag. A failure here is deliberately
      silent: it only costs the "already proposed" hint, and the backend still
      rejects a duplicate proposal outright.

      Only LIVE offers count. A cleaner who withdrew a proposal - or whose plan
      was not selected - is entitled to propose again for as long as the site
      remains unawarded, so those rows must not lock the button away.
    */
    useEffect(() => {
        let active = true;

        getMyProposals()
            .then((proposals) => {
                if (active) {
                    setProposedAssignmentIds(
                        proposals
                            .filter(blocksNewProposal) // drops WITHDRAWN and REJECTED offers
                            .map((proposal) => proposal.assignmentId)
                    );
                }
            })
            .catch(() => {
                // Hint unavailable; the list itself is unaffected
            });

        return () => {
            active = false;
        };
    }, []);

    /**
     * Move to the inspection and proposal form for one site.
     *
     * The assignment travels in router state so the form can show the address
     * and measure the cleaner's distance from the reported waste - the backend
     * has no endpoint for a single assignment.
     */
    const handlePropose = useCallback(
        (assignment) => {
            navigate(`/cleaner/proposals/new/${assignment.assignmentId}`, {
                state: { assignment },
            });
        },
        [navigate]
    );

    /*
      The presence notice stands between the card and the form, so the site
      visit requirement is acknowledged before the cleaner sets out.
    */
    const disclaimer = useCleanupDisclaimer(handlePropose);

    return (
        <div>
            <PageHeading
                title="Available Tasks"
                titleHi="उपलब्ध कार्य"
                subtitle="Open cleanup work reported by citizens. Inspect a site and submit a proposal for municipal approval."
            />

            {/* Sets the expectation before a cleaner travels to a site */}
            <div className="mb-4">
                <Alert type="info" title="Proposals are reviewed, not first-come">
                    Visit the site, record what you find and submit your cleanup
                    plan. Several cleaners may propose for the same site; the
                    municipal corporation approves one of them.
                </Alert>
            </div>

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Nothing waiting - a good state, so it is worded positively */}
            {!loading && !error && assignments.length === 0 && (
                <ReportListEmpty
                    title="No tasks waiting"
                    description="Every reported site is already under review or in progress. Check back later for newly reported waste in your area."
                />
            )}

            {/* Sites open for proposals */}
            {!loading && !error && assignments.length > 0 && (
                <div ref={listTopRef} className="space-y-3">
                    {pageItems.map((assignment) => (
                        <TaskCard
                            key={assignment.assignmentId}
                            assignment={assignment}
                            // Opens the notice; the form opens on acceptance
                            onPropose={disclaimer.requestAcknowledgement}
                            // Replaces the action with a waiting-for-review note
                            alreadyProposed={proposedAssignmentIds.includes(
                                assignment.assignmentId
                            )}
                        />
                    ))}

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onPageChange={goToPage}
                        itemLabel="tasks"
                        scrollTargetRef={listTopRef}
                    />
                </div>
            )}

            {/* Where the municipal decision will appear */}
            <button
                type="button"
                onClick={() => navigate("/cleaner/proposals")}
                className="mt-4 text-sm font-semibold text-gov-blue hover:underline"
            >
                Go to My Proposals
            </button>

            {/* Presence undertaking - shown afresh for every site */}
            <CleanupDisclaimerDialog
                open={Boolean(disclaimer.pendingAssignment)}
                reportTitle={disclaimer.pendingAssignment?.reportTitle}
                onAccept={disclaimer.accept}
                onCancel={disclaimer.cancel}
            />
        </div>
    );
}