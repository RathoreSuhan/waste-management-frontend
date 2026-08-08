import { Link } from "react-router-dom";
import Alert from "@/components/ui/Alert";

/**
 * ==========================================================
 * Report List States
 * ----------------------------------------------------------
 * Shared UI for the three non-data states of a list page:
 *
 * ✓ Loading  - animated placeholder cards
 * ✓ Error    - message with a retry button
 * ✓ Empty    - friendly message with an optional action
 * ==========================================================
 */

/**
 * Skeleton cards shown while reports are loading
 */
export function ReportListSkeleton({ count = 3 }) {

    return (
        <div className="space-y-3">
            {/* Render placeholder rows matching the ReportCard layout */}
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="flex animate-pulse gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                >
                    {/* Image placeholder */}
                    <div className="h-24 w-24 shrink-0 rounded-xl bg-slate-200" />

                    {/* Text placeholders */}
                    <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 w-1/3 rounded bg-slate-200" />
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                        <div className="h-3 w-1/2 rounded bg-slate-200" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * Error state with a retry action
 */
export function ReportListError({ message, onRetry }) {

    return (
        <div className="space-y-3">
            {/* Backend or network error message */}
            <Alert type="error">{message}</Alert>

            {/* Let the user retry without refreshing the page */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

/**
 * Empty state shown when no reports match
 */
export function ReportListEmpty({
    title = "No reports found",
    description = "There is nothing to show here yet.",
    actionLabel,
    actionTo,
}) {

    return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">

            {/* Simple illustration */}
            <div className="text-4xl">🗑️</div>

            {/* Headline */}
            <h3 className="mt-3 text-lg font-semibold text-slate-900">
                {title}
            </h3>

            {/* Supporting text */}
            <p className="mt-1 text-sm text-slate-500">
                {description}
            </p>

            {/* Optional call to action (e.g. create first report) */}
            {actionLabel && actionTo && (
                <Link
                    to={actionTo}
                    className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
