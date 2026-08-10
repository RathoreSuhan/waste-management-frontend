import { useMemo, useRef, useState } from "react";
import { Search, Globe2 } from "lucide-react";

import PageIntro from "@/components/layout/PageIntro";
import PageSection from "@/components/layout/PageSection";
import ReportCard from "@/components/reports/ReportCard";
import Pagination from "@/components/common/Pagination";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import usePagination from "@/hooks/usePagination";

import { getAllReports } from "@/services/reportService";
import { REPORT_STATUS_FILTERS } from "@/constants/reportConstants";

/**
 * ============================================================================
 * All Reports Page
 * ============================================================================
 *
 * Community view of every garbage report in the system.
 * Calls GET /api/reports, which is open to everyone for reads.
 *
 * Supports a text search and a status filter on the client side.
 *
 * Serves both shells: the public site, where it opens with the navy band,
 * and the signed-in shell reached from the sidebar, where it opens with the
 * ordinary page heading. PageIntro decides which.
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

    /*
      Ten records to a page.

      The backend returns the whole register in one response, so the
      paging is done here. The reader still gets a short page rather
      than several hundred cards, and the search and status filters
      above run across every record, not just the visible ten.
    */
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(visibleReports);

    // Where to scroll back to when the page changes
    const listTopRef = useRef(null);

    return (

        <>
            {/* Opening block - band on the public site, heading in-app */}
            <PageIntro
                icon={Globe2}
                eyebrow="Public Register"
                en="Public Reports"
                hi="सार्वजनिक रिपोर्ट"
                description="Every waste report filed on the platform, open for anyone to read."
            />

            <PageSection className="space-y-6">

                {/* Search and filter controls, framed as a record search panel */}
                <div className="rounded-gov border border-rule bg-white">

                    <div className="border-b border-rule bg-paper px-4 py-2">
                        <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Search Records
                        </h2>
                    </div>

                    <div className="p-4">

                        {/* Search box with a leading icon */}
                        <div className="relative">
                            <Search
                                size={15}
                                className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                                aria-hidden="true"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by title, city, state or address"
                                aria-label="Search reports"
                                className="w-full rounded-gov border border-rule py-2 pr-3 pl-9 text-sm outline-none transition placeholder:text-ink-muted/60 focus:border-gov-blue"
                            />
                        </div>

                        {/* Status filter buttons */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">

                            <span className="mr-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                                Status
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
                    total > 0 ? (
                        <div ref={listTopRef} className="space-y-3">

                            {/* Result counter, worded as an official record count */}
                            <p className="border-b border-rule pb-2 text-xs text-ink-muted">
                                Displaying{" "}
                                <span className="font-semibold text-ink">
                                    {rangeStart}–{rangeEnd}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-ink">
                                    {total}
                                </span>{" "}
                                record{total > 1 ? "s" : ""}
                            </p>

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
                        <ReportListEmpty
                            title="No records found"
                            description="Revise the search terms or select a different status filter."
                        />
                    )
                )}
            </PageSection>
        </>
    );
}
