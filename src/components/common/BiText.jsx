import useLanguage from "@/hooks/useLanguage";
import { LANGUAGES } from "@/constants/languageConstants";

/**
 * ============================================================================
 * Bilingual Text
 * ============================================================================
 *
 * Renders a label in both languages, with the reader's choice as the
 * primary text and the other as a smaller gloss beside it.
 *
 * This component owns that rule outright. Before it existed, English was
 * hardcoded as the prominent one and Hindi as the small grey gloss in every
 * label across the site, which meant "switch to Hindi" could not be honoured
 * without editing dozens of files. Now switching language only changes which
 * string is passed as primary, and every label follows.
 *
 * Nothing is hidden by switching. A reader who sets Hindi still sees the
 * English term in the margin, which matters on a civic platform where the
 * English wording is often the one used on forms and in correspondence.
 *
 * Given only one language, that one renders on its own with no gloss - so a
 * label with no Hindi translation yet degrades quietly rather than breaking.
 * ============================================================================
 */

export default function BiText({
    // English rendering of the label
    en,

    // Hindi (Devanagari) rendering, optional
    hi,

    // Extra classes for the primary text, e.g. a heading size
    className = "",

    // Extra classes for the secondary gloss
    glossClassName = "",

    /*
      Hides the gloss, for tight spaces such as a narrow button where two
      languages side by side would wrap. The primary text still follows
      the reader's choice.
    */
    primaryOnly = false,
}) {

    const { language } = useLanguage();

    // Whichever language is not chosen falls back to the one that exists
    const primary = language === LANGUAGES.HI ? (hi || en) : (en || hi);

    const secondary = language === LANGUAGES.HI ? en : hi;

    /*
      Marking the language of each run lets a screen reader switch voice
      mid-label instead of reading Devanagari with English pronunciation.
    */
    const primaryLang = language === LANGUAGES.HI && hi
        ? LANGUAGES.HI
        : LANGUAGES.EN;

    const secondaryLang = language === LANGUAGES.HI
        ? LANGUAGES.EN
        : LANGUAGES.HI;

    // Only one language supplied, or the gloss deliberately suppressed
    const showGloss = Boolean(secondary) && !primaryOnly && primary !== secondary;

    return (
        <>
            <span lang={primaryLang} className={className}>
                {primary}
            </span>

            {showGloss && (
                <span
                    lang={secondaryLang}
                    /*
                      Sized down and muted by default so it reads as a gloss,
                      but both are overridable: on a navy sidebar the muted
                      grey would disappear entirely.
                    */
                    className={`ml-1.5 text-[0.8em] font-normal opacity-70 ${glossClassName}`}
                >
                    {secondary}
                </span>
            )}
        </>
    );
}
