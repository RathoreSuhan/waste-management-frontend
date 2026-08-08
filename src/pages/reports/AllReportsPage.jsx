import { useMemo, useState } from "react";

import ReportCard from "@/components/reports/ReportCard";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import { getAllReports } from "@/services/reportService";
import { REPORT_STATUS_FILTERS } from "@/constants/reportConstants";

/**
 * ============================================================================
 * All Reports Page
 * ============================================================================
 *
 * Community view of every garbage report in the system.
 * Calls GET /api/reports (JWT protected, available to all logged-in roles).
 *
 * Supports a text search and a status filter on the client side.
 * ============================================================================
 */

export default function AllReportsPage() {

    // Load every report from the backend
    const { data: reports, loading, error, reload } = useReports(getAllReports);

    // Free text search (title, city, address)
    const [search, setSearch] = useState("");

    // Selected status filter
    const [statusFilter, setStatusFilter] = useState("ALL");

    /**
     * Apply search + status filters and sort by newest first.
     */
    const visibleReports = useMemo(() => {

        // Guard against a non-array response
        const list = Array.isArray(reports) ? reports : [];

        // Case-insensitive search text
        const query = search.trim().toLowerCase();

        return list
            .filter((report) =>
                statusFilter === "ALL" ? true : report.status === statusFilter
            )
            .filter((report) => {

                // No search text - keep everything
                if (!query) {
                    return true;
                }

                // Match against the most useful fields
                return (
                    report.title?.toLowerCase().includes(query) ||
                    report.city?.toLowerCase().includes(query) ||
                    report.address?.toLowerCase().includes(query) ||
                    report.state?.toLowerCase().includes(query)
                );
            })
            // Newest report on top
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    }, [reports, search, statusFilter]);

    return (
        <div className="space-y-6">

            {/* Page heading */}
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                    Community Reports
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Browse garbage reports submitted across the platform.
                </p>
            </div>

            {/* Search and filter controls */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">

                {/* Search box */}
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, city, state or address..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                />

                {/* Status filter buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
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
            </div>

            {/* Loading state */}
            {loading && <ReportListSkeleton count={4} />}

            {/* Error state with retry */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Data state */}
            {!loading && !error && (
                visibleReports.length > 0 ? (
                    <div className="space-y-3">

                        {/* Result counter */}
                        <p className="text-sm text-slate-500">
                            Showing {visibleReports.length} report
                            {visibleReports.length > 1 ? "s" : ""}
                        </p>

                        {visibleReports.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}
                    </div>
                ) : (
                    <ReportListEmpty
                        title="No reports found"
                        description="Try changing the search text or the status filter."
                    />
                )
            )}
        </div>
    );
}
