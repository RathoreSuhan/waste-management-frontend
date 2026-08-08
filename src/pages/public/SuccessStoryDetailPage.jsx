import { useCallback, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, User, Building2, CalendarCheck } from "lucide-react";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import BeforeAfterImage from "@/components/reports/BeforeAfterImage";
import AiVerifiedBadge from "@/components/feed/AiVerifiedBadge";
import AppreciationBar from "@/components/feed/AppreciationBar";

import {
    ReportListSkeleton,
    ReportListError,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import {
    getPublicFeedByReportId,
    incrementView,
} from "@/services/publicFeedService";

import { formatDateTime } from "@/utils/formatters";

/**
 * ============================================================================
 * Success Story Detail Page
 * ============================================================================
 *
 * One completed cleanup, told in full.
 *
 * Calls GET /api/public-feed/{reportId} and records a view on arrival.
 *
 * Public, like the gallery it belongs to. It deliberately does not link to
 * /reports/:id, which requires a login.
 * ============================================================================
 */

export default function SuccessStoryDetailPage() {

    // Report id from the URL
    const { reportId } = useParams();

    // Stable fetcher so the hook does not refetch on every render
    const fetchStory = useCallback(
        () => getPublicFeedByReportId(reportId),
        [reportId]
    );

    const { data: story, loading, error, reload } = useReports(fetchStory, null);

    /**
     * Stories whose view has already been counted in this session.
     *
     * React runs effects twice in development StrictMode, which would count
     * two views for every genuine visit and quietly inflate the figure the
     * whole page is meant to report honestly.
     */
    const viewedRef = useRef(new Set());

    /**
     * Record the visit.
     *
     * Views are counted for their own sake, so a failure changes nothing a
     * reader would notice and is not worth interrupting the page for.
     */
    useEffect(() => {

        if (!reportId || viewedRef.current.has(reportId)) {
            return;
        }

        // Marked before the request so a re-run cannot slip past
        viewedRef.current.add(reportId);

        incrementView(reportId).catch(() => {
            // Counting is best effort; the story reads fine either way
        });
    }, [reportId]);

    // Full address if present, otherwise whatever the record does have
    const place =
        [story?.address, story?.landmark, story?.city, story?.state]
            .filter(Boolean)
            .join(", ");

    return (
        <div className="flex min-h-screen flex-col bg-paper">
            <SiteHeader />

            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">

                {/* Back to the gallery, not to the protected report list */}
                <Link
                    to="/success-stories"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Back to Success Stories
                </Link>

                {/* Loading */}
                {loading && (
                    <div className="mt-5">
                        <ReportListSkeleton count={1} />
                    </div>
                )}

                {/* Failure, including a story that was never published */}
                {!loading && error && (
                    <div className="mt-5">
                        <ReportListError message={error} onRetry={reload} />
                    </div>
                )}

                {/* The story */}
                {!loading && !error && story && (
                    <article className="mt-5 overflow-hidden rounded-gov border border-rule bg-white">

                        {/* Header band */}
                        <header className="border-b border-rule bg-gov-navy px-5 py-4 text-white">
                            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">
                                Completed Cleanup
                            </p>

                            <h1 className="mt-1 font-serif text-2xl leading-tight font-bold">
                                {story.reportTitle}
                            </h1>
                        </header>

                        <div className="tricolour-rule" />

                        <div className="p-5 lg:p-6">

                            {/* Verification, stated before the evidence */}
                            <AiVerifiedBadge
                                verified={story.aiVerified}
                                confidence={story.aiConfidence}
                            />

                            {/* The evidence itself */}
                            <BeforeAfterImage
                                beforeUrl={story.beforeImageUrl}
                                afterUrl={story.afterImageUrl}
                                title={story.reportTitle}
                            />

                            {/* What was originally reported */}
                            {story.reportDescription && (
                                <p className="mt-5 text-sm leading-relaxed whitespace-pre-line text-ink">
                                    {story.reportDescription}
                                </p>
                            )}

                            {/* Where, who and when */}
                            <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-rule pt-4 sm:grid-cols-2">

                                <Fact
                                    icon={MapPin}
                                    label="Location"
                                    value={place || "Not recorded"}
                                />

                                <Fact
                                    icon={User}
                                    label="Cleaned by"
                                    value={
                                        story.cleanerName
                                            ? story.cleanerType
                                                ? `${story.cleanerName} (${story.cleanerType})`
                                                : story.cleanerName
                                            : "Not recorded"
                                    }
                                />

                                <Fact
                                    icon={Building2}
                                    label="Municipal Corporation"
                                    value={story.municipalCorporationName || "Not recorded"}
                                />

                                <Fact
                                    icon={CalendarCheck}
                                    label="Completed On"
                                    value={
                                        story.cleanupCompletedTime
                                            ? formatDateTime(story.cleanupCompletedTime)
                                            : "Not recorded"
                                    }
                                />
                            </dl>

                            {/* What the model observed, in its own words */}
                            {story.aiRemarks && (
                                <div className="mt-5 rounded-gov border border-rule border-l-4 border-l-india-green bg-paper p-4">
                                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                        Verification Remarks
                                    </p>

                                    <p className="mt-1 text-sm leading-relaxed text-ink">
                                        {story.aiRemarks}
                                    </p>
                                </div>
                            )}

                            {/* Appreciation */}
                            <div className="mt-5 border-t border-rule pt-4">
                                <AppreciationBar story={story} />
                            </div>
                        </div>
                    </article>
                )}
            </main>

            <SiteFooter />
        </div>
    );
}

/**
 * One labelled fact with a leading icon.
 */
function Fact({ icon: Icon, label, value }) {
    return (
        <div>
            <dt className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                <Icon size={12} aria-hidden="true" />
                {label}
            </dt>

            <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
    );
}
