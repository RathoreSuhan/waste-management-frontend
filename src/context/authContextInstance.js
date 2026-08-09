import { createContext } from "react";

/**
 * ============================================================================
 * Auth Context Instance
 * ============================================================================
 *
 * The context object on its own, away from the provider component.
 *
 * React Fast Refresh only preserves state in files that export components
 * and nothing else. Keeping this object here lets AuthContext.jsx export
 * just the provider, so editing it during development no longer drops the
 * session and forces a fresh login.
 * ============================================================================
 */

const AuthContext = createContext(null);

export default AuthContext;
