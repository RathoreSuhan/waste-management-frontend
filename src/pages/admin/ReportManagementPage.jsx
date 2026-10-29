import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";
import { Search, X, FileSearch, Trash2, Eye, SlidersHorizontal } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/reports/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import useServerPagination from "@/hooks/useServerPagination";

import {
    searchReports,
    filterReports,
    deleteReport,
} from "@/services/adminService";
import { getLocationDirectory } from "@/services/locationService";
import {
    REPORT_STATUS_FILTERS,
    formatReportRef,
} from "@/constants/reportConstants";
import { formatDateTime } from "@/utils/formatters";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * Fetch one page of reports for the register.
 *
 * The hook calls this with the page number and the params it was given.
 * A keyword switches to the search endpoint; otherwise the filter endpoint
 * is used with whatever status and State + District pair were chosen. Both
 * are asked for newest first, so the register reads the same whichever mode
 * is open.
 */
async function fetchRegister({ page, size, keyword, status, district, state }) {
    if (keyword) {
        return searchReports(keyword, {
            page,
            size,
            sortBy: "createdAt",
            direction: "desc",
        });
    }

    return filterReports({
        status,
        district,
        state,
        page,
        size,
        sortBy: "createdAt",
        direction: "desc",
    });
}

/**
 * ============================================================================
 * Report Management (Phase 12)
 * ============================================================================
 *
 * Register of every garbage report, with search, filtering and deletion.
 *
 * Search and filter are distinct backend endpoints with different
 * semantics: search matches one keyword against title, district,
 * city/municipal area, state, pincode and address as a substring, while
 * filter matches a status and the geographical State + District pair
 * exactly and combines them. They are therefore offered as two modes
 * rather than merged, and switching mode clears the other's inputs so
 * the results always match what is on screen.
 *
 * The geographical filter is the DISTRICT, chosen with its state from the
 * verified location directory: a district is an administrative area, and
 * two states can name one the same way, so the pair is submitted (as
 * canonical names resolved from the directory codes) rather than a typed
 * city. A report's city/ULB stays a per-row display value, never a filter.
 *
 * One page arrives per request. That used to mean the whole register,
 * sliced in the browser, so a register of a few thousand reports was
 * downloaded to show ten. The request now carries the page and its size
 * along with the mode's own filters.
 * ============================================================================
 */

/* Same ordering the shared location cascade uses for directory names. */
const LOCATION_NAME_COLLATOR = new Intl.Collator("en", {
    sensitivity: "base",
    numeric: true,
    ignorePunctuation: true,
});

const EMPTY_FILTER_INPUT = { status: "ALL", stateCode: "", districtCode: "" };
const EMPTY_FILTERS = { status: "ALL", district: "", state: "" };

