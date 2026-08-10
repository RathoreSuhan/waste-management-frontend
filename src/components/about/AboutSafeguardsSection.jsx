import { ScanEye, MapPinCheck, CheckCheck, Star, Sparkle, ShieldCheck } from "lucide-react";

import { ABOUT_SAFEGUARDS } from "@/constants/aboutContent";

/**
 * ============================================================================
 * About - The Safeguards
 * ============================================================================
 *
 * Sits directly under the five stages and explains the checks around them.
 *
 * The stage rail above says what happens; this says why any of it can be
 * believed. Kept as a separate section rather than folded into the rail
 * because the rail's whole value is that it fits in one glance, and four
 * paragraphs hung off it would destroy that.
 *
 * The two AI checks carry the same plum badge the process rail uses, so a
 * reader moving down the page recognises them as the same two stages
 * rather than four new claims.
 * ============================================================================
 */

/*
  Icons keyed by safeguard id, held here rather than in aboutContent so
  the constants file stays free of lucide-react imports - the same split
  HomeProcessSection uses for its stage icons.
*/
const SAFEGUARD_ICONS = {
    validation: ScanEye,
    duplicates: MapPinCheck,
    verification: CheckCheck,
    priority: Star,
};

export default function AboutSafeguardsSection() {

    return (
        <section className="border-b border-rule bg-paper">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="border-b border-rule pb-3">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        <ShieldCheck size={12} aria-hidden="true" />
                        The Checks
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                        What Stops the Record Being Wrong
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                        A public register is only worth reading if what is in
                        it is true. Four checks sit around the five stages
                        above - two of them ask Google Gemini to look at the
                        photograph, and two of them are the neighbourhood
                        doing the deciding.
                    </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {ABOUT_SAFEGUARDS.map((safeguard) => {

                        const SafeguardIcon = SAFEGUARD_ICONS[safeguard.id];

                        return (
                            <article
                                key={safeguard.id}
                                className="flex gap-4 rounded-gov border border-rule bg-white p-5"
                            >
                                {/*
                                  Plum for the AI checks, blue for the ones
                                  the community performs. The colour is
                                  doing the same job as the badge beside
                                  the title - saying which of the two kinds
                                  of check this is - so the pairing is
                                  legible even in greyscale via the badge.
                                */}
                                <span
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                        safeguard.ai
                                            ? "bg-plum-soft text-civic-plum"
                                            : "bg-gov-blue/10 text-gov-blue"
                                    }`}
                                >
                                    <SafeguardIcon size={18} aria-hidden="true" />
                                </span>

                                <div className="min-w-0">
                                    <h3 className="flex flex-wrap items-center gap-2 font-serif text-base leading-snug font-bold text-gov-navy">
                                        {safeguard.title}

                                        {safeguard.ai && (
                                            <span className="inline-flex items-center gap-1 rounded-gov bg-plum-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-civic-plum uppercase">
                                                <Sparkle
                                                    size={10}
                                                    aria-hidden="true"
                                                />
                                                AI
                                            </span>
                                        )}
                                    </h3>

                                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                                        {safeguard.body}
                                    </p>
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/*
                  An honest limit.

                  Everything above describes automated checking, and a
                  reader could reasonably come away believing the platform
                  claims to be infallible. It does not: the AI carries a
                  confidence threshold and rejects what it cannot judge,
                  which means it can also be wrong in both directions.
                  Saying so is what makes the rest of the section credible.
                */}
                <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-muted">
                    No automated check is perfect. Each one carries a
                    confidence threshold and refuses anything it cannot judge
                    with reasonable certainty, which means a genuine report is
                    occasionally turned away. Where that happens, the reason is
                    shown at the time so it can be corrected and filed again.
                </p>
            </div>
        </section>
    );
}
