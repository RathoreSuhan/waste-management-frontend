import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ReportCard from "@/components/reports/ReportCard";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import { getMyReports } from "@/services/reportService";
import {
    REPORT_STATUS,
    REPORT_STATUS_FILTERS,
} from "@/constants/reportConstants";

/**
 * ============================================================================
 * My Reports Page
 * ============================================================================
 *
 * Shows every report created by the logged-in citizen.
 * Calls GET /api/reports/my (user resolved from the JWT token).
 * ============================================================================
 */

export default function MyReportsPage() {

    // Load the citizen's own reports
    const { data: reports, loading, error, reload } = useReports(getMyReports);

    // Currently selected status filter
    const [statusFilter, setStatusFilter] = useState("ALL");

    /**
     * Apply the status filter and show the newest reports first.
     */
    const visibleReports = useMemo(() => {

        // Guard against a non-array response
        const list = Array.isArray(reports) ? reports : [];

        return list
            .filter((report) =>
                statusFilter === "ALL" ? true : report.status === statusFilter
            )
            // Newest report on top
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    }, [reports, statusFilter]);

    /**
     * Count reports per status for the summary row.
     */
    const counts = useMemo(() => {

        const list = Array.isArray(reports) ? reports : [];

        return {
            total: list.length,
            pending: list.filter((r) => r.status === REPORT_STATUS.PENDING).length,
            inProgress: list.filter((r) => r.status === REPORT_STATUS.IN_PROGRESS).length,
            resolved: list.filter((r) => r.status === REPORT_STATUS.RESOLVED).length,
        };
    }, [reports]);

    return (
        <div className="space-y-6">

            {/* Header with the create action */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                        My Reports
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Track the garbage reports you have submitted.
                    </p>
                </div>

                {/* Shortcut to the report form */}
                <Link
                    to="/citizen/report"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                    + New Report
                </Link>
            </div>

            {/* Status summary (hidden until data is available) */}
            {!loading && !error && counts.total > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                    {/* Total submitted */}
                    <SummaryTile label="Total" value={counts.total} />

                    {/* Waiting for a cleaner */}
                    <SummaryTile label="Pending" value={counts.pending} />

                    {/* Being cleaned right now */}
                    <SummaryTile label="In Progress" value={counts.inProgress} />

                    {/* Completed cleanups */}
                    <SummaryTile label="Resolved" value={counts.resolved} />
                </div>
            )}

            {/* Status filter buttons */}
            {!loading && !error && counts.total > 0 && (
                <div className="flex flex-wrap gap-2">
                    {REPORT_STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            // Highlight the active filter
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                statusFilter === filter.value
                                    ? "bg-slate-900 text-white"
                                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Loading state */}
            {loading && <ReportListSkeleton />}

            {/* Error state with retry */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Data state */}
            {!loading && !error && (
                visibleReports.length > 0 ? (
                    <div className="space-y-3">
                        {visibleReports.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                ) : (
                    // Empty state changes depending on whether a filter is applied
                    <ReportListEmpty
                        title={
                            counts.total === 0
                                ? "You have not reported any garbage yet"
                                : "No reports match this filter"
                        }
                        description={
                            counts.total === 0
                                ? "Submit your first report and help keep your neighbourhood clean."
                                : "Try selecting a different status."
                        }
                        actionLabel={counts.total === 0 ? "Report Garbage" : undefined}
                        actionTo={counts.total === 0 ? "/citizen/report" : undefined}
                    />
                )
            )}
        </div>
    );
}

/**
 * Small tile used in the status summary row
 */
function SummaryTile({ label, value }) {

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            {/* Status name */}
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>

            {/* Number of reports */}
            <p className="mt-1 text-2xl font-semibold text-slate-900">
                {value}
            </p>
        </div>
    );
}
