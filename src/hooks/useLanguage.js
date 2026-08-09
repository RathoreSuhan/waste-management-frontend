import { useContext } from "react";

import LanguageContext from "@/context/languageContextInstance";

/**
 * ============================================================================
 * useLanguage
 * ============================================================================
 *
 * Reads the language context: language, setLanguage, toggleLanguage, isHindi.
 *
 * Saves every consumer from importing both useContext and the context
 * object, and gives one place to change if the shape ever moves.
 * ============================================================================
 */
export default function useLanguage() {
    return useContext(LanguageContext);
}
