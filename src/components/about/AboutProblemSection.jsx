import { CircleAlert } from "lucide-react";

import { ABOUT_PROBLEMS } from "@/constants/aboutContent";

/**
 * ============================================================================
 * About - The Problem
 * ============================================================================
 *
 * Opens the page with what is wrong, before anything about the platform.
 *
 * The order matters. A visitor who has not yet agreed there is a problem
 * has no reason to care how it is solved, and the README's own structure
 * makes the same choice - Problem Statement before Our Solution. Leading
 * with features would be describing an answer to a question nobody asked.
 *
 * Two columns of plain entries rather than cards with icons: six items
 * each carrying a coloured glyph would read as a feature grid, which is
 * the opposite of what this list is. The numbers do the separating.
 * ============================================================================
 */

export default function AboutProblemSection() {

    return (
        <section className="border-b border-rule bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12">

                {/* Standard section opening - eyebrow, heading, saffron rule */}
                <div className="border-b border-rule pb-3">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        <CircleAlert size={12} aria-hidden="true" />
                        The Problem
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                        Why Reporting Waste Usually Fails
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                        Most cities already have somewhere to complain about
                        waste. What they do not have is a way to tell one
                        complaint from four, a real photograph from a careless
                        one, or a site marked cleared from a site actually
                        cleared.
                    </p>
                </div>

                <ol className="mt-6 grid gap-x-10 gap-y-5 md:grid-cols-2">
                    {ABOUT_PROBLEMS.map((problem, index) => (
                        <li
                            key={problem.title}
                            className="flex gap-4 border-b border-rule pb-5 last:border-b-0 md:last:border-b"
                        >
                            {/*
                              Serif numerals, tabular so the six align down
                              the column regardless of digit width. Muted
                              rather than accented: they are ordering, not
                              emphasis.
                            */}
                            <span
                                aria-hidden="true"
                                className="shrink-0 font-serif text-2xl leading-none font-bold text-rule tabular-nums"
                            >
                                {String(index + 1).padStart(2, "0")}
                            </span>

                            <div className="min-w-0">
                                <h3 className="font-serif text-base leading-snug font-bold text-gov-navy">
                                    {problem.title}
                                </h3>

                                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                                    {problem.body}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
