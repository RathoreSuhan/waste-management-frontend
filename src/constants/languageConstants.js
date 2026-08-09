/**
 * ============================================================================
 * Language Constants
 * ============================================================================
 *
 * The two supported interface languages, and the storage key the preference
 * is kept under.
 *
 * Held apart from LanguageContext.jsx because that file exports a component:
 * Fast Refresh only preserves state for modules that export components
 * alone, so constants shared from there would force a full reload on every
 * edit. Same reasoning as authContextInstance.js standing apart.
 * ============================================================================
 */

// Supported languages. Values match the HTML lang attribute codes.
export const LANGUAGES = {
    EN: "en",
    HI: "hi",
};

// localStorage key holding the reader's choice
export const LANGUAGE_STORAGE_KEY = "language";
