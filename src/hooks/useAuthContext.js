import { useContext } from "react";

import AuthContext from "@/context/authContextInstance";

/**
 * ============================================================================
 * useAuthContext
 * ============================================================================
 *
 * Reads the authentication context: user, token, login, logout,
 * isAuthenticated.
 *
 * This used to live in AuthContext.jsx. It moved out so that file exports
 * only the provider component, which is what React Fast Refresh needs in
 * order to keep the session alive while editing during development.
 * ============================================================================
 */

export function useAuthContext() {
    return useContext(AuthContext);
}

export default useAuthContext;
