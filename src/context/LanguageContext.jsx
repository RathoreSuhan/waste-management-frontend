import { useCallback, useEffect, useMemo, useState } from "react";

import LanguageContext from "@/context/languageContextInstance";
import {
    LANGUAGES,
    LANGUAGE_STORAGE_KEY,
} from "@/constants/languageConstants";

/**
 * ============================================================================
 * Language Provider
 * ============================================================================
 *
 * Holds the active interface language for the whole application.
 *
 * The platform is bilingual rather than translated: every label carries an
 * English and a Hindi rendering, and this setting decides which of the two
 * is read as the primary text. Nothing is hidden by switching - the other
 * language stays on screen as the secondary gloss, so a reader who is more
 * comfortable in one can still recognise the other.
 *
 * The choice is written to localStorage. Someone who reads Hindi should not
 * have to set that again on every visit.
 * ============================================================================
 */

/**
 * Read the saved preference, defaulting to English.
 *
 * Anything unrecognised is discarded rather than trusted: a hand-edited or
 * half-written entry should not leave the interface in an unknown state.
 */
function readStoredLanguage() {
    try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (stored === LANGUAGES.EN || stored === LANGUAGES.HI) {
            return stored;
        }

        return LANGUAGES.EN;
    } catch {
        // Storage blocked entirely (private browsing)
        return LANGUAGES.EN;
    }
}

export function LanguageProvider({ children }) {

    // Read storage once, on the first render only
    const [language, setLanguageState] = useState(readStoredLanguage);

    /**
     * Keep the document language in step with the choice.
     *
     * This is not decoration: screen readers pick their pronunciation from
     * the lang attribute, so Devanagari announced as English is close to
     * unusable. It also lets the browser choose the right hyphenation.
     */
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    /**
     * Switch to a specific language and remember the choice.
     */
    const setLanguage = useCallback((next) => {

        // Ignore anything that is not one of the two supported values
        if (next !== LANGUAGES.EN && next !== LANGUAGES.HI) {
            return;
        }

        setLanguageState(next);

        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
        } catch {
            // Preference simply will not persist; the session still works
        }
    }, []);

    /**
     * Flip between the two languages, which is what the header control does.
     */
    const toggleLanguage = useCallback(() => {
        setLanguage(
            language === LANGUAGES.EN ? LANGUAGES.HI : LANGUAGES.EN
        );
    }, [language, setLanguage]);

    /*
      Memoised so consumers are not re-rendered by an unrelated parent
      render producing a fresh object identity.
    */
    const value = useMemo(
        () => ({
            language,
            setLanguage,
            toggleLanguage,

            // Convenience flag, since components read this far more than they set it
            isHindi: language === LANGUAGES.HI,
        }),
        [language, setLanguage, toggleLanguage]
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