export default function ReportManagementPage() {

    // Search mode - typed value and the applied value
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");

    // The verified directory feeds the State + District filter selects.
    // State updates happen inside promise callbacks rather than the effect
    // body, and the loading flag is owned by the initial value and the
    // retry handler instead of the fetch itself.
    const [directory, setDirectory] = useState(null);
    const [directoryStatus, setDirectoryStatus] = useState("loading");

    const fetchDirectory = useCallback(() => {
        return getLocationDirectory()
            .then((data) => {
                setDirectory(data);
                setDirectoryStatus("ready");
            })
            .catch(() => {
                setDirectoryStatus("failed");
            });
    }, []);

    useEffect(() => {
        fetchDirectory();
    }, [fetchDirectory]);

    const retryDirectory = () => {
        setDirectoryStatus("loading");
        fetchDirectory();
    };

    // Filter mode - codes picked on screen; the applied pair holds the
    // canonical NAMES resolved from the directory, which is what the
    // backend's filter compares against
    const [filterInput, setFilterInput] = useState(EMPTY_FILTER_INPUT);
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    // Deletion confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Outcome of the last deletion
    const [notice, setNotice] = useState("");

    // Anchor for the jump back up when the page changes
    const tableTopRef = useRef(null);

    /*
      One page of the register, from whichever mode is active.

      The filters live in `params` below, which is what tells
      useServerPagination to return to the first page when they move - page
      3 of every report is not page 3 of a search for "patna".
    */
    const {
        pageItems: reports,
        page,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
        loading,
        error,
        refresh,
    } = useServerPagination(fetchRegister, {
        params: {
            keyword,
            // "ALL" is a UI value - the parameter is omitted instead
            status: filters.status === "ALL" ? undefined : filters.status,
            district: filters.district,
            state: filters.state,
        },
        fallbackMessage: "The report register could not be loaded.",
    });
    /**
     * Applies the typed keyword and switches to search mode.
     */
    const handleSearch = (event) => {
        event.preventDefault();

        const trimmed = keywordInput.trim();

        // An empty keyword would be rejected by the backend
        if (!trimmed) {
            return;
        }

        // The hook reloads on its own once the keyword changes
        setKeyword(trimmed);
    };

    /**
     * Applies the filter inputs and returns to the filtered register.
     *
     * The chosen codes are resolved back to their canonical directory names
     * here, so the request carries names the backend compares against -
     * codes never cross the wire as filter values.
     */
    const handleFilter = (event) => {
        event.preventDefault();

        const state = directory?.states?.find(
            (candidate) => candidate.code === filterInput.stateCode
        );
        const district = state?.districts?.find(
            (candidate) => candidate.code === filterInput.districtCode
        );

        setKeyword("");
        setKeywordInput("");
        setFilters({
            status: filterInput.status,
            district: district?.name ?? "",
            state: state?.name ?? "",
        });
    };

    /**
     * Clears everything and returns to the unfiltered register.
     */
    const clearAll = () => {
        setKeyword("");
        setKeywordInput("");
        setFilterInput(EMPTY_FILTER_INPUT);
        setFilters(EMPTY_FILTERS);
    };

    /**
     * Updates one filter field; choosing a state clears its district,
     * exactly like the shared location cascade.
     */
    const updateFilter = (field) => (event) => {
        const value = event.target.value;
        setFilterInput((current) => ({
            ...current,
            [field]: value,
            ...(field === "stateCode" ? { districtCode: "" } : {}),
        }));
    };

    /**
     * Opens the deletion confirmation.
     */
    const askDelete = (report) => {
        setDeleteError("");
        setDeleteTarget(report);
    };

    /**
     * Closes the confirmation.
     */
    const closeDelete = () => {
        if (!deleting) {
            setDeleteTarget(null);
            setDeleteError("");
        }
    };

    /**
     * Deletes the report after confirmation.
     */
    const confirmDelete = () => {

        if (!deleteTarget) {
            return;
        }

        setDeleting(true);
        setDeleteError("");

        deleteReport(deleteTarget.id)
            .then((response) => {
                setNotice(
                    response?.message || "The report has been removed."
                );

                setDeleteTarget(null);
                refresh();
            })
            .catch((err) => {
                setDeleteError(
                    getErrorMessage(err, "The report could not be removed.")
                );
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    // Whether anything is currently narrowing the register
    const isNarrowed =
        !!keyword ||
        filters.status !== "ALL" ||
        !!filters.district ||
        !!filters.state;

    // Directory options for the two geographical selects, in the shared order
    const stateOptions = useMemo(
        () => [...(directory?.states ?? [])].sort(
            (a, b) => LOCATION_NAME_COLLATOR.compare(a.name, b.name)
        ),
        [directory]
    );

    const selectedState = stateOptions.find(
        (candidate) => candidate.code === filterInput.stateCode
    );

    const districtOptions = useMemo(
        () => [...(selectedState?.districts ?? [])].sort(
            (a, b) => LOCATION_NAME_COLLATOR.compare(a.name, b.name)
        ),
        [selectedState]
    );

    return (
        <div>
            <PageHeading
                title="Report Administration"
                titleHi="शिकायत प्रशासन"
                subtitle="Search, filter and remove garbage reports across the platform."
            />

            <div className="space-y-4">

                {/* Outcome of the last deletion */}
                {notice && (
                    <Alert type="success" title="Report removed">
                        {notice}
                    </Alert>
                )}

                {/* Search by keyword */}
                <div className="rounded-gov border border-rule bg-white p-4">

                    <form onSubmit={handleSearch} className="flex items-end gap-2">
                        <div className="flex-1">
                            <label
                                htmlFor="report-search"
                                className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-ink-muted uppercase"
                            >
                                Search by title, district, city/municipal area, state or pincode
                            </label>

                            <div className="relative">
                                <Search
                                    size={15}
                                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                                    aria-hidden="true"
                                />

                                <input
                                    id="report-search"
                                    type="search"
                                    value={keywordInput}
                                    onChange={(e) => setKeywordInput(e.target.value)}
                                    placeholder="e.g. Salt Lake, 700064, overflowing bin"
                                    className="w-full rounded-gov border border-rule bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none transition focus:border-gov-blue"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Filter by status and location */}
                <div className="rounded-gov border border-rule bg-white p-4">

                    <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        <SlidersHorizontal size={13} aria-hidden="true" />
                        Filter Register
                    </p>

                    <form
                        onSubmit={handleFilter}
                        className="flex flex-wrap items-end gap-3"
                    >
                        <div>
                            <label
                                htmlFor="status-filter"
                                className="mb-1 block text-xs text-ink-muted"
                            >
                                Status
                            </label>

                            <select
                                id="status-filter"
                                value={filterInput.status}
                                onChange={updateFilter("status")}
                                className="rounded-gov border border-rule bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gov-blue"
                            >
                                {REPORT_STATUS_FILTERS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {directoryStatus === "failed" && (
                            <p className="text-sm text-red-600">
                                The location directory could not be loaded, so the
                                district filter is unavailable.
                                <button
                                    type="button"
                                    onClick={retryDirectory}
                                    className="ml-1 font-semibold text-gov-blue hover:underline"
                                >
                                    Retry
                                </button>
                            </p>
                        )}

                        <div>
                            <label
                                htmlFor="state-filter"
                                className="mb-1 block text-xs text-ink-muted"
                            >
                                State
                            </label>

                            <select
                                id="state-filter"
                                value={filterInput.stateCode}
                                onChange={updateFilter("stateCode")}
                                disabled={directoryStatus !== "ready"}
                                className="rounded-gov border border-rule bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gov-blue disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <option value="">All states</option>
                                {stateOptions.map((state) => (
                                    <option key={state.code} value={state.code}>
                                        {state.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="district-filter"
                                className="mb-1 block text-xs text-ink-muted"
                            >
                                District
                            </label>

                            <select
                                id="district-filter"
                                value={filterInput.districtCode}
                                onChange={updateFilter("districtCode")}
                                disabled={directoryStatus !== "ready" || !selectedState}
                                className="rounded-gov border border-rule bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gov-blue disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <option value="">
                                    {selectedState ? "All districts" : "Choose a state first"}
                                </option>
                                {districtOptions.map((district) => (
                                    <option key={district.code} value={district.code}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="rounded-gov border border-gov-navy bg-gov-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-navy/90"
                        >
                            Apply Filters
                        </button>
                    </form>

                    {/* What is currently applied, with a way to clear it */}
                    {isNarrowed && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-rule pt-3 text-xs text-ink-muted">
                            <span>
                                {keyword
                                    ? `Search results for “${keyword}”`
                                    : "Filters applied"}
                            </span>

                            <button
                                type="button"
                                onClick={clearAll}
                                className="inline-flex items-center gap-1 font-semibold text-gov-blue hover:underline"
                            >
                                <X size={12} aria-hidden="true" />
                                Clear and show all
                            </button>
                        </div>
                    )}
                </div>

                {/* Load failure */}
                {error && (
                    <Alert type="error" title="Register unavailable">
                        {error}
                    </Alert>
                )}

                {/* Loading */}
                {loading && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center text-sm text-ink-muted">
                        Loading report register…
                    </div>
                )}

                {/* Nothing matched */}
                {!loading && !error && reports.length === 0 && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center">
                        <FileSearch
                            size={32}
                            className="mx-auto text-ink-muted"
                            aria-hidden="true"
                        />
                        <p className="mt-3 font-semibold text-ink">
                            No matching reports
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                            {isNarrowed
                                ? "Adjust the search term or filters. The state and district pair must match exactly; legacy reports without a reconciled district never match a district filter."
                                : "No reports have been filed on the platform yet."}
                        </p>
                    </div>
                )}

                {/* Register */}
                {!loading && reports.length > 0 && (
                    <div ref={tableTopRef} className="rounded-gov border border-rule bg-white">

                        <div className="border-b border-rule bg-paper px-5 py-3">
                            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                Reports ({total})
                            </h2>
                        </div>


                        <div className="overflow-x-auto">
                            <table className="w-full">
                                {/*
                                  Interior columns at px-3, matching the user
                                  register: at px-5 the reference and actions
                                  columns could not both be on screen at once,
                                  so one edge was always cut off. First and
                                  last cells keep px-5 to stay aligned with
                                  the panel heading above.
                                */}
                                <thead className="border-b border-rule bg-paper text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Reference</th>
                                        <th className="px-3 py-3">Title</th>
                                        <th className="px-3 py-3">Location</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3">Filed</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-rule text-sm">
                                    {reports.map((report) => (

                                        <tr key={report.id} className="transition hover:bg-paper">

                                            <td className="px-5 py-3 font-mono text-[11px] whitespace-nowrap text-ink-muted">
                                                {formatReportRef(report.id, report.createdAt)}
                                            </td>

                                            <td className="max-w-[260px] px-3 py-3">
                                                <p className="truncate font-semibold text-gov-navy">
                                                    {report.title}
                                                </p>
                                            </td>

                                            <td className="px-3 py-3 text-ink-muted">
                                                {report.city}
                                                {report.state ? `, ${report.state}` : ""}
                                                {report.pincode ? ` — ${report.pincode}` : ""}
                                            </td>

                                            <td className="px-3 py-3">
                                                <StatusBadge status={report.status} />
                                            </td>

                                            <td className="px-3 py-3 text-xs whitespace-nowrap text-ink-muted">
                                                {formatDateTime(report.createdAt)}
                                            </td>

                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-2">

                                                    {/* Opens the public detail page */}
                                                    <Link
                                                        to={`/reports/${report.id}`}
                                                        aria-label={`View ${report.title}`}
                                                        className="rounded border border-rule bg-white p-1.5 text-ink-muted transition hover:border-gov-blue hover:text-gov-blue"
                                                    >
                                                        <Eye size={14} aria-hidden="true" />
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => askDelete(report)}
                                                        aria-label={`Remove ${report.title}`}
                                                        className="rounded border border-red-700 bg-red-50 p-1.5 text-red-700 transition hover:bg-red-100"
                                                    >
                                                        <Trash2 size={14} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Inset so the pager sits inside the panel */}
                        <div className="px-5 pb-4">
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                total={total}
                                rangeStart={rangeStart}
                                rangeEnd={rangeEnd}
                                onPageChange={goToPage}
                                itemLabel="reports"
                                scrollTargetRef={tableTopRef}
                            />
                        </div>
                    </div>
                )}
            </div>


            {/*
              The consequences are spelled out because report deletion
              cascades widely on the backend, including deducting points
              a cleaner has already earned.
            */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Report"
                description={`Permanently remove “${deleteTarget?.title}”? This cannot be undone.`}
                consequences={[
                    "The photograph held in cloud storage",
                    "All comments and urgency ratings",
                    "The cleanup assignment, if one exists",
                    "Reward points already credited for this cleanup",
                ]}
                confirmLabel="Remove Report"
                error={deleteError}
                busy={deleting}
                onConfirm={confirmDelete}
                onCancel={closeDelete}
            />
        </div>
    );
}
