import { useCallback, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    MapPin,
    User,
    Building2,
    CalendarCheck,
    FileText,
    Quote,
} from "lucide-react";

import BeforeAfterImage from "@/components/reports/BeforeAfterImage";

import AiVerifiedBadge from "@/components/feed/AiVerifiedBadge";
import AppreciationBar from "@/components/feed/AppreciationBar";

import {
    ReportListSkeleton,
    ReportListError,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import useLayoutMode from "@/hooks/useLayoutMode";
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
 * Public, like the gallery it belongs to, and also mounted under /app for
 * readers who arrive from the sidebar.
 *
 * A story and a report are two views of the same event, so the page closes
 * with a link to the report it came from. Without it the two halves of the
 * platform were only connected in one direction: a resolved report shows
 * its cleanup photograph, but the cleanup had no way back to the complaint,
 * the discussion, or the citizen who raised it.
 *
 * The facts are set as separate tiles rather than a plain definition list.
 * A single undivided block let a wrapping address run into the row beneath
 * it, which made four short facts hard to tell apart at a glance.
 * ============================================================================
 */

export default function SuccessStoryDetailPage() {

    // Report id from the URL
    const { reportId } = useParams();

    // "" on the public site, "/app" inside the signed-in shell, so both
    // links below keep the reader on the side of the site they came from
    const { basePath } = useLayoutMode();

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
        /*
          max-w-6xl, deliberately between the two extremes this page has
          been through. At max-w-4xl it stood ~380px narrower than every
          other column on the site, leaving a wide band of empty background
          down each side; at max-w-7xl it matched the header exactly but
          the pair of photographs then dominated the screen. 1152px keeps
          most of the reclaimed width while leaving the card visibly inset
          from the header, which reads as a record rather than as a page.
        */
        <div className="mx-auto w-full max-w-6xl px-4 py-8">

            {/* Back to the gallery, not to the protected report list */}
            <Link
                to={`${basePath}/success-stories`}
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
                <article className="mt-5 overflow-hidden rounded-gov border border-rule bg-white shadow-sm">

                    {/* Header band */}
                    <header className="border-b border-rule bg-gov-navy px-5 py-5 text-white lg:px-7">

                        <p className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">
                            Completed Cleanup
                        </p>

                        <h1 className="mt-1.5 font-serif text-2xl leading-tight font-bold lg:text-3xl">
                            {story.reportTitle}
                        </h1>

                        {/*
                          Names the record this story describes, so the link
                          at the foot of the page is expected rather than a
                          surprise arrival on a different screen.
                        */}
                        <p className="mt-2 font-mono text-xs tracking-wider text-white/70">
                            Report #{story.reportId}
                        </p>
                    </header>

                    <div className="tricolour-rule" />

                    {/*
                      space-y sets the rhythm for the whole story, so each
                      part is separated by one decision rather than by a
                      margin repeated on every child.
                    */}
                    <div className="space-y-8 p-5 lg:p-7">

                        {/* Verification, stated before the evidence */}
                        <div>
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
                        </div>

                        {/* What was originally reported */}
                        {story.reportDescription && (
                            <section>
                                <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                    What Was Reported
                                </h2>

                                {/* Held to a readable measure. Set to the full
                                    width of the card the citizen's account of
                                    the problem would run past 150 characters a
                                    line, which is harder to read than the
                                    narrow card this replaced. */}
                                <p className="mt-2 max-w-4xl text-sm leading-relaxed whitespace-pre-line text-ink">
                                    {story.reportDescription}
                                </p>
                            </section>
                        )}

                        {/* Where, who and when */}
                        <section>
                            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                Cleanup Record
                            </h2>

                            {/* Four tiles across on a wide card, so short
                                facts like the completion date no longer sit
                                in a half-empty half-width column */}
                            <dl className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

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
                        </section>

                        {/* What the model observed, in its own words */}
                        {story.aiRemarks && (
                            <section className="rounded-gov border border-rule border-l-4 border-l-india-green bg-paper p-5">

                                <h2 className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                    <Quote size={12} aria-hidden="true" />
                                    Verification Remarks
                                </h2>

                                {/* Same measure as the report text above -
                                    the model's remarks are prose too */}
                                <p className="mt-2 max-w-4xl text-sm leading-relaxed text-ink">
                                    {story.aiRemarks}
                                </p>
                            </section>
                        )}

                        {/*
                          The way back to the complaint this cleanup answered.

                          Set as a call-out rather than a bare line of text:
                          it is the only route from the gallery into the
                          report and its discussion, and a plain link at the
                          foot of a long page is easily missed.
                        */}
                        <section className="rounded-gov border border-gov-blue/30 bg-gov-blue/5 p-5">

                            <div className="flex flex-wrap items-center justify-between gap-4">

                                <div>
                                    <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-navy">
                                        <FileText size={14} aria-hidden="true" />
                                        This cleanup began as a citizen report
                                    </h2>

                                    <p className="mt-1 text-sm text-ink-muted">
                                        Read the original complaint, its location details
                                        and the community discussion behind it.
                                    </p>
                                </div>

                                <Link
                                    to={`${basePath}/reports/${story.reportId}`}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-gov bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gov-navy"
                                >
                                    View Original Report
                                    <ArrowRight size={14} aria-hidden="true" />
                                </Link>
                            </div>
                        </section>
                    </div>

                    {/*
                      Appreciation, on a tinted strip at the card's edge -
                      the same footer treatment the gallery cards use, so a
                      story does not change shape between the two screens.
                    */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule bg-paper px-5 py-3 lg:px-7">

                        <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Community Response
                        </p>

                        <AppreciationBar story={story} />
                    </div>
                </article>
            )}
        </div>
    );
}


/**
 * One labelled fact, set as a tile.
 *
 * The icon sits in its own tinted square so the label reads as a heading
 * rather than as a line of text that happens to start with a symbol.
 */
function Fact({ icon: Icon, label, value }) {

    return (
        <div className="flex items-start gap-3 rounded-gov border border-rule bg-paper/60 p-4">

            {/* Icon plate, sized to the two lines of text beside it */}
            <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-rule bg-white text-gov-blue"
            >
                <Icon size={14} />
            </span>

            {/* min-w-0 lets a long address wrap inside the tile
                instead of forcing the grid column wider */}
            <div className="min-w-0">

                <dt className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                    {label}
                </dt>

                <dd className="mt-1 text-sm leading-relaxed break-words text-ink">
                    {value}
                </dd>
            </div>
        </div>
    );
}
