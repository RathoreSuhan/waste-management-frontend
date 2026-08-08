/**
 * ============================================================================
 * Before / After Image
 * ============================================================================
 *
 * Photographic evidence for a report.
 *
 * With only a before photograph it renders a single framed image.
 * Once an after photograph exists it renders the pair side by side,
 * before on the left and after on the right, so the improvement reads
 * at a glance.
 *
 * Both frames share one fixed aspect ratio. Cleaners photograph the
 * same spot on different phones, so the two files rarely match in
 * shape; without a fixed frame the pair would sit at uneven heights
 * and the comparison would look accidental rather than deliberate.
 *
 * Shared by the report detail page and the Phase 10 success stories.
 * ============================================================================
 */

export default function BeforeAfterImage({
    beforeUrl,
    afterUrl,
    title = "this report",
    caption,
}) {

    // Nothing to show; the caller decides whether to render a placeholder
    if (!beforeUrl) {
        return null;
    }

    // The comparison only makes sense once the cleanup photograph exists
    const hasComparison = Boolean(afterUrl);

    return (
        <figure className="mt-5">

            <div
                className={
                    hasComparison
                        // Stacks on small screens, where two columns would
                        // leave each photograph too narrow to read
                        ? "grid gap-3 sm:grid-cols-2"
                        : ""
                }
            >

                {/* Before: what the citizen originally reported */}
                <Frame
                    url={beforeUrl}
                    alt={`Photograph submitted with ${title}`}
                    label={hasComparison ? "Before" : null}
                />

                {/* After: proof the location was actually cleaned */}
                {hasComparison && (
                    <Frame
                        url={afterUrl}
                        alt={`Photograph taken after cleaning ${title}`}
                        label="After"
                        highlight
                    />
                )}
            </div>

            <figcaption className="mt-1.5 text-xs text-ink-muted">
                {caption ||
                    (hasComparison
                        ? "Photographs taken before and after the cleanup."
                        : "Photograph submitted with the report.")}
            </figcaption>
        </figure>
    );
}

/**
 * One framed photograph with an optional corner label.
 *
 * The fixed aspect ratio plus object-cover is what keeps the image
 * proportionate to the page instead of stretching to the full height
 * of whatever file was uploaded.
 */
function Frame({ url, alt, label, highlight = false }) {
    return (
        <div className="relative overflow-hidden rounded-gov border border-rule">

            <img
                src={url}
                alt={alt}
                // Lazy since evidence usually sits below the fold
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
            />

            {/* Only labelled in comparison mode, where it disambiguates */}
            {label && (
                <span
                    className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white ${highlight ? "bg-india-green" : "bg-ink/75"
                        }`}

                >
                    {label}
                </span>
            )}
        </div>
    );
}
