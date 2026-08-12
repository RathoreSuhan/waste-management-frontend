/**
 * ============================================================================
 * Policy Document
 * ============================================================================
 *
 * One of the three documents on the Policies page - terms, privacy or
 * accessibility. All three have the same shape, so they share one component
 * and differ only in content.
 *
 * Layout follows the section pattern used across About and Environment: an
 * uppercase tracked eyebrow, a serif navy heading, the saffron underline,
 * then the material. The clauses are the one departure - they are an
 * ordered list rather than a grid of cards, because these are documents
 * meant to be cited ("Terms, clause 4") rather than scanned for the
 * interesting one.
 *
 * The numbering comes from the <ol>, not from the copy. That way inserting
 * a clause does not mean renumbering the ones below it, and the number is
 * announced by a screen reader as list position rather than being painted
 * on as decoration.
 * ============================================================================
 */

import { Sparkle } from "lucide-react";

import { POLICY_LAST_REVIEWED } from "@/constants/policyContent";

export default function PolicyDocument({

    // One entry from POLICY_DOCUMENTS
    document: doc,

    // Icon for the eyebrow, chosen by the page from the document id
    icon: Icon,

    /*
      Alternating background down the page, passed in by the parent for
      the same reason AboutPage passes one to HomeProcessSection - which
      step of the white/paper run this lands on is the page's business,
      not the section's.
    */
    tone = "white",
}) {

    const isPaper = tone === "paper";

    return (
        <section
            /*
              The anchor the footer links to, and the reason scroll-mt-20
              is here: ScrollManager uses scrollIntoView, which respects
              scroll-margin-top, so arriving at #privacy puts the heading
              below the sticky navigation instead of behind it.
            */
            id={doc.id}
            className={`scroll-mt-20 border-b border-rule ${
                isPaper ? "bg-paper" : "bg-white"
            }`}
            aria-labelledby={`${doc.id}-heading`}
        >
            <div className="mx-auto max-w-7xl px-4 py-12">

                {/* ---------------- Document header ---------------- */}
                <div className="border-b border-rule pb-3">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        {Icon && <Icon size={12} aria-hidden="true" />}
                        {doc.eyebrow}
                    </p>

                    <h2
                        id={`${doc.id}-heading`}
                        className="mt-1 flex flex-wrap items-baseline gap-x-3 font-serif text-2xl font-bold text-gov-navy md:text-3xl"
                    >
                        {doc.title}

                        {/*
                          The Hindi title beside the English one, dimmed -
                          the same bilingual pairing PageIntro and
                          PageHeading use. lang is set so a screen reader
                          switches pronunciation rather than reading
                          Devanagari as English.
                        */}
                        {doc.hi && (
                            <span
                                lang="hi"
                                className="text-lg font-normal text-ink-muted"
                            >
                                {doc.hi}
                            </span>
                        )}
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    {doc.summary && (
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                            {doc.summary}
                        </p>
                    )}
                </div>

                {/*
                  Review date, per document.

                  A date is the first thing anybody checks on a policy, so
                  it sits at the top of the document rather than buried at
                  the end. <time> gives it machine-readable meaning.
                */}
                <p className="mt-4 text-xs text-ink-muted">
                    Last reviewed:{" "}
                    <time dateTime="2026-08-11" className="font-semibold">
                        {POLICY_LAST_REVIEWED}
                    </time>
                </p>

                {/* ---------------- Opening paragraph ---------------- */}
                {doc.intro && (
                    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink">
                        {doc.intro}
                    </p>
                )}

                {/* ---------------- The clauses ---------------- */}
                <ol className="mt-6 max-w-3xl space-y-5">
                    {doc.clauses.map((clause, index) => (
                        <li
                            key={clause.heading}
                            className="flex gap-4"
                        >
                            {/*
                              The clause number, drawn rather than left to
                              the list marker so it can carry the navy
                              circle. aria-hidden because the <ol> already
                              conveys position to assistive technology, and
                              announcing "4" twice is noise.
                            */}
                            <span
                                aria-hidden="true"
                                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gov-blue/10 font-serif text-sm font-bold text-gov-blue"
                            >
                                {index + 1}
                            </span>

                            <div className="min-w-0">
                                <h3 className="font-serif text-base leading-snug font-bold text-gov-navy">
                                    {clause.heading}
                                </h3>

                                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                                    {clause.body}
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>

                {/*
                  The closing qualification.

                  Every one of these three documents ends by admitting
                  something - that this is not legal advice, that a
                  mismatch is a bug, that no audit has happened. Same
                  treatment as the honest-limit note closing
                  AboutSafeguardsSection, and deliberately not styled as a
                  warning: it is a caveat, not an alert.
                */}
                {doc.note && (
                    <p className="mt-6 max-w-3xl border-l-2 border-saffron pl-3 text-xs leading-relaxed text-ink-muted">
                        <Sparkle
                            size={11}
                            aria-hidden="true"
                            className="mr-1 inline align-[-1px] text-saffron"
                        />
                        {doc.note}
                    </p>
                )}
            </div>
        </section>
    );
}
