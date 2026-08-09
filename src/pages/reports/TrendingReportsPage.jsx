import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

import ReportCard from "@/components/reports/ReportCard";
import EngagementBar from "@/components/reports/EngagementBar";
import SortControl from "@/components/reports/SortControl";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import { getAllReports } from "@/services/reportService";
import {
    getTrendingReports,
    indexAnalyticsByReportId,
} from "@/services/analyticsService";
import {
    SORT_ENGAGEMENT_DESC,
    sortReportsBy,
    filterReportsByStatus,
} from "@/constants/engagementConstants";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Community Engagement Register
 * ============================================================================
 *
 * Reports ranked by how much the community has engaged with them.
 *
 * Two endpoints feed this page:
 *
 *   /api/reports            - the renderable record (title, photo, city,
 *                             status, createdAt) and engagementScore
 *   /api/analytics/trending - the comment/reply breakdown behind that score
 *
 * The analytics response carries no title or timestamp, so it cannot be
 * rendered on its own; it is joined onto the report list by reportId.
 * Since the score itself already lives on ReportResponse, a failure of
 * the analytics call costs only the breakdown - the ranking survives.
 * That is why this uses allSettled rather than all.
 *
 * Ordering and filtering are done here because the backend offers a
 * single fixed order (engagement, highest first) and no status filter.
 * The dataset is one unpaginated list, so sorting it client-side costs
 * nothing today - though that assumption breaks once reports run into
 * the thousands and this list needs server-side paging.
 * ============================================================================
 */

export default function TrendingReportsPage() {

    const [reports, setReports] = useState([]);

    // reportId -> ReportAnalyticsResponse. Empty when analytics fails.
    const [analyticsMap, setAnalyticsMap] = useState(() => new Map());

    // Starts true because the first request runs immediately
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Set when the report list loaded but the breakdown did not
    const [analyticsFailed, setAnalyticsFailed] = useState(false);

    // Counter used to re-run the request when the user retries
    const [reloadKey, setReloadKey] = useState(0);

    // Defaults: the cleaned reports, most talked about first
    const [sortMode, setSortMode] = useState(SORT_ENGAGEMENT_DESC);
    const [statusFilter, setStatusFilter] = useState("RESOLVED");

    /**
     * Load the register.
     *
     * allSettled keeps the two calls independent: the page is usable
     * whenever the report list arrives, whatever analytics does.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        Promise.allSettled([getAllReports(), getTrendingReports()])
            .then(([reportResult, analyticsResult]) => {
                if (ignore) {
                    return;
                }

                // Without the reports there is nothing to draw
                if (reportResult.status === "rejected") {
                    setError(
                        getErrorMessage(reportResult.reason, "Unable to load reports.")
                    );
                    setReports([]);
                    return;
                }

                setReports(reportResult.value ?? []);
                setError("");

                if (analyticsResult.status === "fulfilled") {
                    setAnalyticsMap(indexAnalyticsByReportId(analyticsResult.value));
                    setAnalyticsFailed(false);
                } else {
                    // Degraded, not broken - scores still render from the reports
                    setAnalyticsMap(new Map());
                    setAnalyticsFailed(true);
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        // Cleanup runs when the component unmounts or reloads
        return () => {
            ignore = true;
        };
    }, [reloadKey]);

    /**
     * Retry the request (used by the error state button).
     */
    const reload = useCallback(() => {
        setLoading(true);
        setError("");

        // Changing the key re-triggers the effect above
        setReloadKey((key) => key + 1);
    }, []);

    /**
     * Filter, then order.
     *
     * Recomputed only when the data or the controls change, so paging
     * through sort modes does not re-sort on every unrelated render.
     */
    const visibleReports = useMemo(() => {
        const filtered = filterReportsByStatus(reports, statusFilter);

        return sortReportsBy(filtered, sortMode);
    }, [reports, statusFilter, sortMode]);

    // A position is only meaningful while the list is ranked by engagement
    const showRank = sortMode === SORT_ENGAGEMENT_DESC;

    return (
        <>
            {/*
              Heading band, matching the other public pages. It is placed
              outside the content container so the colour runs the full
              width of the viewport, as PublicLayout does not constrain
              its main element.
            */}
            <section className="hero-band border-b border-rule text-white">

                <div className="mx-auto max-w-7xl px-4 py-10">

                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">
                        <TrendingUp size={12} aria-hidden="true" />
                        Community Engagement Register
                    </p>

                    <h1 className="mt-1 font-serif text-3xl leading-tight font-bold">
                        Trending Reports
                        {" "}
                        <span className="text-white/70">चर्चित रिपोर्ट</span>
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                        Reports ranked by citizen urgency votes and discussion
                        activity. A report scores its average urgency rating, two
                        points for every comment and one for every reply.
                    </p>
                </div>
            </section>

            {/* Ranked list */}
            <section className="mx-auto max-w-7xl px-4 py-10">

                {loading ? (
                    <ReportListSkeleton count={4} />

                ) : error ? (
                    <ReportListError message={error} onRetry={reload} />

                ) : (
                    <>
                        <SortControl
                            sortMode={sortMode}
                            onSortChange={setSortMode}
                            statusFilter={statusFilter}
                            onStatusChange={setStatusFilter}
                            resultCount={visibleReports.length}
                        />

                        {/*
                          Named separately from the error state: the ranking is
                          correct, only the comment counts are missing, and
                          saying so is better than silently dropping them.
                        */}
                        {analyticsFailed && (
                            <p className="mb-3 rounded-gov border border-rule bg-paper px-3 py-2 text-xs text-ink-muted">
                                Discussion counts are unavailable right now. Engagement scores below are still accurate.
                            </p>
                        )}

                        {visibleReports.length === 0 ? (
                            <ReportListEmpty
                                title={
                                    reports.length === 0
                                        ? "No reports on record"
                                        : "No reports match this filter"
                                }
                                description={
                                    reports.length === 0
                                        ? "Once citizens begin filing reports, the most discussed ones will appear here."
                                        : "No report currently holds this status. Try another status or view all records."
                                }
                            />
                        ) : (
                            <ul className="space-y-3">
                                {visibleReports.map((report, index) => (
                                    <li key={report.id}>
                                        {/* The card is the link; the bar sits outside it */}
                                        <ReportCard report={report} />

                                        <EngagementBar
                                            report={report}
                                            analytics={analyticsMap.get(report.id)}
                                            rank={showRank ? index + 1 : null}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </section>
        </>
    );
}
