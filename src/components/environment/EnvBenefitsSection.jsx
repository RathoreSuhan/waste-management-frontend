import { Check } from "lucide-react";

import benefitsImage from "@/assets/wm0.jpg";
import { ENV_BENEFITS } from "@/constants/environmentContent";

/**
 * ============================================================================
 * Why It Matters
 * ============================================================================
 *
 * Opens the page: the wm0 photograph beside five consequences of managing
 * waste properly.
 *
 * wm0 is 394x623 - portrait and small. It is shown in a framed column at
 * close to its natural size rather than stretched across a band, where it
 * would have to be scaled roughly five times and would visibly soften.
 * The constraint set the layout, which is why this section reads as a
 * plate beside a text column instead of another photo band.
 * ============================================================================
 */

export default function EnvBenefitsSection() {
    return (
        <section className="border-b border-rule bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="grid items-start gap-10 lg:grid-cols-[340px_1fr]">

                    {/* Plate */}
                    <figure className="mx-auto w-full max-w-[340px]">
                        <div className="overflow-hidden rounded-gov border border-rule bg-paper p-2">
                            <img
                                src={benefitsImage}
                                alt="Waste collected and held for proper disposal rather than left in the open"
                                loading="lazy"
                                className="w-full rounded-gov object-cover"
                            />
                        </div>

                        <figcaption className="mt-2 text-xs leading-relaxed text-ink-muted">
                            Waste handled is waste accounted for. Everything below
                            follows from that one decision.
                        </figcaption>
                    </figure>

                    {/* Consequences */}
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                            Why It Matters
                        </p>

                        <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                            What Managing Waste Actually Buys You
                        </h2>

                        <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
                            Not an abstraction about the planet. These are the
                            things that change on your street, in your water and
                            in your hospital when waste is collected, separated
                            and sent somewhere it belongs.
                        </p>

                        <dl className="mt-6 space-y-5">
                            {ENV_BENEFITS.map((benefit) => (
                                <div
                                    key={benefit.title}
                                    className="flex gap-3 border-b border-rule pb-5 last:border-0 last:pb-0"
                                >
                                    {/*
                                      A tick in tricolour green - the same
                                      colour the platform uses everywhere
                                      else for a resolved state.
                                    */}
                                    <span
                                        aria-hidden="true"
                                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-soft text-india-green"
                                    >
                                        <Check size={14} strokeWidth={3} />
                                    </span>

                                    <div>
                                        <dt className="font-semibold text-ink">
                                            {benefit.title}
                                        </dt>

                                        <dd className="mt-1 text-sm leading-relaxed text-ink-muted">
                                            {benefit.body}
                                        </dd>
                                    </div>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
}
