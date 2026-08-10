import { Quote, Compass } from "lucide-react";

import { ABOUT_APPROACH, ABOUT_QUOTE } from "@/constants/aboutContent";

/**
 * ============================================================================
 * About - The Approach
 * ============================================================================
 *
 * Answers the problem section: what this platform actually is.
 *
 * Set as prose rather than broken into cards. This is the one place on the
 * site where a continuous argument is being made, and chopping it into
 * three equal boxes would flatten the reasoning into three unrelated
 * assertions. Wide measure is avoided instead - max-w-3xl keeps the line
 * length readable.
 *
 * The creator's own line closes the section, in the same treatment the
 * homepage gives its quote band.
 * ============================================================================
 */

export default function AboutApproachSection() {

    return (
        <section className="border-b border-rule bg-paper">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="border-b border-rule pb-3">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        <Compass size={12} aria-hidden="true" />
                        The Approach
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                        {ABOUT_APPROACH.heading}
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />
                </div>

                {/*
                  Slightly larger body than the rest of the page. This is
                  the passage most likely to be read start to finish, and
                  the extra step in size marks it as the argument rather
                  than supporting detail.
                */}
                <div className="mt-6 max-w-3xl space-y-4">
                    {ABOUT_APPROACH.paragraphs.map((paragraph) => (
                        <p
                            key={paragraph.slice(0, 32)}
                            className="text-[15px] leading-relaxed text-ink"
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>

                {/*
                  The closing quotation.

                  Attributed to a named person rather than left floating -
                  it is the creator's sentence about his own project, so
                  saying so costs nothing and is more honest than
                  presenting it as an anonymous motto.
                */}
                <figure className="mt-10 max-w-3xl border-l-2 border-saffron bg-white p-5">
                    <Quote
                        size={16}
                        className="text-saffron"
                        aria-hidden="true"
                    />

                    <blockquote className="mt-2 font-serif text-lg leading-relaxed text-gov-navy italic">
                        {ABOUT_QUOTE.text}
                    </blockquote>

                    <figcaption className="mt-3 text-xs text-ink-muted">
                        {ABOUT_QUOTE.attribution}
                    </figcaption>
                </figure>
            </div>
        </section>
    );
}
