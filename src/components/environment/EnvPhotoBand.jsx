/**
 * ============================================================================
 * Environment Photo Band
 * ============================================================================
 *
 * A full-bleed photograph with a caption laid over it.
 *
 * Used three times on the Environment page, so the scrim, the type scale
 * and the crop behaviour are decided once here rather than being tuned
 * separately in each section and drifting apart.
 *
 * The scrim is not decoration. These are photographs with no controlled
 * light or safe area, and white text dropped straight onto one is legible
 * or not depending on where the subject happens to sit. The gradient runs
 * dark on the left where the words are and clears towards the right so
 * the image is still visible.
 * ============================================================================
 */

export default function EnvPhotoBand({

    // Imported asset - passed in rather than resolved here
    image,

    /*
      What the photograph shows, for anyone who cannot see it. Required:
      these images carry meaning on this page, so they are not decorative
      and must not be given an empty alt.
    */
    alt,

    // Small tracked label above the heading
    eyebrow,

    // The line the band exists to deliver
    title,

    // Optional supporting sentence under the title
    body,

    /*
      Band height. Openers stand taller than the closing strips, and
      "tall" is reserved for the pledge at the foot of the page.
    */
    height = "standard",

    /*
      object-position for the crop. The subject of an uncropped landscape
      is rarely dead centre once it is cut to a band, so each caller can
      nudge it without a new component.
    */
    focus = "center",

    // Optional buttons or links rendered under the copy
    children,
}) {

    const heightClass =
        height === "tall"
            ? "h-[420px] md:h-[520px]"
            : height === "short"
              ? "h-[220px] md:h-[280px]"
              : "h-[320px] md:h-[400px]";

    return (
        <section className={`relative isolate overflow-hidden ${heightClass}`}>

            {/*
              A plain img rather than a CSS background: this is content,
              it needs an accessible name, and it should participate in
              lazy loading like any other image.
            */}
            <img
                src={image}
                alt={alt}
                loading="lazy"
                className="absolute inset-0 -z-10 h-full w-full object-cover"
                style={{ objectPosition: focus }}
            />

            {/*
              Left-weighted navy scrim, matching the homepage hero. Kept
              opaque enough at the left edge to hold white text well past
              the contrast minimum, then cleared to nothing by the right.
            */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-r from-gov-navy/92 via-gov-navy/70 to-gov-navy/15"
            />

            <div className="mx-auto flex h-full max-w-7xl items-center px-4">
                <div className="max-w-2xl text-white">

                    {eyebrow && (
                        <p className="text-[11px] font-semibold tracking-[0.2em] text-saffron uppercase">
                            {eyebrow}
                        </p>
                    )}

                    <h2 className="mt-2 font-serif text-2xl leading-tight font-bold md:text-4xl">
                        {title}
                    </h2>

                    {/* Saffron rule, as under every other heading on the site */}
                    <div className="mt-3 h-0.5 w-16 bg-saffron" />

                    {body && (
                        <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
                            {body}
                        </p>
                    )}

                    {children && <div className="mt-5">{children}</div>}
                </div>
            </div>
        </section>
    );
}
