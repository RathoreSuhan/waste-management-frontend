import { useRef, useState } from "react";
import { Search, Globe2, X } from "lucide-react";


import PageIntro from "@/components/layout/PageIntro";
import PageSection from "@/components/layout/PageSection";
import ReportCard from "@/components/reports/ReportCard";
import Pagination from "@/components/common/Pagination";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useServerPagination from "@/hooks/useServerPagination";

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
 * Supports a text search and a status filter. Both are sent to the backend
 * as query parameters rather than applied to the page on screen - a filter
 * over one downloaded page answers a different question from the one the
 * reader asked, and only the backend can answer it across every report.
 *
 * Serves both shells: the public site, where it opens with the navy band,
 * and the signed-in shell reached from the sidebar, where it opens with the
 * ordinary page heading. PageIntro decides which.
 *
 * Status comes from ReportResponse.status and nothing else, so this register
 * reads the same whoever is signed in - a report claimed by a cleanup team is
 * already IN_PROGRESS server-side.
 * ============================================================================
 */

export default function AllReportsPage() {

    // Free text search (title, city, address) - what is in the box
    const [search, setSearch] = useState("");

    /*
      What the register is actually filtered by.

      Separate from `search` deliberately. The box changes on every
      keystroke; this only moves when the search is submitted, so the cards
      stay put while a place name is being typed rather than rearranging
      after every letter.
    */
    const [appliedSearch, setAppliedSearch] = useState("");


    // Selected status filter
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Anchor for the jump back up when the page changes
    const listTopRef = useRef(null);

    /*
      One page of the register, cut on the server.

      The fetcher simply forwards what it is given - the filters live in
      `params` below, which is what tells useServerPagination to return to
      the first page when they move. Sending `status` as undefined for "ALL"
      keeps it off the query string, where the backend would otherwise try
      to read it as a status it has never heard of.
    */
    const {
        pageItems,
        page,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
        loading,
        error,
        reload,
    } = useServerPagination(getAllReports, {
        params: {
            keyword: appliedSearch,
            status: statusFilter === "ALL" ? undefined : statusFilter,
        },
        fallbackMessage: "Unable to load reports.",
    });

    // The search box, so submitting can take focus off it
    const searchInputRef = useRef(null);

    /**
     * Run the search.
     *
     * Promoting the box contents to `appliedSearch` is what narrows the
     * register, so nothing moves until this runs - by the button or by
     * Enter, since this is a submit inside a form.
     *
     * The blur then dismisses the on-screen keyboard on a phone, which
     * would otherwise cover the results.
     */
    function handleSearchSubmit(event) {
        event.preventDefault();

        setAppliedSearch(search);

        searchInputRef.current?.blur();

        listTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    /**
     * Empty the box and restore the full register in one press.
     *
     * Both have to be reset: clearing the box alone would leave the
     * previous results on screen beneath an empty field.
     */
    function clearSearch() {
        setSearch("");
        setAppliedSearch("");
    }



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

                        {/*
                          Search box with a leading icon and a Search button.

                          A form, so Enter and the button follow the same path.
                          role="search" marks it as the search landmark.
                        */}
                        <form
                            role="search"
                            onSubmit={handleSearchSubmit}
                            className="flex items-center gap-2"
                        >
                            <div className="relative flex-1">
                                <Search
                                    size={15}
                                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                                    aria-hidden="true"
                                />

                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by title, city, state or address"
                                    aria-label="Search reports"
                                    className="w-full rounded-gov border border-rule py-2 pr-9 pl-9 text-sm outline-none transition placeholder:text-ink-muted/60 focus:border-gov-blue"
                                />

                                {/*
                                  Offered as soon as there is anything to
                                  clear, including text not yet searched for.
                                */}
                                {search.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}

                                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-ink-muted transition hover:text-ink"
                                        aria-label="Clear search"
                                    >
                                        <X size={15} aria-hidden="true" />
                                    </button>
                                )}
                            </div>

                            {/*
                              Left enabled on an empty box - pressing it then
                              simply re-runs the unfiltered register, and a
                              control greyed out for no visible reason reads
                              as broken.
                            */}
                            <button
                                type="submit"
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                            >
                                <Search size={15} aria-hidden="true" />
                                Search
                            </button>
                        </form>


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
