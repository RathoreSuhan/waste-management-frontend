import { useMemo } from "react";
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
import usePendingAssignmentReportIds from "@/hooks/usePendingAssignmentReportIds";
import { getMyReports } from "@/services/reportService";
import {
    getReportDisplayStatus,
    REPORT_STATUS,
} from "@/constants/reportConstants";

/**
 * ============================================================================
 * Citizen Dashboard
 * ============================================================================
 *
 * Summary of the citizen's own reporting activity.
 * Data comes from GET /api/reports/my (Phase 2).
 * ============================================================================
 */

export default function CitizenDashboard() {

    // Load the reports filed by this citizen
    const { data: reports, loading, error, reload } = useReports(getMyReports);

    // Optional snapshot used only to reconcile displayed lifecycle status
    const pendingAssignmentReportIds = usePendingAssignmentReportIds();

    /**
     * Build the summary figures from the report list.
     */
    const stats = useMemo(() => {

        // Guard against a non-array response
        const list = Array.isArray(reports) ? reports : [];

        const resolved = list.filter(
            (report) => report.status === REPORT_STATUS.RESOLVED
        ).length;

        const pending = list.filter(
            (report) =>
                getReportDisplayStatus(
                    report,
                    pendingAssignmentReportIds
                ) === REPORT_STATUS.PENDING
        ).length;

        return {
            total: list.length,
            resolved,
            pending,
        };
    }, [reports, pendingAssignmentReportIds]);

    /**
     * Three most recent reports for the activity section.
     */
    const recentReports = useMemo(() => {

        const list = Array.isArray(reports) ? reports : [];

        return [...list]
            // Newest first
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
    }, [reports]);

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
                        // Dash while the request is running
                        value={loading ? "—" : String(stats.total)}
                        description="Total reports you have submitted."
                        accent="navy"
                        icon={FileText}
                    />
                    <StatCard
                        title="Resolved"
                        value={loading ? "—" : String(stats.resolved)}
                        description="Closed after successful cleanup."
                        accent="green"
                        icon={CheckCircle2}
                    />
                    <StatCard
                        title="Pending"
                        value={loading ? "—" : String(stats.pending)}
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
                                        <ReportCard
                                            key={report.id}
                                            report={report}
                                            displayStatus={getReportDisplayStatus(
                                                report,
                                                pendingAssignmentReportIds
                                            )}
                                        />
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
