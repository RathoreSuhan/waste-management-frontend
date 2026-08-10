import { Quote } from "lucide-react";

import { HOME_QUOTES, HOME_QUOTE_BAND } from "@/constants/homeContent";

import quoteImage from "@/assets/hp1.jpg";

/**
 * ============================================================================
 * Home Quote Band
 * ============================================================================
 *
 * A full-bleed photograph carrying three lines about why any of this is
 * worth doing.
 *
 * The landing page runs four bordered-card sections back to back, and by
 * the middle of it every section looks like the one above. This band
 * breaks that: no cards, no rules, no grid - just an image, a scrim and
 * type. It is the only place on the page where the reader is asked to
 * pause rather than scan.
 *
 * Built on the same composition as EnvPledgeSection rather than a new one,
 * so it reads as part of this site: vertical scrim because the text is
 * centred, saffron quote marks, centred tricolour rule.
 *
 * The image is cropped in CSS - object-cover against a fixed band height,
 * with the focal point held slightly above centre so a horizon stays out
 * of the text. Nothing is edited on disk.
 * ============================================================================
 */

export default function HomeQuoteBand() {

    return (
        <section className="relative isolate overflow-hidden border-y border-rule">

            {/*
              Decorative. The quotations are the content of this band, and
              the photograph behind them says nothing the text does not,
              so it is hidden from screen readers rather than narrated.
            */}
            <img
                src={quoteImage}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_35%]"
            />

            {/*
              Vertical scrim, heavier at the edges than the middle. The
              type sits centred across the full width, so it needs cover
              everywhere - but leaving the centre lighter keeps the
              photograph legible instead of reducing it to a texture.
            */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-b from-gov-navy/92 via-gov-navy/75 to-gov-navy/92"
            />

            <div className="mx-auto max-w-5xl px-4 py-16 text-center text-white md:py-20">

                <p className="text-[11px] font-semibold tracking-[0.2em] text-saffron uppercase">
                    {HOME_QUOTE_BAND.eyebrow}
                </p>

                {/* Devanagari above the English line, as the hero sets it */}
                <p className="mt-3 font-serif text-lg text-white/80">
                    {HOME_QUOTE_BAND.hi}
                </p>

                <h2 className="mt-1 font-serif text-2xl font-bold md:text-4xl">
                    {HOME_QUOTE_BAND.en}
                </h2>

                <div className="tricolour-rule mx-auto mt-4 w-40" />

                <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-white/85">
                    {HOME_QUOTE_BAND.body}
                </p>

                {/*
                  Three across on desktop, stacked below. Divided by a
                  hairline rather than boxed, so the band keeps its open
                  feel instead of turning back into another card grid.
                */}
                <div className="mt-12 grid gap-10 border-t border-white/20 pt-10 md:grid-cols-3 md:gap-8">
                    {HOME_QUOTES.map((quote) => (
                        <blockquote
                            key={quote.text}
                            className="flex flex-col items-center"
                        >
                            <Quote
                                size={20}
                                className="text-saffron"
                                aria-hidden="true"
                            />

                            {/* flex-1 so the attributions sit on one line across all three */}
                            <p className="mt-3 flex-1 font-serif text-lg leading-relaxed text-balance">
                                {quote.text}
                            </p>

                            <footer className="mt-3 text-[11px] tracking-[0.15em] text-white/70 uppercase">
                                <cite className="not-italic">
                                    {quote.attribution}
                                </cite>
                            </footer>
                        </blockquote>
                    ))}
                </div>
            </div>
        </section>
    );
}
