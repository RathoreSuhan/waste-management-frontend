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

    return (
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">

            <div>
                {/* Hindi gloss sits above the English title when supplied */}
                {titleHi && (
                    <p className="font-serif text-sm text-ink-muted">
                        {titleHi}
                    </p>
                )}

                <h1 className="font-serif text-2xl font-bold text-gov-navy">
                    {title}
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
