import useLanguage from "@/hooks/useLanguage";
import { LANGUAGES } from "@/constants/languageConstants";

/**
 * ==========================================================
 * Page Heading
 * ----------------------------------------------------------
 * Standard heading block for interior pages.
 *
 * A saffron rule sits under the title, which is how section
 * headings are marked on government portals. Each page renders
 * this exactly once - the layout no longer prints the title,
 * so headings are never duplicated.
 *
 * Both renderings of the title stay on screen; the reader's
 * language decides which is the <h1> and which is the gloss
 * above it. Written out rather than delegated to BiText because
 * the two stack vertically here and the primary has to be a
 * real heading element for the document outline.
 * ==========================================================
 */

export default function PageHeading({
    title,
    // Optional Devanagari rendering of the title
    titleHi,
    subtitle,
    // Optional action, e.g. a "File a Report" button
    action,
}) {

    const { isHindi } = useLanguage();

    /*
      Falls back to whichever exists: many pages have no Hindi title yet,
      and those should read normally rather than showing a blank heading.
    */
    const primary = isHindi ? (titleHi || title) : title;

    const secondary = isHindi ? title : titleHi;

    const primaryLang = isHindi && titleHi ? LANGUAGES.HI : LANGUAGES.EN;

    const secondaryLang = isHindi ? LANGUAGES.EN : LANGUAGES.HI;

    return (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">

            <div>
                {/* Secondary rendering sits above, smaller and muted */}
                {secondary && secondary !== primary && (
                    <p
                        lang={secondaryLang}
                        className="font-serif text-sm text-ink-muted"
                    >
                        {secondary}
                    </p>
                )}

                <h1
                    lang={primaryLang}
                    className="font-serif text-2xl font-bold text-gov-navy"
                >
                    {primary}
                </h1>

                {/* Short saffron underline, marking the start of the page */}
                <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                {subtitle && (
                    <p className="mt-2 text-sm text-ink-muted">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Primary action for this page */}
            {action}
        </div>
    );
}
