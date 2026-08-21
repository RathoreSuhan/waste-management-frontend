import { useCallback, useEffect, useState } from "react";
import { getMyProposals } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * useProposals (Phase 14)
 * ============================================================================
 *
 * Loads the cleanup proposals submitted by the signed-in cleaner.
 *
 * Built like useAssignments, for the same reason: state is only ever set from
 * inside the request callbacks, and a counter re-runs the effect, so a reload
 * never triggers a cascading render.
 *
 *   reload()  - visible reload, shows the loading state again
 *   refresh() - quiet re-fetch that leaves the current list on screen
 *
 * refresh() matters after a withdrawal, which should update the list without
 * blanking the page the cleaner is reading.
 * ============================================================================
 */

export default function useProposals() {

    // Proposals currently loaded
    const [proposals, setProposals] = useState([]);

    // Only true for the first load and explicit reloads
    const [loading, setLoading] = useState(true);

    // Failure message, cleared on every successful attempt
    const [error, setError] = useState("");

    // Counter used to re-run the request on retry or refresh
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        getMyProposals()
            .then((data) => {
                if (!ignore) {
                    setProposals(data);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!ignore) {
                    setError(
                        getErrorMessage(
                            requestError,
                            "Your proposals could not be loaded."
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
    }, [reloadKey]);

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
        proposals,
        loading,
        error,
        reload,
        refresh,
    };
}