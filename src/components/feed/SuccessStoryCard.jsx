import { Link } from "react-router-dom";
import { MapPin, User, Building2 } from "lucide-react";

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
        <article className="group relative overflow-hidden rounded-gov border border-rule bg-white transition-colors hover:border-gov-blue/60 hover:bg-gov-blue/[0.02] focus-within:border-gov-blue/60">


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

            <div className="p-4">

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

                {/* Credit to the people who did the work */}
                <dl className="mt-3 space-y-1 text-xs text-ink-muted">

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

                    {story.municipalCorporationName && (
                        <div className="flex items-center gap-1">
                            <Building2 size={12} aria-hidden="true" />
                            <dt className="sr-only">Municipal corporation</dt>
                            <dd>{story.municipalCorporationName}</dd>
                        </div>
                    )}
                </dl>

                {/*
                  Lifted above the title's overlay, otherwise the invisible
                  link would sit over the like and share buttons and swallow
                  their clicks.
                */}
                <div className="relative z-10 mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">

                    <AiVerifiedBadge
                        verified={story.aiVerified}
                        confidence={story.aiConfidence}
                    />

                    <AppreciationBar story={story} compact />
                </div>
            </div>
        </article>
    );
}
