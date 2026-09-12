import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, CheckCircle2, Clock, FilePlus2, ArrowRight } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import StatCard from "@/components/common/StatCard";
import ReportCard from "@/components/reports/ReportCard";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import {
    getMyReports,
    getMyReportsSummary,
} from "@/services/reportService";

/**
 * How many recent submissions the activity section shows.
 */
const RECENT_COUNT = 3;

/**
 * ============================================================================
 * Citizen Dashboard
 * ============================================================================
 *
 * Summary of the citizen's own reporting activity.
 * Data comes from GET /api/reports/my and GET /api/reports/my/summary.
 *
 * The two are separate calls because they answer different questions. The
 * figures describe every report the citizen has ever filed, while /my
 * returns a page of ten - so the figures cannot be counted from the page
 * on screen without reading "3 resolved" on a citizen with thirty.
 * ============================================================================
 */

export default function CitizenDashboard() {

    // First page of the citizen's own reports, newest first
    const { data: page, loading, error, reload } = useReports(getMyReports, {});

    // Recent submissions are the first few of that page
    const recentReports = useMemo(() => {
        const list = Array.isArray(page?.content) ? page.content : [];

        /*
          The backend already sent this page newest first, and the activity
          section shows three of them. Sorting again would be harmless, but
          it would also imply the order was not settled - which it is.
        */
        return list.slice(0, RECENT_COUNT);
    }, [page]);

    /*
      Figures for the three tiles, from the counts endpoint.

      A page of reports cannot answer them: a citizen with forty reports
      would read "10 filed" and "10 pending" whatever they had actually
      done. The endpoint groups the whole collection in one query.
    */
    const [stats, setStats] = useState(null);

    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        getMyReportsSummary()
            .then((counts) => {
                if (!ignore) {
                    setStats({
                        total: counts?.total ?? 0,
                        resolved: counts?.resolved ?? 0,
                        pending: counts?.pending ?? 0,
                    });
                }
            })
            .catch(() => {
                if (!ignore) {
                    // The tiles read "—" while the list still renders
                    setStats(null);
                }
            });

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <div>
            {/* Rendered once here - the layout no longer prints the title */}
            <PageHeading
                title="Citizen Dashboard"
                titleHi="नागरिक डैशबोर्ड"
                subtitle="Summary of the waste reports you have filed."
            />

            <div className="space-y-6">

                {/* Key figures */}
                <section className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Reports Filed"
                        // Dash while the count has not arrived yet
                        value={stats ? String(stats.total) : "—"}
                        description="Total reports you have submitted."
                        accent="navy"
                        icon={FileText}
                    />
                    <StatCard
                        title="Resolved"
                        value={stats ? String(stats.resolved) : "—"}
                        description="Closed after successful cleanup."
                        accent="green"
                        icon={CheckCircle2}
                    />
                    <StatCard
                        title="Pending"
                        value={stats ? String(stats.pending) : "—"}
                        description="Waiting to be assigned to a cleanup team."
                        accent="saffron"
                        icon={Clock}
                    />
                </section>

                {/* Primary call to action, framed as a notice strip */}
                <section className="flex flex-wrap items-center justify-between gap-4 rounded-gov border border-rule border-l-4 border-l-gov-blue bg-white p-5">
                    <div>
                        <h2 className="font-serif text-lg font-bold text-gov-navy">
                            Report an uncollected waste site
                        </h2>

                        <p className="mt-1 text-sm text-ink-muted">
                            Submit a photograph with the location. Your report is recorded
                            and passed to a cleanup team working in that area.
                        </p>
                    </div>

                    <Link
                        to="/citizen/report"
                        className="inline-flex items-center gap-2 rounded-gov border border-gov-blue bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                    >
                        <FilePlus2 size={15} aria-hidden="true" />
                        File a Report
                    </Link>
                </section>

                {/* Recent submissions */}
                <section className="rounded-gov border border-rule bg-white">

                    {/* Section bar - tinted header strip keeps the grouping clear */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper px-5 py-3">
                        <h2 className="font-serif text-base font-bold text-gov-navy">
                            Recent Reports
                        </h2>

                        {/* Link to the full history */}
                        <Link
                            to="/citizen/history"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-gov-blue hover:underline"
                        >
                            View all
                            <ArrowRight size={13} aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="p-5">

                        {/* Loading state */}
                        {loading && <ReportListSkeleton count={2} />}

                        {/* Error state with retry */}
                        {!loading && error && (
                            <ReportListError message={error} onRetry={reload} />
                        )}

                        {/* Data state */}
                        {!loading && !error && (
                            recentReports.length > 0 ? (
                                <div className="space-y-3">
                                    {recentReports.map((report) => (
                                        // The card prints the stored status as it stands
                                        <ReportCard key={report.id} report={report} />
                                    ))}
                                </div>
                            ) : (
                                <ReportListEmpty
                                    title="No reports yet"
                                    description="Reports you file will be listed here for tracking."
                                    actionLabel="File a Report"
                                    actionTo="/citizen/report"
                                />
                            )
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
