import { useState, useEffect, useCallback } from "react";

import { getMyRewardSummary, getMyRewardHistory } from "@/services/rewardService";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * useRewards (Phase 9)
 * ============================================================================
 *
 * Loads the cleaner's reward summary and ledger together.
 *
 * Both requests are issued in parallel under a single loading flag. Two
 * separate hooks would let the page paint a total while the ledger was
 * still arriving, which reads as though entries are missing. One flag
 * means the figure and the entries that justify it always appear together.
 *
 * Promise.all is deliberate: if either call fails the whole view is
 * wrong, so it surfaces as one error with a retry rather than a page
 * that is half data and half error.
 * ============================================================================
 */

export default function useRewards() {

    // Total points and cleaner name
    const [summary, setSummary] = useState(null);

    // Individual reward entries, newest first
    const [history, setHistory] = useState([]);

    // True on first load and on explicit retries
    const [loading, setLoading] = useState(true);

    // Failure message, cleared at the start of every attempt
    const [error, setError] = useState("");

    // Bumped to re-run the effect
    const [reloadKey, setReloadKey] = useState(0);

    /**
     * Re-fetch both endpoints, showing the loading state.
     */
    const reload = useCallback(() => {
        setReloadKey((key) => key + 1);
    }, []);

    useEffect(() => {

        /**
         * Guard against setting state after the component unmounts,
         * or after a newer request has superseded this one.
         */
        let active = true;

        async function load() {

            setLoading(true);
            setError("");

            try {
                const [summaryData, historyData] = await Promise.all([
                    getMyRewardSummary(),
                    getMyRewardHistory(),
                ]);

                // A newer run has taken over, so discard this result
                if (!active) {
                    return;
                }

                setSummary(summaryData);
                setHistory(Array.isArray(historyData) ? historyData : []);
            } catch (requestError) {

                if (!active) {
                    return;
                }

                setError(
                    getErrorMessage(
                        requestError,
                        "Your reward details could not be loaded."
                    )
                );

                /**
                 * Clear stale values so a failed retry cannot leave the
                 * previous cleaner's figures on screen beside an error.
                 */
                setSummary(null);
                setHistory([]);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [reloadKey]);

    return {
        summary,
        history,
        loading,
        error,
        reload,
    };
}
