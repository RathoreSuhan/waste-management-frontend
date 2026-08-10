import { Link } from "react-router-dom";
import {
    Camera,
    ScanEye,
    Building2,
    CheckCheck,
    Trophy,
    Sparkle,
    ArrowRight,
    Workflow,
} from "lucide-react";

import { HOME_PROCESS_STAGES } from "@/constants/homeContent";

/**
 * ============================================================================
 * Home Process Section
 * ============================================================================
 *
 * The five milestones a report passes, from a photograph on a phone to a
 * position on the leaderboard.
 *
 * An earlier version of this section printed all fourteen backend steps
 * across four dense cards. It was accurate and nobody would have read it:
 * a landing page has a few seconds to explain itself, and a fourteen-item
 * specification spends them on storage providers and triage rules. What a
 * visitor needs is the shape of the thing - somebody reports it, the
 * photograph is checked, someone is sent, the result is checked again,
 * the work is credited.
 *
 * So the section now names five stages and nothing else. The detail is
 * still true of the system; it simply lives in the public record, which
 * the link at the foot leads to.
 *
 * The layout is a single connected rail rather than a row of cards. The
 * content is a sequence, and a rail says "sequence" without needing a
 * sentence to say it. Colour advances along that rail from the blue the
 * platform files reports in to the plum it awards points in, so the eye
 * is carried left to right rather than being asked to compare five
 * equally weighted boxes.
 * ============================================================================
 */

/*
  Icons live here rather than in homeContent.js: they are components, and
  putting them in a constants file would pull lucide-react into what is
  otherwise plain data. Keyed by stage id so the two files can only drift
  loudly, never silently.
*/
const STAGE_ICONS = {
    filed: Camera,
    validated: ScanEye,
    assigned: Building2,
    verified: CheckCheck,
    rewarded: Trophy,
};

/*
  One accent per stage, taken from the palette already defined in
  index.css and ordered so the sequence warms as it advances: the blue a
  report is filed in, through teal and amber while it is being worked,
  to the green of a cleared site and the plum the platform uses
  everywhere else for recognition.

  `marker` fills the numbered disc, `rail` colours the segment leaving
  it, and `ring` is the halo that lifts the disc off the rail.
*/
const STAGE_ACCENTS = {
    filed: {
        marker: "bg-gov-blue",
        rail: "bg-gov-blue",
        ring: "ring-gov-blue/15",
    },
    validated: {
        marker: "bg-civic-teal",
        rail: "bg-civic-teal",
        ring: "ring-civic-teal/15",
    },
    assigned: {
        marker: "bg-civic-amber",
        rail: "bg-civic-amber",
        ring: "ring-civic-amber/15",
    },
    verified: {
        marker: "bg-india-green",
        rail: "bg-india-green",
        ring: "ring-india-green/15",
    },
    rewarded: {
        marker: "bg-civic-plum",
        rail: "bg-civic-plum",
        ring: "ring-civic-plum/15",
    },
};

/**
 * @param className  the outer section's classes, so a page can set the
 *                   background this sits on. Mounted on both the home
 *                   page and the About page, which alternate their
 *                   sections differently - the same stages need to be
 *                   paper on one and white on the other. Defaulted to
 *                   the home page's value, so only About passes it.
 */
