import { useCallback, useEffect, useState } from "react";

import { getDashboardStats } from "@/services/municipalService";
import { loadPendingProposals, countProposalSites } from "@/utils/municipalQueue";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * useMunicipalStats (Final stage - Municipal Dashboard)
 * ============================================================================
 *
 * Loads the jurisdiction summary shown on the Municipal Officer dashboard:
 * relevant reports, pending proposals, active cleanups, completion reviews and
 * completed cleanups, plus the corporation name / city / state header text.
 *
 * The officer never passes a corporation id. The backend resolves the officer's
 * own Municipal Corporation from their profile city, so this hook takes no
 * arguments - an officer can only ever see their own jurisdiction.
 *
 * WHY A SECOND REQUEST IS MADE
 * ----------------------------
 * The summary endpoint counts assignments sitting in PROPOSAL_SUBMITTED, i.e.
 * SITES awaiting a decision - so two cleaners bidding for the same site are
 * one there. The Proposal Review desk decides per PROPOSAL and therefore shows
 * two. Read separately the officer saw "Pending Proposals 1" on this screen and
 * "2 proposals ... across 1 site" on the next, with no way to tell which was
 * right.
 *
 * So the live proposal queue is loaded alongside the summary and its own count
 * replaces pendingProposals, with the site total kept beside it. Both screens
 * now read the same list, so the two figures cannot disagree.
 *
 * Same shape as useAssignments / useReports so the pages stay consistent:
 *
 *   reload() - visible reload, raises the loading state again
 *
 * State is only ever set inside promise callbacks (never synchronously in the
 * effect body), which is what the project's ESLint rules expect.
 * ============================================================================
 */

export default function useMunicipalStats() {

    // Latest stats payload (null until the first response arrives)
    const [stats, setStats] = useState(null);

    // True for the first load and for every explicit reload
    const [loading, setLoading] = useState(true);

    // Failure message, cleared on each new attempt
    const [error, setError] = useState("");

    // Counter that re-triggers the request when the officer retries
    const [reloadKey, setReloadKey] = useState(0);

    /**
     * Fetch the dashboard counters on mount and after every reload().
     */
    useEffect(() => {

        // Guards against a late response from a stale request
        let ignore = false;

        /*
          The counters and the proposal queue are fetched together.

          allSettled rather than all: the summary is the important half, so a
          failing queue request must not blank the whole dashboard. It only
          costs the officer the exact proposal figure, and the fallback below
          says so plainly instead of showing a number that looks precise.
        */
        Promise.allSettled([getDashboardStats(), loadPendingProposals()])
            .then(([summaryResult, queueResult]) => {
                if (ignore) {
                    return;
                }

                // Summary failed - nothing to show, surface the error
                if (summaryResult.status === "rejected") {
                    setError(
                        getErrorMessage(
                            summaryResult.reason,
                            "The municipal dashboard summary could not be loaded."
                        )
                    );
                    return;
                }

                const summary = summaryResult.value;

                if (queueResult.status === "fulfilled") {
                    const pending = queueResult.value;

                    setStats({
                        ...summary,

                        // True count of plans awaiting a decision, matching Proposal Review
                        pendingProposals: pending.length,

                        // How many sites those plans belong to, for the tile's sub-line
                        pendingProposalSites: countProposalSites(pending),
                    });
                } else {
                    /*
                      Queue unavailable. The backend figure is kept, but flagged
                      as a SITE count so the tile can word itself honestly
                      rather than passing a site total off as a proposal total.
                     */
                    setStats({
                        ...summary,
                        pendingProposalSites: summary.pendingProposals,
                        pendingProposalsAreSites: true,
                    });
                }

                setError("");
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        // Runs on unmount or before the next reload
        return () => {
            ignore = true;
        };
    }, [reloadKey]);

    /**
     * Full reload - used by the retry button and after a decision is recorded,
     * because approving a proposal or a completion moves the counters.
     */
    const reload = useCallback(() => {
        setLoading(true);
        setError("");
        setReloadKey((key) => key + 1);
    }, []);

    return {
        stats,
        loading,
        error,
        reload,
    };
}