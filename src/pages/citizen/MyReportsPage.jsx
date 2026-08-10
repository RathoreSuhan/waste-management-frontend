import { useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";
import { FilePlus2 } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import ReportCard from "@/components/reports/ReportCard";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import Pagination from "@/components/common/Pagination";

import useReports from "@/hooks/useReports";
import usePagination from "@/hooks/usePagination";
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

    // Ten reports to a page, filtered set first
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(visibleReports);

    // Anchor for the jump back up when the page changes
    const listTopRef = useRef(null);

    return (
        <div className="space-y-6">


            {/* Page heading with the primary action */}
            <PageHeading
                title="My Reports"
                titleHi="मेरी रिपोर्ट"
                subtitle="Track the status of every report you have filed."
                action={
                    // Shortcut to the report form
                    <Link
                        to="/citizen/report"
                        className="inline-flex items-center gap-2 rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                    >
                        <FilePlus2 size={15} aria-hidden="true" />
                        File a Report
                    </Link>
                }
            />

            {/* Status summary (hidden until data is available) */}
            {!loading && !error && counts.total > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                    {/* Total submitted */}
                    <SummaryTile label="Total" value={counts.total} accent="border-l-gov-navy" />

                    {/* Filed, not yet picked up */}
                    <SummaryTile label="Pending" value={counts.pending} accent="border-l-saffron" />

                    {/* Currently being actioned */}
                    <SummaryTile label="Under Process" value={counts.inProgress} accent="border-l-gov-blue" />

                    {/* Closed successfully */}
                    <SummaryTile label="Resolved" value={counts.resolved} accent="border-l-india-green" />
                </div>
            )}

            {/* Status filter buttons */}
            {!loading && !error && counts.total > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-gov border border-rule bg-white px-3 py-2.5">

                    {/* Filters are labelled, as on official record searches */}
                    <span className="mr-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                        Filter by status
                    </span>

                    {REPORT_STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            // Selected filter is filled navy, the rest outlined
                            className={`rounded-gov border px-3 py-1.5 text-xs font-semibold transition ${statusFilter === filter.value
                                ? "border-gov-navy bg-gov-navy text-white"
                                : "border-rule bg-white text-ink-muted hover:border-gov-blue hover:text-gov-blue"
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
                total > 0 ? (
                    <div ref={listTopRef} className="space-y-3">
                        {pageItems.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}

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
                ) : (

                    // Empty state changes depending on whether a filter is applied
                    <ReportListEmpty
                        title={
                            counts.total === 0
                                ? "No reports yet"
                                : "No reports match this filter"
                        }
                        description={
                            counts.total === 0
                                ? "File your first report to have it recorded and assigned to a cleanup team."
                                : "Select a different status to view other reports."
                        }
                        actionLabel={counts.total === 0 ? "File a Report" : undefined}
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
function SummaryTile({ label, value, accent = "border-l-gov-navy" }) {

    return (
        // Accent rule on the left ties the tile to its status colour
        <div className={`rounded-gov border border-rule border-l-4 bg-white p-3.5 ${accent}`}>
            {/* Status name */}
            <p className="text-[11px] font-semibold tracking-[0.1em] text-ink-muted uppercase">
                {label}
            </p>

            {/* Number of records */}
            <p className="mt-1 font-serif text-2xl font-bold text-gov-navy">
                {value}
            </p>
        </div>
    );
}
