import { Link } from "react-router-dom";
import { Quote, Trophy, FileText } from "lucide-react";

import useLayoutMode from "@/hooks/useLayoutMode";
import { useAuthContext } from "@/hooks/useAuthContext";
import { ENV_QUOTES } from "@/constants/environmentContent";

/**
 * ============================================================================
 * Pledge Section
 * ============================================================================
 *
 * Closes the page on wm4: two quotations over the photograph, then the
 * routes back into the platform.
 *
 * Written as its own component rather than another EnvPhotoBand because
 * the composition is different - the quotations are the content here, set
 * centred and large, where every other band puts a heading on the left.
 *
 * Both quotations are attributed as honestly as their provenance allows.
 * The Gandhi line is universally associated with him but unlocated in his
 * collected writing, and the second has no settled origin, so neither is
 * presented as a verified citation. Putting a false citation on a page
 * about trusting the record would be a poor trade for a nicer footer.
 * ============================================================================
 */

export default function EnvPledgeSection({ image }) {

    const { basePath } = useLayoutMode();

    const { user } = useAuthContext();

    return (
        <section className="relative isolate overflow-hidden">

            <img
                src={image}
                alt="A clean shoreline at the close of day"
                loading="lazy"
                className="absolute inset-0 -z-10 h-full w-full object-cover"
            />

            {/*
              A vertical scrim rather than the horizontal one used by the
              bands: the text is centred here, so it needs cover across
              the full width instead of weight on one side.
            */}
            <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-b from-gov-navy/90 via-gov-navy/80 to-gov-navy/92"
            />

            <div className="mx-auto max-w-4xl px-4 py-16 text-center text-white">

                <p className="text-[11px] font-semibold tracking-[0.2em] text-saffron uppercase">
                    The Pledge
                </p>

                <h2 className="mt-2 font-serif text-3xl font-bold md:text-4xl">
                    Leave It Better Than You Found It
                </h2>

                {/* Tricolour rule, centred - the site's closing mark */}
                <div className="tricolour-rule mx-auto mt-4 w-40" />

                <div className="mt-10 space-y-10">
                    {ENV_QUOTES.map((quote) => (
                        <blockquote key={quote.text}>
                            <Quote
                                size={22}
                                className="mx-auto text-saffron"
                                aria-hidden="true"
                            />

                            <p className="mt-3 font-serif text-xl leading-relaxed md:text-2xl">
                                {quote.text}
                            </p>

                            <footer className="mt-3 text-xs tracking-[0.15em] text-white/70 uppercase">
                                <cite className="not-italic">{quote.attribution}</cite>
                            </footer>
                        </blockquote>
                    ))}
                </div>

                {/* Back into the platform */}
                <div className="mt-12 border-t border-white/20 pt-8">
                    <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/85">
                        A pledge that stays on a page is decoration. This one has
                        somewhere to go: every report filed here is a location on
                        a public record, and every cleared site is signed by the
                        person who cleared it.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to={`${basePath}/leaderboard`}
                            className="inline-flex items-center gap-1.5 rounded-gov border border-saffron bg-saffron px-4 py-2 text-sm font-semibold text-gov-navy transition hover:bg-saffron/85"
                        >
                            <Trophy size={15} aria-hidden="true" />
                            Who is doing the work
                        </Link>

                        <Link
                            to={`${basePath}/reports`}
                            className="inline-flex items-center gap-1.5 rounded-gov border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            <FileText size={15} aria-hidden="true" />
                            Browse the public record
                        </Link>

                        {/*
                          Only offered to visitors who have no account.
                          Inviting a signed-in user to register would be
                          a dead link dressed as an invitation.
                        */}
                        {!user && (
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-1.5 rounded-gov border border-white/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                            >
                                Create an account
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
