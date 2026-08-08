import { Link } from "react-router-dom";
import StatusBadge from "@/components/reports/StatusBadge";
import { formatRelativeTime } from "@/utils/formatters";

/**
 * ==========================================================
 * Report Card
 * ----------------------------------------------------------
 * Compact preview of a single garbage report.
 * Used by "My Reports" and "All Reports" listing pages.
 * Clicking the card opens the report detail page.
 * ==========================================================
 */

export default function ReportCard({ report }) {

    return (
        <Link
            to={`/reports/${report.id}`}
            className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
            {/* Garbage photo uploaded by the citizen */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {report.imageUrl ? (
                    <img
                        src={report.imageUrl}
                        alt={report.title}
                        // Lazy load keeps long lists fast
                        loading="lazy"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                ) : (
                    // Placeholder when no image is available
                    <div className="flex h-full w-full items-center justify-center text-2xl">
                        🗑️
                    </div>
                )}
            </div>

            {/* Report summary */}
            <div className="min-w-0 flex-1">

                {/* Title and current status */}
                <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate font-semibold text-slate-900">
                        {report.title}
                    </h3>

                    <StatusBadge status={report.status} />
                </div>

                {/* Short description (clamped to two lines) */}
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {report.description || "No description provided."}
                </p>

                {/* Location and time */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="truncate">
                        📍 {report.city}
                        {report.state ? `, ${report.state}` : ""}
                    </span>

                    <span>🕘 {formatRelativeTime(report.createdAt)}</span>

                    {/* Reporter name is useful on the public/all reports list */}
                    {report.reportedBy && (
                        <span className="truncate">👤 {report.reportedBy}</span>
                    )}
                </div>
            </div>
        </Link>
    );
}
