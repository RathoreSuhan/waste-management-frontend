import { Link } from "react-router-dom";
import {
    UserCheck,
    Route as RouteIcon,
    ImageOff,
    MapPinCheck,
    Landmark,        // the corporation that signs a cleanup off
    ChevronDown,
    HelpCircle,
    ArrowRight,
} from "lucide-react";

import { HOME_FAQS } from "@/constants/homeContent";

/**
 * ============================================================================
 * Home FAQ Section
 * ============================================================================
 *
 * The five questions a visitor still has after reading the page, closing
 * the landing page and targeted by the footer's FAQ link at /#faq.
 *
 * Why <details> rather than a useState accordion
 * ----------------------------------------------
 * The obvious build is an openId in state and a conditional render. This
 * uses the native element instead, for three reasons:
 *
 *   - Keyboard support and the correct expanded/collapsed semantics come
 *     for free, where a div-based version needs aria-expanded, a button
 *     role and Enter/Space handling written by hand to match.
 *
 *   - Browsers expand a closed <details> automatically when its text
 *     matches Ctrl+F. A custom accordion hides its answers from
 *     find-in-page entirely, which is a bad trait anywhere and a
 *     disqualifying one for an FAQ - looking for a specific word is
 *     exactly how these get read.
 *
 *   - It holds no state, so nothing here can desynchronise.
 *
 * The cost is that several can be open at once. That is fine, and
 * arguably right: these are five independent answers, not a set of
 * alternatives, and a reader comparing two of them should not have the
 * first collapse as they open the second.
 *
 * They stack in a single column rather than two. Side by side, opening
 * one answer stretched its row and left the question beside it sitting
 * against a tall blank gap, since a grid row is as tall as its tallest
 * cell. Stacked, an opening answer simply pushes the next question
 * down, which is also the order they are meant to be read in.
 *
 * The first is open on load so the section reads as answers rather than
 * as a row of shut drawers.
 * ============================================================================
 */

/*
  Icons keyed by question id, held here rather than in homeContent.js so
  the constants file stays free of lucide-react - the same split
  HomeProcessSection uses for its stage icons.

  Route is aliased because react-router-dom exports a Route of its own,
  and this file imports from both.
*/
const FAQ_ICONS = {
    account: UserCheck,
    "after-filing": RouteIcon,
    rejected: ImageOff,
    duplicate: MapPinCheck,
    "who-decides": Landmark,
};

export default function HomeFaqSection() {

    return (
        <section className="border-t border-rule bg-paper">
            <div className="mx-auto max-w-7xl px-4 py-12">

                {/* ---------------- Heading ---------------- */}
                {/*
                  The eyebrow, serif heading and short saffron rule that
                  open every other section on this page, kept identical
                  so the FAQ reads as part of the same document rather
                  than as an appendix bolted on at the end.
                */}
                <div className="border-b border-rule pb-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        <HelpCircle size={12} aria-hidden="true" />
                        Common Questions
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                        Frequently Asked Questions
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                        Five things worth knowing before you file anything -
                        what an account is for, what happens to a report once
                        it is filed, the two checks that most often
                        surprise people, and who it is that finally closes a
                        cleanup.
                    </p>
                </div>

                {/* ---------------- The questions ---------------- */}

                <div className="mt-6 grid gap-3">
                    {HOME_FAQS.map((faq, index) => {

                        const FaqIcon = FAQ_ICONS[faq.id];

                        return (
                            <details
                                key={faq.id}

                                /*
                                  The first answer is showing when the page
                                  loads. Five collapsed rows give a reader
                                  no reason to believe any of them are worth
                                  opening; one open answer shows the depth
                                  the others go to.
                                */
                                open={index === 0}

                                /*
                                  `group` lets the chevron below react to
                                  this element's open state through
                                  Tailwind's group-open variant, with no
                                  JavaScript involved.
                                */
                                className="group rounded-gov border border-rule bg-white open:border-gov-blue/30"
                            >
                                {/*
                                  marker:hidden removes the browser's own
                                  disclosure triangle - Chrome and Firefox
                                  draw it at the start of the summary,
                                  which would sit alongside our icon and
                                  say the same thing twice.
                                */}
                                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:hidden [&::-webkit-details-marker]:hidden">

                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gov-blue/10 text-gov-blue">
                                        <FaqIcon size={17} aria-hidden="true" />
                                    </span>

                                    {/*
                                      h3 keeps the page's heading order
                                      intact: h1 in the hero, h2 on this
                                      section, h3 for each question.
                                    */}
                                    <h3 className="min-w-0 flex-1 font-serif text-base leading-snug font-bold text-gov-navy">
                                        {faq.question}
                                    </h3>

                                    {/*
                                      Rotates to point up when the answer
                                      is showing. Decorative: <details>
                                      already announces its own state to
                                      assistive technology, so a label here
                                      would be read out twice.
                                    */}
                                    <ChevronDown
                                        size={18}
                                        aria-hidden="true"
                                        className="shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180"
                                    />
                                </summary>

                                {/*
                                  Indented to clear the icon above, so the
                                  answer lines up with the question rather
                                  than with the disc beside it.
                                */}
                                <div className="border-t border-rule px-4 py-4 pl-16">
                                    <p className="text-sm leading-relaxed text-ink-muted">
                                        {faq.answer}
                                    </p>
                                </div>
                            </details>
                        );
                    })}
                </div>

                {/*
                  Where the unanswered questions go.

                  Five cannot cover everything, and the honest next step
                  is the page that explains the platform at length rather
                  than a contact address the project does not staff.
                */}
                <div className="mt-6 border-t border-rule pt-5">
                    <Link
                        to="/about"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
                    >
                        More about how the platform works
                        <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
