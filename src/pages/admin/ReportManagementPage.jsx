import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, FileSearch, Trash2, Eye, SlidersHorizontal } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/reports/StatusBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import {
    searchReports,
    filterReports,
    deleteReport,
} from "@/services/adminService";
import {
    REPORT_STATUS_FILTERS,
    formatReportRef,
} from "@/constants/reportConstants";
import { formatDateTime } from "@/utils/formatters";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Report Management (Phase 12)
 * ============================================================================
 *
 * Register of every garbage report, with search, filtering and deletion.
 *
 * Search and filter are distinct backend endpoints with different
 * semantics: search matches one keyword against title, city, state and
 * pincode as a substring, while filter matches status, city and state
 * exactly and combines them. They are therefore offered as two modes
 * rather than merged, and switching mode clears the other's inputs so
 * the results always match what is on screen.
 * ============================================================================
 */

export default function ReportManagementPage() {

    // Which endpoint is driving the register
    const [mode, setMode] = useState("filter"); // "filter" | "search"

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Search mode - typed value and the applied value
    const [keywordInput, setKeywordInput] = useState("");
    const [keyword, setKeyword] = useState("");

    // Filter mode - applied on submit, so the register does not
    // reload on every keystroke in the city and state boxes
    const [filterInput, setFilterInput] = useState({
        status: "ALL",
        city: "",
        state: "",
    });
    const [filters, setFilters] = useState({
        status: "ALL",
        city: "",
        state: "",
    });

    // Bumped after a deletion to refresh the register
    const [reloadKey, setReloadKey] = useState(0);

    // Deletion confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);

    // Outcome of the last deletion
    const [notice, setNotice] = useState("");

    /**
     * Load the register for whichever mode is active.
     */
    useEffect(() => {

        let ignore = false;

        const request =
            mode === "search" && keyword
                ? searchReports(keyword)
                : filterReports({
                    // "ALL" is a UI value - the parameter is omitted instead
                    status: filters.status === "ALL" ? undefined : filters.status,
                    city: filters.city,
                    state: filters.state,
                });

        request
            .then((data) => {
                if (!ignore) {
                    setReports(data);
                    setError("");
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(
                        getErrorMessage(err, "The report register could not be loaded.")
                    );
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [mode, keyword, filters, reloadKey]);

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

        setLoading(true);
        setMode("search");
        setKeyword(trimmed);
    };

    /**
     * Applies the filter inputs and switches to filter mode.
     */
    const handleFilter = (event) => {
        event.preventDefault();

        setLoading(true);
        setMode("filter");
        setKeyword("");
        setKeywordInput("");
        setFilters(filterInput);
    };

    /**
     * Clears everything and returns to the unfiltered register.
     */
    const clearAll = () => {
        const empty = { status: "ALL", city: "", state: "" };

        setLoading(true);
        setMode("filter");
        setKeyword("");
        setKeywordInput("");
        setFilterInput(empty);
        setFilters(empty);
    };

    /**
     * Updates one filter field.
     */
    const updateFilter = (field) => (event) => {
        setFilterInput((current) => ({
            ...current,
            [field]: event.target.value,
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
                setReloadKey((key) => key + 1);
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
        !!filters.city ||
        !!filters.state;

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
                                Search by title, city, state or pincode
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

                        <div>
                            <label
                                htmlFor="city-filter"
                                className="mb-1 block text-xs text-ink-muted"
                            >
                                City
                            </label>

                            <input
                                id="city-filter"
                                type="text"
                                value={filterInput.city}
                                onChange={updateFilter("city")}
                                placeholder="Exact city name"
                                className="rounded-gov border border-rule bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gov-blue"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="state-filter"
                                className="mb-1 block text-xs text-ink-muted"
                            >
                                State
                            </label>

                            <input
                                id="state-filter"
                                type="text"
                                value={filterInput.state}
                                onChange={updateFilter("state")}
                                placeholder="Exact state name"
                                className="rounded-gov border border-rule bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gov-blue"
                            />
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
                                ? "Adjust the search term or filters. City and state must match exactly."
                                : "No reports have been filed on the platform yet."}
                        </p>
                    </div>
                )}

                {/* Register */}
                {!loading && reports.length > 0 && (
                    <div className="rounded-gov border border-rule bg-white">

                        <div className="border-b border-rule bg-paper px-5 py-3">
                            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                Reports ({reports.length})
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-rule bg-paper text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Reference</th>
                                        <th className="px-5 py-3">Title</th>
                                        <th className="px-5 py-3">Location</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Filed</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-rule text-sm">
                                    {reports.map((report) => (
                                        <tr key={report.id} className="transition hover:bg-paper">

                                            <td className="px-5 py-3 font-mono text-[11px] whitespace-nowrap text-ink-muted">
                                                {formatReportRef(report.id, report.createdAt)}
                                            </td>

                                            <td className="max-w-[260px] px-5 py-3">
                                                <p className="truncate font-semibold text-gov-navy">
                                                    {report.title}
                                                </p>
                                            </td>

                                            <td className="px-5 py-3 text-ink-muted">
                                                {report.city}
                                                {report.state ? `, ${report.state}` : ""}
                                                {report.pincode ? ` — ${report.pincode}` : ""}
                                            </td>

                                            <td className="px-5 py-3">
                                                <StatusBadge status={report.status} />
                                            </td>

                                            <td className="px-5 py-3 text-xs whitespace-nowrap text-ink-muted">
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
