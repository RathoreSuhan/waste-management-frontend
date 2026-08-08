import { ArrowUpDown } from "lucide-react";
import {
    REPORT_SORT_OPTIONS,
    REPORT_STATUS_FILTERS,
} from "@/constants/engagementConstants";

/**
 * ==========================================================
 * Sort Control
 * ----------------------------------------------------------
 * Ordering and status filter for the engagement register.
 *
 * The status filter is a row of buttons because there are
 * only four and they are the primary way people slice this
 * list; the sort is a native <select> so the keyboard and
 * screen-reader behaviour comes for free.
 * ==========================================================
 */

export default function SortControl({
    sortMode,
    onSortChange,
    statusFilter,
    onStatusChange,
    resultCount,
}) {

    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-gov border border-rule bg-white p-3">

            {/* Status filter */}
            <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Filter reports by status"
            >
                {REPORT_STATUS_FILTERS.map((option) => {
                    const isActive = statusFilter === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onStatusChange(option.value)}
                            // Communicates the choice to assistive tech,
                            // which colour alone would not do
                            aria-pressed={isActive}
                            className={`rounded-gov border px-3 py-1.5 text-xs font-semibold transition ${isActive
                                ? "border-gov-blue bg-gov-blue text-white"
                                : "border-rule bg-white text-ink-muted hover:border-gov-blue hover:text-gov-blue"
                                }`}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center gap-3">

                {/* Result count, so a filter that hides everything is explicable */}
                {resultCount != null && (
                    <span className="text-xs text-ink-muted">
                        {resultCount} {resultCount === 1 ? "record" : "records"}
                    </span>
                )}

                {/* Ordering */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="report-sort"
                        className="flex items-center gap-1 text-xs font-semibold text-ink-muted"
                    >
                        <ArrowUpDown size={12} aria-hidden="true" />
                        Sort
                    </label>

                    <select
                        id="report-sort"
                        value={sortMode}
                        onChange={(event) => onSortChange(event.target.value)}
                        className="rounded-gov border border-rule bg-white px-2.5 py-1.5 text-xs font-medium text-gov-navy focus:border-gov-blue focus:outline-none focus:ring-1 focus:ring-gov-blue"
                    >
                        {REPORT_SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
