import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * useAssignments (Phase 8)
 * ============================================================================
 *
 * Loads a list of cleanup assignments from whichever service function is
 * passed in, so the same hook drives the pending list, the cleaner's own
 * tasks and the dashboard counts.
 *
 * Two ways to reload, for the same reason as useReports:
 *
 *   reload()  - visible reload, shows the loading state again
 *   refresh() - quiet re-fetch that leaves the current list on screen
 *
 * refresh() matters here because claiming or starting a task should update
 * the list without blanking the page the cleaner is looking at.
 * ============================================================================
 */

export default function useAssignments(fetcher) {

    // Assignments currently loaded
    const [assignments, setAssignments] = useState([]);

    // Only true for the first load and explicit reloads
    const [loading, setLoading] = useState(true);

    // Failure message, cleared on every new attempt
    const [error, setError] = useState("");

    // Counter used to re-run the request on retry or refresh
    const [reloadKey, setReloadKey] = useState(0);

    /**
     * Fetch the list whenever the fetcher changes or a reload is requested.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        fetcher()
            .then((data) => {
                if (!ignore) {
                    setAssignments(data);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!ignore) {
                    setError(
                        getErrorMessage(
                            requestError,
                            "Your cleanup tasks could not be loaded."
                        )
                    );
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        // Cleanup runs when the component unmounts or reloads
        return () => {
            ignore = true;
        };
    }, [fetcher, reloadKey]);

    /**
     * Full reload - shows the loading state again (used by retry buttons).
     */
    const reload = useCallback(() => {
        setLoading(true);
        setError("");
        setReloadKey((key) => key + 1);
    }, []);

    /**
     * Quiet re-fetch - keeps whatever is rendered while the list catches up.
     */
    const refresh = useCallback(() => {

        // Same trigger as reload, without raising the loading flag
        setReloadKey((key) => key + 1);
    }, []);

    return {
        assignments,
        loading,
        error,
        reload,
        refresh,
    };
}
