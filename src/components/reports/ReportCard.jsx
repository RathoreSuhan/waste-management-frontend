import { Link } from "react-router-dom";
import { MapPin, Clock, User, ImageOff, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/reports/StatusBadge";
import useLayoutMode from "@/hooks/useLayoutMode";
import { formatRelativeTime } from "@/utils/formatters";
import { formatReportRef } from "@/constants/reportConstants";

/**
 * ==========================================================
 * Report Card
 * ----------------------------------------------------------
 * One row in the report listing.
 *
 * Styled as an official record rather than a marketing card:
 * square corners, a visible reference number, and metadata
 * laid out in a single scannable line.
 *
 * The card appears in both shells, so the destination is
 * prefixed with the current base path: a row opened from the
 * sidebar stays inside the shell instead of dropping the
 * reader out onto the public site.
 * ==========================================================
 */

export default function ReportCard({ report }) {

    // "" on the public site, "/app" inside the signed-in shell
    const { basePath } = useLayoutMode();

    return (
        <Link
            to={`${basePath}/reports/${report.id}`}
            className="group flex gap-4 rounded-gov border border-rule bg-white p-3.5 transition hover:border-gov-blue hover:bg-gov-blue/[0.02]"
        >
            {/* Photograph submitted with the report */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-gov border border-rule bg-paper">
                {report.imageUrl ? (
                    <img
                        src={report.imageUrl}
                        alt={`Photograph for ${report.title}`}
                        // Lazy loading keeps long registers responsive
                        loading="lazy"
                        className="h-full w-full object-cover"
                    />
                ) : (
                    // Shown when no photograph was attached
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-muted">
                        <ImageOff size={18} aria-hidden="true" />
                        <span className="text-[10px]">No photo</span>
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">

                {/* Reference number sits above the title, as on official records */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-mono text-[11px] tracking-wide text-ink-muted">
                            {formatReportRef(report.id, report.createdAt)}
                        </p>

                        <h3 className="mt-0.5 truncate font-semibold text-gov-navy">
                            {report.title}
                        </h3>
                    </div>

                    <StatusBadge status={report.status} />
                </div>

                {/* Description, limited to two lines to keep rows even */}
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
                    {report.description || "No description provided."}
                </p>

                {/* Metadata line - thin rule separates it from the description */}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule pt-2 text-xs text-ink-muted">

                    <span className="flex items-center gap-1 truncate">
                        <MapPin size={12} aria-hidden="true" />
                        {report.city}
                        {report.state ? `, ${report.state}` : ""}
                    </span>

                    <span className="flex items-center gap-1">
                        <Clock size={12} aria-hidden="true" />
                        {formatRelativeTime(report.createdAt)}
                    </span>

                    {/* Only present on the public register */}
                    {report.reportedBy && (
                        <span className="flex items-center gap-1 truncate">
                            <User size={12} aria-hidden="true" />
                            {report.reportedBy}
                        </span>
                    )}

                    {/* Affordance hinting the row opens a detail page */}
                    <span className="ml-auto hidden items-center gap-0.5 font-medium text-gov-blue group-hover:flex">
                        View details
                        <ChevronRight size={12} aria-hidden="true" />
                    </span>
                </div>
            </div>
        </Link>
    );
}
