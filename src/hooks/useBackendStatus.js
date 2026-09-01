import { useContext } from "react";

import BackendStatusContext from "@/context/backendStatusContextInstance";

/**
 * ============================================================================
 * useBackendStatus
 * ============================================================================
 *
 * Reads the backend warm-up state: status, isWaking, isAwake, isUnreachable,
 * recheck.
 *
 * Mirrors useAuthContext - the hook lives outside the provider file so that
 * file exports only a component, which is what React Fast Refresh needs in
 * order to keep the warm-up loop running while editing during development.
 * ============================================================================
 */

export function useBackendStatus() {
    return useContext(BackendStatusContext);
}

export default useBackendStatus;
