import { Link } from "react-router-dom";
import { MapPin, User, Building2 } from "lucide-react";

import BeforeAfterImage from "@/components/reports/BeforeAfterImage";
import AiVerifiedBadge from "@/components/feed/AiVerifiedBadge";
import AppreciationBar from "@/components/feed/AppreciationBar";

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
 * Links to /success-stories/:id rather than /reports/:id. The report page
 * sits behind a login, and sending a visitor from public content to a
 * sign-in form would be a poor greeting for the one page meant to show
 * outsiders the programme works.
 * ============================================================================
 */

export default function SuccessStoryCard({ story }) {

    // Falls back through the location fields the record actually has
    const place =
        [story.city, story.state].filter(Boolean).join(", ") ||
        story.address ||
        "Location not recorded";

    return (
        <article className="overflow-hidden rounded-gov border border-rule bg-white transition-shadow hover:shadow-sm">

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

                {/* Title links through to the full story */}
                <h3 className="font-serif text-lg leading-snug font-bold text-gov-navy">
                    <Link
                        to={`/success-stories/${story.reportId}`}
                        className="hover:text-gov-blue hover:underline"
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

                {/* Verification and appreciation */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-3">
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
