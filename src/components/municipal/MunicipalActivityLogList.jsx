/**
 * ============================================================================
 * Municipal Activity Log List (Phase 16 - Municipal Officer console)
 * ============================================================================
 *
 * Read-only officer view of a cleaner's on-site activity diary
 * (backend CleanupActivityLogResponse rows).
 *
 * The cleaner's own dialog (components/cleanup/ActivityLogDialog.jsx) exists to
 * WRITE entries; an officer must never be able to add to, edit or remove a
 * record they are supposed to be judging, so this is a separate component
 * rather than a mode of that one.
 *
 * Each entry answers: what was done, when, where (with distance from the site
 * where recorded), and optionally with what photographic support. During the
 * rework loop this diary is often the only account of what changed between two
 * completion submissions, which makes it primary evidence rather than a nicety.
 *
 * Presentational only - the page fetches via
 * municipalService.getAssignmentActivityLogs(assignmentId).
 * ============================================================================
 */

import { NotebookPen, MapPin, Ruler } from "lucide-react";
import BiText from "@/components/common/BiText";
import { CLEANUP_PROOF_RADIUS_METRES } from "@/constants/assignmentConstants";
import { buildMapsUrl, formatCoordinates, formatDateTime } from "@/utils/formatters";

export default function MunicipalActivityLogList({ logs = [], loading = false, error = "" }) {

    return (
        <section className="rounded-gov border border-rule bg-paper p-4 sm:p-5">

            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gov-navy">
                <NotebookPen className="h-4 w-4" aria-hidden="true" />
                <BiText en="Cleaner activity diary" hi="सफाई कर्मी गतिविधि डायरी" />
            </h3>

            {/* Makes the read-only nature of this view explicit to the officer */}
            <p className="mt-1 text-xs text-ink-muted">
                <BiText
                    en="Progress entries filed by the cleaner while working on site. This is a read-only record."
                    hi="स्थल पर कार्य के दौरान सफाई कर्मी द्वारा दर्ज प्रगति। यह केवल पढ़ने योग्य रिकॉर्ड है।"
                />
            </p>

            {loading ? (
                <p className="mt-4 text-sm text-ink-muted">Loading activity entries...</p>
            ) : error ? (
                <p className="mt-4 text-sm text-rose-700">{error}</p>
            ) : logs.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">
                    <BiText
                        en="The cleaner has not filed any activity entry for this cleanup yet."
                        hi="सफाई कर्मी ने इस सफाई के लिए अभी कोई प्रविष्टि दर्ज नहीं की है।"
                    />
                </p>
            ) : (
                <ol className="mt-4 space-y-3">
                    {logs.map((log) => {

                        // Distance is optional - a cleaner may log a note without location
                        const distance = log.distanceMeters;
                        const hasDistance = distance !== null && distance !== undefined;
                        const withinRadius = hasDistance && distance <= CLEANUP_PROOF_RADIUS_METRES;
                        const mapsUrl = buildMapsUrl(log.latitude, log.longitude);

                        return (
                            <li key={log.activityLogId} className="rounded-gov border border-rule bg-white p-3">

                                <div className="flex flex-wrap items-start justify-between gap-2">

                                    {/* The entry text itself, with the cleaner's own line breaks kept */}
                                    <p className="min-w-0 whitespace-pre-line text-sm text-ink">{log.description}</p>

                                    {/* When the work happened, not when the row was stored */}
                                    <p className="shrink-0 text-xs text-ink-muted">
                                        {log.activityAt ? formatDateTime(log.activityAt) : "-"}
                                    </p>
                                </div>

                                {/* Optional photograph attached to this entry */}
                                {log.imageUrl ? (
                                    <a
                                        href={log.imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-block overflow-hidden rounded-gov border border-rule"
                                    >
                                        <img
                                            src={log.imageUrl}
                                            alt="Activity entry photograph"
                                            loading="lazy"
                                            className="h-24 w-32 object-cover"
                                        />
                                    </a>
                                ) : null}

                                {/* Where it was recorded, measured against the same 50 m rule */}
                                {hasDistance || mapsUrl ? (
                                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                                        {hasDistance ? (
                                            <span
                                                className={`flex items-center gap-1.5 font-medium ${withinRadius ? "text-india-green" : "text-rose-700"}`}
                                            >
                                                <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                                                {Math.round(distance)} m from the site
                                            </span>
                                        ) : null}

                                        {mapsUrl ? (
                                            <a
                                                href={mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-gov-blue underline"
                                            >
                                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                                                {formatCoordinates(log.latitude, log.longitude)}
                                            </a>
                                        ) : null}
                                    </p>
                                ) : null}

                                {/* Author, kept last since a single assignment has one cleaner */}
                                {log.cleanerName ? (
                                    <p className="mt-1 text-xs text-ink-muted">Filed by {log.cleanerName}</p>
                                ) : null}
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}