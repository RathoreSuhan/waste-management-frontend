import { createContext } from "react";

/**
 * ============================================================================
 * Backend Status Context Instance
 * ============================================================================
 *
 * The context object and its status values, away from the provider component.
 *
 * Same reason as authContextInstance: React Fast Refresh only preserves state
 * in files that export components and nothing else, so BackendStatusContext.jsx
 * exports just the provider. Editing it during development therefore does not
 * restart the warm-up loop.
 * ============================================================================
 */

/**
 * The four states a visitor's session can be in with respect to the backend.
 *
 * UNKNOWN     - the first ping is in flight and has not been slow enough to
 *               be worth mentioning yet. Nothing is shown.
 * WAKING      - the backend has not answered within WAKE_NOTICE_AFTER, so the
 *               container is presumed to be starting. This is what the notice
 *               and the header strip are for.
 * AWAKE       - a ping succeeded. Normal operation; nothing is shown.
 * UNREACHABLE - WARMUP_MAX_WAIT of retries produced nothing, so this is no
 *               longer a cold start and saying so is more honest than a
 *               spinner that never resolves.
 */
export const BACKEND_STATUS = {
    UNKNOWN: "UNKNOWN",
    WAKING: "WAKING",
    AWAKE: "AWAKE",
    UNREACHABLE: "UNREACHABLE",
};

const BackendStatusContext = createContext(null);

export default BackendStatusContext;
