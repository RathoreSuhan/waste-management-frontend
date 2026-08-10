import { Link } from "react-router-dom";
import { MapPin, User, Building2, FileText } from "lucide-react";

import BeforeAfterImage from "@/components/reports/BeforeAfterImage";
import AiVerifiedBadge from "@/components/feed/AiVerifiedBadge";
import AppreciationBar from "@/components/feed/AppreciationBar";

import useLayoutMode from "@/hooks/useLayoutMode";
import { formatRelativeTime } from "@/utils/formatters";

/**
 * ============================================================================
 * Success Story Card
 * ============================================================================
 *
 * One completed cleanup in the public gallery.
 *
 * The photographs lead, because the pair of images is the entire argument
 * the page is making; the text underneath only says who, where and when.
 *
 * Links to the story page rather than to /reports/:id. Both are public, but
 * the story page leads with the before-and-after pair, which is what someone
 * following a card from this gallery came to see; the report page leads with
 * the complaint and its discussion.
 *
 * The link is prefixed with the current base path, so a card opened from the
 * sidebar keeps the reader inside the signed-in shell.
 *
 * The whole card opens the story, using the stretched-link pattern: the
 * title anchor is given an invisible overlay covering the card rather than
 * the card being wrapped in a link. The footer holds real like and share
 * buttons, and nesting those inside an anchor would be invalid markup and
 * would navigate away when someone only meant to tap the heart. This way
 * there is still exactly one link per card, named by the story title, and
 * keyboard focus continues to land on the title rather than on a large
 * anonymous region.
 *
 * On presentation: the card is a record of something that finished, so it
 * is dressed as one. A light blue rule across the top ties it to the rest
 * of the platform's furniture without competing with the photographs, the
 * verification badge leads the text so the claim is made before the credits
 * rather than three paragraphs below them, and those credits are set as one
 * hairline-separated line instead of a stacked list that made two facts
 * look like a table.
 *
 * The same card is used by the full Success Stories gallery. That is
 * deliberate - a story should not look like a different kind of object
 * depending on which page found it.
 * ============================================================================
 */


export default function SuccessStoryCard({ story }) {

    // "" on the public site, "/app" inside the signed-in shell
    const { basePath } = useLayoutMode();

    // Falls back through the location fields the record actually has
    const place =
        [story.city, story.state].filter(Boolean).join(", ") ||
        story.address ||
        "Location not recorded";

    return (
        /*
          relative anchors the title's overlay to the card.
          focus-within mirrors the hover treatment so keyboard users get the
          same "this is one clickable unit" cue that pointer users do.
        */
        <article className="group relative flex flex-col overflow-hidden rounded-gov border border-rule bg-white transition hover:-translate-y-0.5 hover:border-gov-blue/60 hover:shadow-md focus-within:border-gov-blue/60">

            {/* Blue rather than green: green is spent on the AI Verified
                badge below, where it carries a meaning.

                Kept to the lighter end of the blues. Navy is the colour of
                the platform's headers and chrome, and at full strength on a
                small card it read as a title bar - the strip is trim, not
                furniture, and should not out-weigh the photographs it sits
                above. */}

            <div
                aria-hidden="true"
                className="h-1 w-full bg-gradient-to-r from-brand-bright to-brand-bright/40"
            />


            {/* Photographic evidence, shared with the report detail page */}
            <div className="px-4 pt-4">

                <BeforeAfterImage
                    beforeUrl={story.beforeImageUrl}
                    afterUrl={story.afterImageUrl}
                    title={story.reportTitle}
                    caption={
                        story.cleanupCompletedTime
                            ? `Cleaned ${formatRelativeTime(story.cleanupCompletedTime)}.`
                            : "Cleanup completed."
                    }
                />

            </div>

            <div className="flex flex-1 flex-col p-4">

                {/*
                  Verification, stated in the card's own text rather than
                  laid over the photographs.

                  Floating it on the image covered part of the evidence it
                  was vouching for, and the plate it needed to stay legible
                  against an arbitrary photograph made it the loudest thing
                  on the card. Read as a line of type above the title it is
                  still the first thing after the pictures, which is early
                  enough for a claim of this kind.

                  Renders nothing when a story was not AI verified, so an
                  unverified pair cannot borrow the mark.
                */}
                <AiVerifiedBadge
                    verified={story.aiVerified}
                    confidence={story.aiConfidence}
                    className="mb-2 self-start"
                />

                {/*
                  Title link, stretched over the card by the after: overlay so
                  a click anywhere outside the footer opens the story.
                */}
                <h3 className="font-serif text-lg leading-snug font-bold text-gov-navy">
                    <Link
                        to={`${basePath}/success-stories/${story.reportId}`}
                        className="after:absolute after:inset-0 after:content-[''] group-hover:text-gov-blue hover:underline"
                    >
                        {story.reportTitle}
                    </Link>
                </h3>


                {/* Where the cleanup happened */}
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted">
                    <MapPin size={13} aria-hidden="true" />
                    {place}
                </p>

                {/*
                  Credit to the people who did the work.

                  Set as one wrapping line rather than a stacked list:
                  there are at most two facts here, and stacking them gave
                  a card of two short phrases the weight of a table.

                  flex-1 pushes the footer to the bottom, so cards of
                  differing title lengths still align along their footers
                  when they sit side by side in a grid.
                */}
                <dl className="mt-3 flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">

                    {story.cleanerName && (
                        <div className="inline-flex items-center gap-1">
                            <User size={12} aria-hidden="true" />
                            <dt className="sr-only">Cleaned by</dt>
                            <dd>
                                Cleaned by{" "}
                                <span className="font-semibold text-ink">
                                    {story.cleanerName}
                                </span>
                            </dd>
                        </div>
                    )}

                    {/* Hairline divider, only where there are two facts to divide */}
                    {story.cleanerName && story.municipalCorporationName && (
                        <span
                            aria-hidden="true"
                            className="h-3 w-px bg-rule"
                        />
                    )}

                    {story.municipalCorporationName && (
                        <div className="inline-flex items-center gap-1">
                            <Building2 size={12} aria-hidden="true" />
                            <dt className="sr-only">Municipal corporation</dt>
                            <dd>{story.municipalCorporationName}</dd>
                        </div>
                    )}
                </dl>

                {/*
                  Tinted strip, so the actions read as a distinct footer
                  rather than as more of the card's text. Pulled out to the
                  card's edges with negative margins, which is why the
                  padding is restated here.

                  Lifted above the title's overlay, otherwise the invisible
                  link would sit over the like and share buttons and swallow
                  their clicks.
                */}
                <div className="relative z-10 -mx-4 -mb-4 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-rule bg-paper px-4 py-2.5">

                    {/*
                      The way through to the complaint this cleanup answered.

                      A second, explicitly named link rather than a change to
                      the stretched title: the title leads to the story, and
                      a reader who wants the report, its location details and
                      its discussion should not have to guess that the story
                      page is where that route begins.
                    */}
                    <Link
                        to={`${basePath}/reports/${story.reportId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gov-blue hover:underline"
                    >
                        <FileText size={12} aria-hidden="true" />
                        View report
                        <span className="sr-only"> for {story.reportTitle}</span>
                    </Link>

                    <AppreciationBar story={story} compact />
                </div>

            </div>
        </article>
    );
}
