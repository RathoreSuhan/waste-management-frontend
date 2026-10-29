import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Reports Data Hook
 * ============================================================================
 *
 * Small reusable hook that loads report data from any service function
 * and exposes the three states every list page needs:
 *
 * loading -> show skeleton
 * error   -> show alert
 * data    -> render list
 *
 * Usage:
 * const { data, loading, error, reload } = useReports(getMyReports);
 *
 * `failureFallback` is the message used when an error carries no readable
 * backend reason (a bare 403 or a network drop, for example). Consumers pass
 * one naming their own domain so a leaderboard never apologises for reports.
 *
 * Note: pass a stable function (module level service function or a
 * useCallback result) so the effect does not run on every render.
 * ============================================================================
 */
export default function useReports(fetcher, initialValue = [], failureFallback = "Unable to load reports.") {

    // Data returned by the backend
    const [data, setData] = useState(initialValue);

    // Starts as true because the first request runs immediately
    const [loading, setLoading] = useState(true);

    // Backend or network error message
    const [error, setError] = useState("");

    // Counter used to re-run the request when the user retries
    const [reloadKey, setReloadKey] = useState(0);

    /**
     * Fetch data whenever the fetcher changes or a reload is requested.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        fetcher()
            .then((response) => {
                if (!ignore) {
                    setData(response);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!ignore) {
                    // Convert the Axios error into a readable message
                    setError(getErrorMessage(requestError, failureFallback));
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
    }, [fetcher, reloadKey, failureFallback]);

    /**
     * Retry the request (used by the error state button).
     */
    const reload = useCallback(() => {

        // Show the loading state again
        setLoading(true);

        // Clear the previous error before retrying
        setError("");

        // Changing the key re-triggers the effect above
        setReloadKey((key) => key + 1);
    }, []);

    /**
     * Re-fetch without showing the loading state.
     *
     * Used after an action succeeds - voting or commenting, for instance -
     * where the data on screen is still valid and only needs to catch up.
     * Raising the loading flag there would unmount the page and throw away
     * anything the user had open, such as a half-written reply.
     */
    const refresh = useCallback(() => {

        // Same trigger as reload, without disturbing what is rendered
        setReloadKey((key) => key + 1);
    }, []);

    return {
        data,
        loading,
        error,
        reload,
        refresh,
    };
}


