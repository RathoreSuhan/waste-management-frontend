import { Link } from "react-router-dom";
import { Quote, Camera, ArrowRight } from "lucide-react";

import { HOME_PLEDGE_BAND } from "@/constants/homeContent";

import pledgeImage from "@/assets/hp2.jpg";

/**
 * ============================================================================
 * Home Pledge Band
 * ============================================================================
 *
 * A photographic band between the leaderboard and the roles section, asking
 * the reader to be the next person who reports something.
 *
 * Why it exists: the leaderboard above it and the role cards below it are
 * both bordered, white and gridded, and running them back to back gave the
 * lower half of the page a long flat stretch with nothing to break it. More
 * to the point, the roles section opens by asking "which of these are you" -
 * a question that lands better after a moment of persuasion than after a
 * table of other people's scores.
 *
 * How it differs from HomeQuoteBand, which is also a photograph with type
 * over it. That band opens the argument mid-page and is set centred, three
 * quotations across, addressed to nobody in particular. This one closes the
 * argument and is set as a two-column split - photograph held on one side,
 * type on the other - and speaks to the reader directly. Same materials,
 * different composition, so the page does not appear to repeat itself.
 *
 * The image is cropped in CSS rather than on disk, the same approach the
 * other bands take: object-cover against a fixed height, with the focal
 * point pulled off centre so the subject is not hidden behind the text
 * column. Nothing is edited in the assets folder.
 * ============================================================================
 */

export default function HomePledgeBand() {

    return (
        <section className="relative isolate overflow-hidden border-y border-rule bg-gov-navy text-white">

            {/*
              The photograph.

              It fills the band on small screens, where the type is stacked
              over it, and is confined to the right half from `lg` up, where
              the type moves alongside it. object-right keeps the subject
              from drifting out of that narrower frame.

              Decorative: the copy beside it carries the whole message, so
              the image is hidden from screen readers rather than described.
            */}
            <img
                src={pledgeImage}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 -z-10 h-full w-full object-cover object-[center_30%] lg:left-1/2 lg:w-1/2 lg:object-right"
            />

            {/*
              Two scrims doing two jobs.

              The first covers the whole band for the stacked layout, where
              text sits directly on the picture.
            */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gov-navy/85 lg:hidden"
            />

            {/*
              The second is the wide-screen treatment: solid navy across the
              text column, then a fade through the middle so the photograph
              emerges rather than being cut off at a hard vertical edge. A
              straight seam between panel and picture reads as two elements
              pasted together; a gradient reads as one band.
            */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-gov-navy from-45% via-gov-navy/80 via-60% to-transparent lg:block"
            />

            <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">

                {/*
                  Type held to the left half on wide screens so it never
                  runs across the photograph. max-w-xl keeps the measure
                  readable rather than letting it stretch the full column.
                */}
                <div className="max-w-xl lg:w-1/2 lg:pr-10">

                    <p className="text-[11px] font-semibold tracking-[0.2em] text-saffron uppercase">
                        {HOME_PLEDGE_BAND.eyebrow}
                    </p>

                    {/* Devanagari above the English line, as every band on this page sets it */}
                    <p className="mt-3 font-serif text-lg text-white/80">
                        {HOME_PLEDGE_BAND.hi}
                    </p>

                    <h2 className="mt-1 font-serif text-2xl leading-tight font-bold md:text-4xl">
                        {HOME_PLEDGE_BAND.en}
                    </h2>

                    {/* Left aligned here, where the quote band centres it */}
                    <div className="tricolour-rule mt-4 w-40" />

                    <p className="mt-6 leading-relaxed text-white/85">
                        {HOME_PLEDGE_BAND.pledge}
                    </p>

                    {/*
                      One quotation rather than three. The band above already
                      spends three, and a second row of them would turn a
                      closing appeal into another reading exercise.

                      Indented behind a saffron edge so it reads as quoted
                      material without needing quotation marks around it.
                    */}
                    <blockquote className="mt-7 border-l-2 border-saffron pl-4">
                        <Quote size={18} className="text-saffron" aria-hidden="true" />

                        <p className="mt-2 font-serif text-lg leading-relaxed text-balance">
                            {HOME_PLEDGE_BAND.quote}
                        </p>

                        <footer className="mt-2 text-[11px] tracking-[0.15em] text-white/70 uppercase">
                            <cite className="not-italic">
                                {HOME_PLEDGE_BAND.attribution}
                            </cite>
                        </footer>
                    </blockquote>

                    {/*
                      What it costs, in three parts. Divided by hairlines
                      rather than boxed, so the band keeps the open feel the
                      photograph gives it instead of becoming another card
                      grid a few pixels above an actual card grid.
                    */}
                    <dl className="mt-8 grid gap-4 border-t border-white/20 pt-6 sm:grid-cols-3">
                        {HOME_PLEDGE_BAND.marks.map((mark) => (
                            <div key={mark.label}>
                                <dt className="font-serif text-base font-bold text-white">
                                    {mark.label}
                                </dt>
                                <dd className="mt-0.5 text-xs leading-relaxed text-white/70">
                                    {mark.caption}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {/*
                      Two ways out of the band, and neither assumes an
                      account. Filing a report needs one, so that link
                      leads to the report form and lets the route send a
                      guest to login rather than pretending otherwise;
                      reading the record needs nothing at all.
                    */}
                    <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                        <Link
                            to="/citizen/report"
                            className="inline-flex items-center gap-2 rounded-gov border border-white bg-white px-6 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-white/90"
                        >

                            <Camera size={15} aria-hidden="true" />
                            Report a Site
                        </Link>

                        <Link
                            to="/success-stories"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 underline-offset-4 transition hover:text-white hover:underline"
                        >
                            See what others have cleared
                            <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
