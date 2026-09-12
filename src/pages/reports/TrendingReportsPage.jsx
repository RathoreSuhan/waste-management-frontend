import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";

import PageIntro from "@/components/layout/PageIntro";
import PageSection from "@/components/layout/PageSection";
import ReportCard from "@/components/reports/ReportCard";
import EngagementBar from "@/components/reports/EngagementBar";
import SortControl from "@/components/reports/SortControl";
import Pagination from "@/components/common/Pagination";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useServerPagination from "@/hooks/useServerPagination";

import { getAllReports } from "@/services/reportService";
import {
    getTrendingReports,
    indexAnalyticsByReportId,
} from "@/services/analyticsService";
import {
    SORT_ENGAGEMENT_DESC,
    sortModeToQuery,
} from "@/constants/engagementConstants";

/**
 * ============================================================================
 * Community Engagement Register
 * ============================================================================
 *
 * Reports ranked by how much the community has engaged with them.
 *
 * Two endpoints feed this page:
 *
 *   /api/reports            - one page of the renderable report records
 *   /api/analytics/trending - the engagement-score breakdown
 *
 * The status shown on a card is ReportResponse.status exactly as sent.
 * The backend advances a report to IN_PROGRESS when its cleanup assignment
 * is claimed, so the register reads identically for a signed-out visitor,
 * a citizen, a cleaner and an admin.
 *
 * Analytics carries no title or timestamp, so it is joined onto the report
 * list by reportId. Since the score itself already lives on ReportResponse,
 * an analytics failure costs only the breakdown. That is why this uses
 * allSettled rather than all.
 *
 * Ordering and filtering used to be done here, over the whole register the
 * page had downloaded. Both now travel as query parameters, because a
 * filter applied to one page answers a different question from the one the
 * reader asked. The analytics breakdown stays a whole-list read, and is the
 * one deliberately unpaginated call on this page.
 * ============================================================================
 */

export default function TrendingReportsPage() {

    // reportId -> ReportAnalyticsResponse. Empty when analytics fails.
    const [analyticsMap, setAnalyticsMap] = useState(() => new Map());

    // Starts true because the first request runs immediately
    const [loading, setLoading] = useState(true);

    // Set when the report list loaded but the breakdown did not
    const [analyticsFailed, setAnalyticsFailed] = useState(false);

    // Counter used to re-run the request when the user retries
    const [reloadKey, setReloadKey] = useState(0);

    // Defaults: the cleaned reports, most talked about first
    const [sortMode, setSortMode] = useState(SORT_ENGAGEMENT_DESC);
    const [statusFilter, setStatusFilter] = useState("RESOLVED");

    /**
     * Load the analytics breakdown.
     *
     * The report list is a page of reports fetched by useServerPagination
     * below, so this effect only handles the call that can fail without
     * breaking the page.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        getTrendingReports()
            .then((analytics) => {
                if (ignore) {
                    return;
                }

                setAnalyticsMap(indexAnalyticsByReportId(analytics));
                setAnalyticsFailed(false);
            })
            .catch(() => {
                if (!ignore) {
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
     * Retry the analytics request (used by the error state button).
     */
    const reload = useCallback(() => {
        setLoading(true);

        // Changing the key re-triggers the effect above
        setReloadKey((key) => key + 1);
    }, []);

    /*
      One page of reports, ranked on the server.

      The sort mode and status filter both travel as query parameters - see
      sortModeToQuery, which maps the dropdown's labels onto the two field
      names the backend will accept. "ALL" is a frontend-only sentinel, so
      it is never sent.

      Passing them as `params` is what tells useServerPagination to return
      to the first page when either control moves.
    */
    const {
        pageItems: visibleReports,
        page,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
        loading: reportsLoading,
        error: reportsError,
        reload: reloadReports,
    } = useServerPagination(getAllReports, {
        params: {
            ...sortModeToQuery(sortMode),
            status: statusFilter === "ALL" ? undefined : statusFilter,
        },
        fallbackMessage: "Unable to load reports.",
    });

    // A position is only meaningful while the list is ranked by engagement
    const showRank = sortMode === SORT_ENGAGEMENT_DESC;

    // Anchor for the jump back up when the page changes
    const listTopRef = useRef(null);

    /*
      The error state's retry covers both calls.

      Either can be the one that failed - the reports page, or the breakdown
      beneath it - and a reader pressing "try again" should not have to work
      out which.
    */
    function handleReload() {
        reload();
        reloadReports();
    }


    return (
        <>
            {/*
              Opening block. Renders as the full-width navy band on the
              public site and as a standard page heading inside the
              signed-in shell - see PageIntro.
            */}
            <PageIntro
                icon={TrendingUp}
                eyebrow="Community Engagement Register"
                en="Trending Reports"
                hi="चर्चित रिपोर्ट"
                description="Reports ranked by citizen urgency votes and discussion activity. A report scores its average urgency rating, two points for every comment and one for every reply."
            />

            {/* Ranked list */}
            <PageSection>

                {loading || reportsLoading ? (
                    <ReportListSkeleton count={4} />

                ) : reportsError ? (
                    <ReportListError message={reportsError} onRetry={handleReload} />

                ) : (
                    <>
                        <SortControl
                            sortMode={sortMode}
                            onSortChange={setSortMode}
                            statusFilter={statusFilter}
                            onStatusChange={setStatusFilter}
                            resultCount={total}
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
                                    total === 0
                                        ? "No reports on record"
                                        : "No reports match this filter"
                                }
                                description={
                                    total === 0
                                        ? "Once citizens begin filing reports, the most discussed ones will appear here."
                                        : "No report currently holds this status. Try another status or view all records."
                                }
                            />
                        ) : (
                            <div ref={listTopRef}>
                                <ul className="space-y-3">
                                    {visibleReports.map((report, index) => (
                                        <li key={report.id}>
                                            {/* The card is the link; the bar sits outside it */}
                                            <ReportCard report={report} />

                                            <EngagementBar
                                                report={report}
                                                analytics={analyticsMap.get(report.id)}
                                                /*
                                                  Rank counts across the whole
                                                  register, not the page: the
                                                  first entry on page two is
                                                  eleventh, not first.
                                                */
                                                rank={showRank ? rangeStart + index : null}
                                            />
                                        </li>
                                    ))}
                                </ul>

                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                    total={total}
                                    rangeStart={rangeStart}
                                    rangeEnd={rangeEnd}
                                    onPageChange={goToPage}
                                    itemLabel="reports"
                                    scrollTargetRef={listTopRef}
                                />
                            </div>

                        )}
                    </>
                )}
            </PageSection>
        </>
    );
}
