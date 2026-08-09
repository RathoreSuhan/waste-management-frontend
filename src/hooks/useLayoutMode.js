import { useContext } from "react";

import LayoutModeContext from "@/context/layoutModeContextInstance";

/**
 * ============================================================================
 * useLayoutMode
 * ============================================================================
 *
 * Reads the shell a page is rendering inside: { inApp, basePath }.
 *
 * - inApp    true within the signed-in shell, false on the public site
 * - basePath "/app" or "", to prefix links so they stay in the same shell
 * ============================================================================
 */
export default function useLayoutMode() {
    return useContext(LayoutModeContext);
}
