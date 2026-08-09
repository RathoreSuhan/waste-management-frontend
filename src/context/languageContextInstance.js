import { createContext } from "react";

/**
 * ============================================================================
 * Language Context Instance
 * ============================================================================
 *
 * The context object on its own, kept in a plain .js file away from the
 * provider component.
 *
 * Fast Refresh replaces a module that exports components; if the context
 * object lived beside the provider it would be replaced along with it, and
 * every consumer would fall back to the default value mid-session. Keeping
 * the identity here means an edit to the provider cannot break the tree.
 *
 * Mirrors how authContextInstance.js is separated from AuthContext.jsx.
 * ============================================================================
 */

const LanguageContext = createContext({

    // Active language: "en" or "hi"
    language: "en",

    // Switch to a specific language
    setLanguage: () => { },

    // Flip between the two
    toggleLanguage: () => { },
});

export default LanguageContext;
