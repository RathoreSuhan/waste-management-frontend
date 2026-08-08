import { useMemo } from "react";
import { Link } from "react-router-dom";

import StatCard from "@/components/common/StatCard";
import ReportCard from "@/components/reports/ReportCard";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import { getMyReports } from "@/services/reportService";
import { REPORT_STATUS } from "@/constants/reportConstants";

/**
 * ============================================================================
 * Citizen Dashboard
 * ============================================================================
 *
 * Overview of the citizen's own reporting activity.
 * Data comes from GET /api/reports/my (Phase 2).
 * ============================================================================
 */

export default function CitizenDashboard() {

    // Load the reports created by this citizen
    const { data: reports, loading, error, reload } = useReports(getMyReports);

    /**
     * Build the dashboard statistics from the report list.
     */
    const stats = useMemo(() => {

        // Guard against a non-array response
        const list = Array.isArray(reports) ? reports : [];

        const resolved = list.filter(
            (report) => report.status === REPORT_STATUS.RESOLVED
        ).length;

        const pending = list.filter(
            (report) => report.status === REPORT_STATUS.PENDING
        ).length;

        return {
            total: list.length,
            resolved,
            pending,

            // Share of reports that ended up cleaned
            resolvedRate: list.length
                ? Math.round((resolved / list.length) * 100)
                : 0,
        };
    }, [reports]);

    /**
     * Latest three reports for the activity section.
     */
    const recentReports = useMemo(() => {

        const list = Array.isArray(reports) ? reports : [];

        return [...list]
            // Newest first
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
    }, [reports]);

    return (
        <div className="space-y-6">

            {/* Key numbers */}
            <section className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Reports Submitted"
                    // Show a dash while the request is running
                    value={loading ? "—" : String(stats.total)}
                    description="You helped improve cleanliness in your area."
                    accent="blue"
                />
                <StatCard
                    title="Resolved Reports"
                    value={loading ? "—" : String(stats.resolved)}
                    description="Cleanups completed from your reports."
                    accent="emerald"
                />
                <StatCard
                    title="Awaiting Action"
                    value={loading ? "—" : String(stats.pending)}
                    description="Reports still waiting for a cleaner."
                    accent="violet"
                />
            </section>

            {/* Quick action to report garbage */}
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <div>
                    <h2 className="text-lg font-semibold text-emerald-900">
                        Spotted garbage nearby?
                    </h2>

                    <p className="mt-1 text-sm text-emerald-700">
                        Submit a photo with the location and a cleaner will be assigned.
                    </p>
                </div>

                <Link
                    to="/citizen/report"
                    className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                    Report Garbage
                </Link>
            </section>

            {/* Recent reports */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Recent Activity
                    </h2>

                    {/* Link to the full history */}
                    <Link
                        to="/citizen/history"
                        className="text-sm font-medium text-emerald-700 hover:underline"
                    >
                        View all reports →
                    </Link>
                </div>

                <div className="mt-4">

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
                                    <ReportCard key={report.id} report={report} />
                                ))}
                            </div>
                        ) : (
                            <ReportListEmpty
                                title="No activity yet"
                                description="Your reports will appear here once you submit one."
                                actionLabel="Report Garbage"
                                actionTo="/citizen/report"
                            />
                        )
                    )}
                </div>
            </section>
        </div>
    );
}