export default function HomeProcessSection({
    className = "border-b border-rule bg-paper",
}) {

    return (
        <section className={className}>
            <div className="mx-auto max-w-7xl px-4 py-12">

                {/* ---------------- Heading ---------------- */}

                {/*
                  Same three-part opening as every other section on the
                  site - eyebrow, heading, short saffron rule.

                  An earlier version set the eyebrow inline-flex and wrapped
                  the heading in an inline-block so the rule could measure
                  the words. Both were inline, so they shared a line: the
                  page read "END TO END How the Process Works" across, with
                  a rule as long as the title beneath it, while Platform
                  Impact directly above stacked its label over its heading
                  under a short strip. Two sections built the same way have
                  to look the same way, so the measuring trick is gone and
                  this block is now identical in structure to HomeImpactBand.
                */}
                <div className="border-b border-rule pb-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        <Workflow size={12} aria-hidden="true" />
                        End to End
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                        How the Process Works
                    </h2>

                    {/* The site's standard heading rule, as used everywhere else */}
                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                        Five stages between a photograph being uploaded and a

                        leaderboard being updated. Two of them ask Google Gemini
                        to look at the picture - once to confirm the waste is
                        real, once to confirm it is gone.
                    </p>
                </div>

                {/*
                  Ordered list, because the sequence is the content.

                  Horizontally the stages sit in equal columns joined by a
                  rail running through the markers; below `md` the same
                  list becomes a vertical timeline, with the rail dropping
                  down the left edge instead. Both are the same markup -
                  only the direction of the connecting segment changes.
                */}
                <ol className="mt-10 flex flex-col gap-6 md:flex-row md:gap-0">
                    {HOME_PROCESS_STAGES.map((stage, index) => {

                        const StageIcon = STAGE_ICONS[stage.id];
                        const accent = STAGE_ACCENTS[stage.id];

                        const isLast =
                            index === HOME_PROCESS_STAGES.length - 1;

                        return (
                            <li
                                key={stage.id}
                                className="relative flex flex-1 gap-4 md:flex-col md:gap-0"
                            >

                                {/* ---------------- Marker, and the rail leaving it ---------------- */}

                                <div className="relative flex flex-col items-center md:w-full md:flex-row">

                                    {/*
                                      The connecting segment. It leaves the
                                      marker in the marker's own colour, so
                                      the rail changes hue at every stage
                                      rather than being one flat line, and
                                      it is not drawn after the last stage -
                                      the process stops there.

                                      Vertically it runs from below the disc
                                      to the foot of the item; horizontally
                                      it fills the space to the next column.
                                    */}
                                    {!isLast && (
                                        <span
                                            aria-hidden="true"
                                            className={`absolute top-12 left-1/2 h-[calc(100%-1rem)] w-0.5 -translate-x-1/2 ${accent.rail} opacity-30 md:top-1/2 md:left-12 md:h-0.5 md:w-[calc(100%-3rem)] md:translate-x-0 md:-translate-y-1/2`}
                                        />
                                    )}

                                    {/*
                                      The disc carries both the icon and the
                                      stage number. The ring is the same
                                      colour at low opacity, which separates
                                      it from the rail passing behind.
                                    */}
                                    <span
                                        className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accent.marker} text-white ring-8 ${accent.ring}`}
                                    >
                                        <StageIcon size={20} aria-hidden="true" />

                                        {/*
                                          Number sits on the disc rather than
                                          beside the title, where it would
                                          compete with it. Paper-coloured so
                                          it reads on any of the five accents.
                                        */}
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-rule bg-paper font-serif text-[11px] font-bold text-gov-navy tabular-nums">
                                            {index + 1}
                                        </span>
                                    </span>
                                </div>

                                {/* ---------------- Stage name ---------------- */}

                                <div className="min-w-0 pb-2 md:mt-5 md:pr-6 md:pb-0">

                                    <h3 className="flex flex-wrap items-center gap-2 font-serif text-base leading-tight font-bold text-gov-navy">
                                        {stage.title}

                                        {/*
                                          The AI stages are marked. In a
                                          summary this short they are the
                                          only thing worth annotating -
                                          they are why the record is worth
                                          trusting at all.
                                        */}
                                        {stage.ai && (
                                            <span className="inline-flex items-center gap-1 rounded-gov bg-plum-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-civic-plum uppercase">
                                                <Sparkle
                                                    size={10}
                                                    aria-hidden="true"
                                                />
                                                AI
                                            </span>
                                        )}
                                    </h3>

                                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                                        {stage.caption}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ol>

                {/*
                  The process ends on the public record, so the section
                  ends with a way into it - a single way. Two links of
                  equal weight side by side made the reader choose before
                  they knew the difference between the destinations, and
                  the whole page already carries a Trending link to the
                  report list in its main navigation.

                  A worked example is the better of the two: it shows the
                  five stages above actually having happened. Readable
                  without an account.
                */}
                <div className="mt-10 border-t border-rule pt-5">
                    <Link
                        to="/success-stories"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
                    >
                        See a report that went the whole way
                        <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
