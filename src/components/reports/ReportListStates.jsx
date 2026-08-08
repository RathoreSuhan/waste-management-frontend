import { Link } from "react-router-dom";
import { FileSearch, RotateCcw } from "lucide-react";
import Alert from "@/components/ui/Alert";

/**
 * ==========================================================
 * Report List States
 * ----------------------------------------------------------
 * Shared UI for the three non-data states of a register page:
 *
 *   Loading - placeholder rows
 *   Error   - notice with a retry action
 *   Empty   - guidance with an optional next step
 * ==========================================================
 */

/**
 * Placeholder rows shown while the register loads.
 * Mirrors the ReportCard layout so the page does not jump.
 */
export function ReportListSkeleton({ count = 3 }) {

    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="flex animate-pulse gap-4 rounded-gov border border-rule bg-white p-3.5"
                >
                    {/* Photograph placeholder */}
                    <div className="h-24 w-24 shrink-0 rounded-gov bg-paper" />

                    {/* Text placeholders */}
                    <div className="flex-1 space-y-3 py-1">
                        <div className="h-3 w-1/4 rounded bg-paper" />
                        <div className="h-4 w-1/2 rounded bg-paper" />
                        <div className="h-3 w-3/4 rounded bg-paper" />
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
            {/* Backend or network failure */}
            <Alert type="error" title="Unable to load records">
                {message}
            </Alert>

            {/* Retry without a full page reload */}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-gov border border-gov-blue bg-white px-4 py-2 text-sm font-semibold text-gov-blue transition hover:bg-gov-blue/5"
                >
                    <RotateCcw size={14} aria-hidden="true" />
                    Retry
                </button>
            )}
        </div>
    );
}

/**
 * Empty state shown when the register has no matching records
 */
export function ReportListEmpty({
    title = "No records found",
    description = "There are no reports matching the selected criteria.",
    actionLabel,
    actionTo,
}) {

    return (
        <div className="rounded-gov border border-dashed border-rule bg-white p-10 text-center">

            {/* Neutral icon rather than an emoji */}
            <FileSearch
                size={32}
                className="mx-auto text-ink-muted"
                aria-hidden="true"
            />

            <h3 className="mt-3 font-serif text-lg font-bold text-gov-navy">
                {title}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {description}
            </p>

            {/* Optional next step, e.g. file the first report */}
            {actionLabel && actionTo && (
                <Link
                    to={actionTo}
                    className="mt-5 inline-block rounded-gov border border-gov-blue bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                >
                    {actionLabel}
                </Link>
            )}
        </div>
    );
}
