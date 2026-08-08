import { useCallback } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, MapPin, FileText, Star } from "lucide-react";

import Alert from "@/components/ui/Alert";
import StatusBadge from "@/components/reports/StatusBadge";
import UrgencyRating from "@/components/reports/UrgencyRating";
import CommentSection from "@/components/comments/CommentSection";

import {
    ReportListSkeleton,
    ReportListError,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import { getReport } from "@/services/reportService";
import { formatReportRef } from "@/constants/reportConstants";
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
 * Full record of a single report, laid out as an acknowledgement slip:
 * reference number in a header band, then the details in labelled
 * definition lists.
 *
 * Calls GET /api/reports/{id}
 *
 * A confirmation notice appears when the citizen arrives straight
 * after filing the report (navigation state from CreateReportPage).
 * ============================================================================
 */

export default function ReportDetailPage() {

    // Report id from the URL
    const { id } = useParams();

    // Navigation state set by the create page
    const location = useLocation();

    // Stable fetcher so the hook does not refetch on every render
    const fetchReport = useCallback(() => getReport(id), [id]);

    // Load the record (null until the request finishes)
    const {
        data: report,
        loading,
        error,
        reload,
        refresh,
    } = useReports(fetchReport, null);

    // External maps link built from the stored coordinates
    const mapsUrl = report
        ? buildMapsUrl(report.latitude, report.longitude)
        : null;

    // Once the garbage is cleared there is nothing left to prioritise
    const resolved =
        report?.status === "RESOLVED" || report?.status === "COMPLETED";


    return (
        <div className="mx-auto max-w-4xl space-y-5">

            {/* Back navigation */}
            <Link
                to="/reports"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to All Reports
            </Link>

            {/* Acknowledgement shown right after a successful submission */}
            {location.state?.created && (
                <Alert type="success" title="Report Filed">
                    Your report has been recorded and will be assigned to a cleanup
                    team. Keep the reference number below to track its progress.
                </Alert>
            )}

            {/* Loading state */}
            {loading && <ReportListSkeleton count={1} />}

            {/* Error state with retry */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/* Report record */}
            {!loading && !error && report && (
                <article className="overflow-hidden rounded-gov border border-rule bg-white">

                    {/* Header band carrying the citable reference number */}
                    <header className="border-b border-rule bg-gov-navy px-5 py-4 text-white">

                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">
                                    Report Reference Number
                                </p>

                                {/* Monospace so the reference is easy to read out or copy */}
                                <p className="mt-1 font-mono text-lg font-bold tracking-wider">
                                    {formatReportRef(report.id, report.createdAt)}
                                </p>
                            </div>

                            <StatusBadge status={report.status} />
                        </div>
                    </header>

                    {/* Accent rule under the header band */}
                    <div className="tricolour-rule" />

                    <div className="p-5 lg:p-6">

                        {/* Title of the report */}
                        <h1 className="font-serif text-2xl font-bold text-gov-navy">
                            {report.title}
                        </h1>

                        {/* Filing details */}
                        <p className="mt-1.5 text-sm text-ink-muted">
                            Reported by{" "}
                            <span className="font-semibold text-ink">
                                {report.reportedBy || "a citizen"}
                            </span>
                            {" "}&bull;{" "}
                            {formatRelativeTime(report.createdAt)}
                        </p>

                        {/* Photographic evidence */}
                        {report.imageUrl && (
                            <figure className="mt-5">
                                <img
                                    src={report.imageUrl}
                                    alt={`Photographic evidence for ${report.title}`}
                                    className="w-full rounded-gov border border-rule object-cover"
                                />

                                <figcaption className="mt-1.5 text-xs text-ink-muted">
                                    Photograph submitted with the report.
                                </figcaption>
                            </figure>
                        )}

                        {/* Description, matching the backend field name */}
                        <Section title="Description" icon={FileText}>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                                {report.description || "No description provided."}
                            </p>
                        </Section>

                        {/* Location details */}
                        <Section
                            title="Location Details"
                            icon={MapPin}
                            action={
                                // Opens the exact spot in an external map service
                                mapsUrl && (
                                    <a
                                        href={mapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-gov-blue hover:underline"
                                    >
                                        View on Map
                                        <ExternalLink size={11} aria-hidden="true" />
                                    </a>
                                )
                            }
                        >
                            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">

                                {/* Street address */}
                                <DetailItem label="Address" value={report.address} />

                                {/* Nearby landmark */}
                                <DetailItem label="Landmark" value={report.landmark} />

                                {/* City / town */}
                                <DetailItem label="City" value={report.city} />

                                {/* State */}
                                <DetailItem label="State" value={report.state} />

                                {/* Postal code */}
                                <DetailItem label="PIN Code" value={report.pincode} />

                                {/* GPS coordinates */}
                                <DetailItem
                                    label="Coordinates"
                                    value={formatCoordinates(report.latitude, report.longitude)}
                                />
                            </dl>
                        </Section>

                        {/* Citizen voting - decides which reports are attended first */}
                        <Section title="Community Priority" icon={Star}>
                            <UrgencyRating
                                reportId={report.id}
                                urgencyScore={report.urgencyScore}
                                resolved={resolved}
                                // A vote moves both scores, so reload the record
                                onVoted={refresh}
                            />
                        </Section>

                        {/* Record metadata */}
                        <Section title="Record Details">

                            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">

                                {/* Internal identifier, kept for support queries */}
                                <DetailItem label="Record ID" value={`#${report.id}`} />

                                {/* Exact submission timestamp */}
                                <DetailItem
                                    label="Date Reported"
                                    value={formatDateTime(report.createdAt)}
                                />

                                {/* Public interest score from votes and comments */}

                                {report.engagementScore !== null &&
                                    report.engagementScore !== undefined && (
                                        <DetailItem
                                            label="Public Interest Score"
                                            value={Number(report.engagementScore).toFixed(1)}
                                        />
                                    )}
                            </dl>
                        </Section>

                        {/* Threaded discussion between citizens, cleaners and admins */}
                        <CommentSection
                            reportId={report.id}
                            // Comments and replies feed the engagement score
                            onChanged={refresh}
                        />

                        {/* Closing note, as printed on an acknowledgement slip */}
                        <p className="mt-6 border-t border-rule pt-3 text-[11px] leading-relaxed text-ink-muted">

                            This is an automatically generated acknowledgement. Please
                            quote the report reference number whenever you contact the
                            community helpdesk about this report.
                        </p>
                    </div>
                </article>
            )}
        </div>
    );
}

/**
 * Titled section with an optional icon and trailing action.
 * The tinted header strip keeps long records easy to scan.
 */
function Section({ title, icon: Icon, action, children }) {

    return (
        <section className="mt-6 rounded-gov border border-rule">

            <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper px-4 py-2">
                <h2 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                    {Icon && <Icon size={12} aria-hidden="true" />}
                    {title}
                </h2>

                {action}
            </div>

            <div className="p-4">{children}</div>
        </section>
    );
}

/**
 * Single label/value pair used in the detail lists
 */
function DetailItem({ label, value }) {

    return (
        <div>
            {/* Field name */}
            <dt className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                {label}
            </dt>

            {/* Field value - an em dash stands in for missing data */}
            <dd className="mt-0.5 text-sm text-ink">
                {value || "—"}
            </dd>
        </div>
    );
}
