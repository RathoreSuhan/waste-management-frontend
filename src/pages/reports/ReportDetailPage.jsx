import { useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/reports/StatusBadge";
import {
    ReportListSkeleton,
    ReportListError,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import { getReport } from "@/services/reportService";
import {
    formatCoordinates,
    formatDateTime,
    formatRelativeTime,
    buildMapsUrl,
} from "@/utils/formatters";

/**
 * ============================================================================
 * Report Detail Page
 * ============================================================================
 *
 * Full details of a single garbage report.
 * Calls GET /api/reports/{id}
 *
 * A success banner is shown when the user arrives here right after
 * creating the report (navigation state flag from CreateReportPage).
 * ============================================================================
 */

export default function ReportDetailPage() {

    // Report id from the URL
    const { id } = useParams();

    // Navigation state set by the create page
    const location = useLocation();

    // Stable fetcher so the hook does not refetch on every render
    const fetchReport = useCallback(() => getReport(id), [id]);

    // Load the report (null until the request finishes)
    const { data: report, loading, error, reload } = useReports(fetchReport, null);

    // Google Maps link built from the report coordinates
    const mapsUrl = report
        ? buildMapsUrl(report.latitude, report.longitude)
        : null;

    return (
        <div className="mx-auto max-w-4xl space-y-6">

            {/* Back navigation */}
            <Link
                to="/reports"
                className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900"
            >
                ← Back to reports
            </Link>

            {/* Confirmation shown right after a successful submission */}
            {location.state?.created && (
                <Alert type="success">
                    Your report was submitted successfully. Thank you for keeping your city clean!
                </Alert>
            )}

            {/* Loading state */}
            {loading && <ReportListSkeleton count={1} />}

            {/* Error state with retry */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Report details */}
            {!loading && !error && report && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* Garbage photo */}
                    {report.imageUrl && (
                        <img
                            src={report.imageUrl}
                            alt={report.title}
                            className="h-72 w-full object-cover"
                        />
                    )}

                    <div className="p-6 lg:p-8">

                        {/* Title and status */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <h1 className="text-2xl font-semibold text-slate-900">
                                {report.title}
                            </h1>

                            <StatusBadge status={report.status} />
                        </div>

                        {/* Reporter and time */}
                        <p className="mt-2 text-sm text-slate-500">
                            Reported by {report.reportedBy || "a citizen"} •{" "}
                            {formatRelativeTime(report.createdAt)}
                        </p>

                        {/* Description */}
                        <div className="mt-6">
                            <h2 className="text-sm font-semibold text-slate-800">
                                Description
                            </h2>

                            <p className="mt-2 whitespace-pre-line text-slate-600">
                                {report.description || "No description provided."}
                            </p>
                        </div>

                        {/* Location information */}
                        <div className="mt-6 rounded-xl border border-slate-200 p-4">

                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-sm font-semibold text-slate-800">
                                    Location
                                </h2>

                                {/* Open the exact spot in Google Maps */}
                                {mapsUrl && (
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-medium text-blue-700 hover:underline"
                                    >
                                        Open in Maps ↗
                                    </a>
                                )}
                            </div>

                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">

                                {/* Street address */}
                                <DetailItem label="Address" value={report.address} />

                                {/* Nearby landmark */}
                                <DetailItem label="Landmark" value={report.landmark} />

                                {/* City */}
                                <DetailItem label="City" value={report.city} />

                                {/* State */}
                                <DetailItem label="State" value={report.state} />

                                {/* Postal code */}
                                <DetailItem label="Pincode" value={report.pincode} />

                                {/* GPS coordinates */}
                                <DetailItem
                                    label="Coordinates"
                                    value={formatCoordinates(report.latitude, report.longitude)}
                                />
                            </dl>
                        </div>

                        {/* Report metadata */}
                        <div className="mt-6 rounded-xl border border-slate-200 p-4">
                            <h2 className="text-sm font-semibold text-slate-800">
                                Report Information
                            </h2>

                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">

                                {/* Report id */}
                                <DetailItem label="Report ID" value={`#${report.id}`} />

                                {/* Exact submission time */}
                                <DetailItem
                                    label="Submitted On"
                                    value={formatDateTime(report.createdAt)}
                                />

                                {/* Community urgency rating (added in later phases) */}
                                {report.urgencyScore !== null &&
                                    report.urgencyScore !== undefined && (
                                        <DetailItem
                                            label="Urgency Score"
                                            value={`${Number(report.urgencyScore).toFixed(1)} / 5`}
                                        />
                                    )}

                                {/* Popularity score from votes and comments */}
                                {report.engagementScore !== null &&
                                    report.engagementScore !== undefined && (
                                        <DetailItem
                                            label="Engagement Score"
                                            value={Number(report.engagementScore).toFixed(1)}
                                        />
                                    )}
                            </dl>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Single label/value row used in the detail sections
 */
function DetailItem({ label, value }) {

    return (
        <div>
            {/* Field name */}
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </dt>

            {/* Field value (dash when the backend sends nothing) */}
            <dd className="mt-1 text-sm text-slate-800">
                {value || "—"}
            </dd>
        </div>
    );
}
