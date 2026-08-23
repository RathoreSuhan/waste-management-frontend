import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import {
    ArrowLeft,       // back to the task list
    NotebookPen,     // the diary itself
    MapPin,          // where it was recorded from
    Ruler,           // how far that was from the reported site
    ChevronDown,     // collapsed card
    ChevronUp,       // expanded card
    CalendarDays,    // when the entry was filed
    ImageIcon,       // an entry with no photograph
} from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Pagination from "@/components/common/Pagination";
import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import usePagination from "@/hooks/usePagination";
import { CLEANER_PAGE_SIZE } from "@/constants/paginationConstants";
import { getActivityLogs } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import { formatDistance } from "@/utils/geo";
import {
    buildMapsUrl,
    formatCoordinates,
    formatDateTime,
    formatRelativeTime,
} from "@/utils/formatters";

/**
 * ============================================================================
 * Cleanup Activity Log (cleaner, read-only)
 * ============================================================================
 *
 * Everything the cleaner has already recorded against one assignment, on a
 * page of its own.
 *
 * Why this exists
 * ---------------
 * The activity dialog on My Tasks used to do both jobs - list the history and
 * take the next entry. On a cleanup that ran over several visits the list grew
 * until the form it was meant to introduce sat below the fold, and a dialog is
 * the wrong place for a record that is read far more often than it is written.
 *
 * So the two are split. The dialog now only writes; this page only reads. Each
 * screen does one thing, and neither has to grow to accommodate the other.
 *
 * Oldest entry first
 * ------------------
 * Deliberately the opposite of every other listing in the portal. An activity
 * log is a narrative - what was cleared first, what was found underneath, what
 * was left for the next visit - and a narrative read backwards is nonsense.
 * The backend already returns the entries in this order; the sort below only
 * guarantees it.
 *
 * One entry open at a time
 * ------------------------
 * Cards are collapsed to their date and first lines. Opening one closes the
 * one before it, so the page keeps its shape however many entries there are,
 * and photographs are fetched only for the entry actually being read.
 *
 * Report context travels in router state, because the backend has no
 * GET /api/cleanup-assignments/{id} to look a title up with. On a cold reload
 * the state is gone and the page simply omits the site name rather than
 * failing - the entries themselves are what the cleaner came for.
 * ============================================================================
 */

/**
 * Sortable timestamp for one entry, oldest first.
 *
 * activityAt is what the cleaner said happened; createdAt is when the row was
 * filed. The first is the truth of the cleanup and the second is only a
 * fallback for an entry saved without a stated time.
 */
function activityOrder(entry) {

    const stated = entry.activityAt ? new Date(entry.activityAt).getTime() : Number.NaN;

    if (!Number.isNaN(stated)) {
        return stated;
    }

    const filed = entry.createdAt ? new Date(entry.createdAt).getTime() : Number.NaN;

    // Nothing usable - fall back to the id, which at least never reorders
    return Number.isNaN(filed) ? (entry.activityLogId ?? 0) : filed;
}

/**
 * The first line or so of an entry, for the collapsed card.
 *
 * Cut on a word boundary rather than mid-word, so the preview reads as a
 * sentence trailing off instead of a string that was chopped.
 */
function previewOf(description, limit = 110) {

    const text = (description ?? "").trim();

    if (text.length <= limit) {
        return text;
    }

    const cut = text.slice(0, limit);
    const lastSpace = cut.lastIndexOf(" ");

    return `${lastSpace > 40 ? cut.slice(0, lastSpace) : cut}…`;
}

/**
 * One labelled fact inside an expanded entry.
 */
function Fact({ icon: Icon, label, children }) {

    return (
        <div>
            <dt className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <Icon size={13} aria-hidden="true" />
                {label}
            </dt>
            <dd className="mt-1 text-sm text-ink">{children}</dd>
        </div>
    );
}

/**
 * One activity entry, collapsed or expanded.
 *
 * Purely presentational - which entry is open is decided by the page, so that
 * opening one can close another. A card cannot expand itself.
 */
function ActivityCard({ entry, index, expanded, onToggle }) {

    // Stable ids, so the header can point at the panel it controls
    const panelId = `activity-panel-${entry.activityLogId}`;
    const headerId = `activity-header-${entry.activityLogId}`;

    return (
        <article className="rounded-gov border border-rule bg-white">

            {/*
              The whole header is the control. A small chevron alone is a hard
              target on a phone held in a work glove, so the date, the number
              and the preview all toggle the card.
            */}
            <button
                type="button"
                id={headerId}
                onClick={() => onToggle(entry.activityLogId)}
                aria-expanded={expanded}
                aria-controls={panelId}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-paper"
            >
                <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

                        {/* Position in the trail, not the database id */}
                        <span className="rounded-gov bg-paper px-2 py-0.5 text-xs font-semibold text-gov-navy">
                            Entry {index}
                        </span>

                        <span className="text-sm font-semibold text-gov-navy">
                            {formatDateTime(entry.activityAt)}
                        </span>

                        {/* "3 days ago" - quicker to read than a date */}
                        <span className="text-xs text-ink-muted">
                            {formatRelativeTime(entry.activityAt)}
                        </span>
                    </div>

                    {/* Hidden once open, where the full text takes over */}
                    {!expanded && (
                        <p className="mt-1 text-sm text-ink-muted">
                            {previewOf(entry.description)}
                        </p>
                    )}
                </div>

                {/* Direction of travel, in case the hover state is unavailable */}
                <span className="mt-0.5 shrink-0 text-gov-blue" aria-hidden="true">
                    {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
            </button>

            {/*
              Unmounted rather than hidden while collapsed. It keeps the
              photograph off the wire until the entry is actually opened,
              which matters on a site connection.
            */}
            {expanded && (
                <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    className="border-t border-rule px-4 py-4"
                >

                    {/* What was done, exactly as it was written */}
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                        {entry.description}
                    </p>

                    {entry.imageUrl ? (
                        <img
                            src={entry.imageUrl}
                            alt={`Activity recorded on ${formatDateTime(entry.activityAt)}`}
                            loading="lazy"
                            className="mt-4 w-full rounded-gov border border-rule object-cover"
                        />
                    ) : (
                        /* Absence is stated, since a photograph was optional */
                        <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
                            <ImageIcon size={13} aria-hidden="true" />
                            No photograph was attached to this entry.
                        </p>
                    )}

                    <dl className="mt-4 grid gap-4 border-t border-rule pt-4 sm:grid-cols-2">

                        <Fact icon={CalendarDays} label="Recorded on">
                            {formatDateTime(entry.createdAt)}
                        </Fact>

                        {/*
                          Distance is the reason the entry counts as evidence
                          at all - it is measured against the reported site.
                        */}
                        {typeof entry.distanceMeters === "number" && (
                            <Fact icon={Ruler} label="From the reported site">
                                {formatDistance(entry.distanceMeters)}
                            </Fact>
                        )}

                        {entry.latitude != null && entry.longitude != null && (
                            <Fact icon={MapPin} label="Recorded at">
                                {formatCoordinates(entry.latitude, entry.longitude)}

                                {/* Opens in the reader's own map application */}
                                <a
                                    href={buildMapsUrl(entry.latitude, entry.longitude)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-2 font-semibold text-gov-blue hover:underline"
                                >
                                    View on map
                                </a>
                            </Fact>
                        )}

                        {entry.cleanerName && (
                            <Fact icon={NotebookPen} label="Recorded by">
                                {entry.cleanerName}
                            </Fact>
                        )}
                    </dl>
                </div>
            )}
        </article>
    );
}

export default function ActivityLogPage() {

    const { assignmentId } = useParams();

    /*
      Report context, when the cleaner arrived from a task card. Optional by
      design - see the banner above.
    */
    const location = useLocation();
    const reportTitle = location.state?.reportTitle ?? "";
    const reportId = location.state?.reportId ?? null;

    // Entries for this assignment, oldest first as the backend sends them
    const [entries, setEntries] = useState([]);

    // Starts true: the first paint is a load, never an empty log
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Bumped by Retry, which is all it takes to re-run the effect below
    const [reloadToken, setReloadToken] = useState(0);

    // The one entry currently open, by id. null means every card is collapsed.
    const [openId, setOpenId] = useState(null);

    useEffect(() => {

        let ignore = false;

        async function fetchEntries() {
            try {
                const data = await getActivityLogs(assignmentId);

                if (!ignore) {
                    setEntries(Array.isArray(data) ? data : []);
                    setError("");
                }
            } catch (requestError) {
                if (!ignore) {
                    setError(
                        getErrorMessage(
                            requestError,
                            "The activity log could not be opened. This task may no longer be assigned to you."
                        )
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        }

        fetchEntries();

        return () => {
            ignore = true;   // this render is over; drop whatever comes back
        };
    }, [assignmentId, reloadToken]);

    /* Retry is an event handler, so it is free to set state directly */
    function reload() {
        setLoading(true);
        setError("");
        setReloadToken((token) => token + 1);
    }

    /*
      Oldest first, guaranteed.

      getActivityLogs is documented as ascending and the backend orders it that
      way, but the reading order is the whole point of this page, so it is not
      left to a contract elsewhere. Sorted on a copy of the state array.
    */
    const orderedEntries = useMemo(
        () => [...entries].sort((a, b) => activityOrder(a) - activityOrder(b)),
        [entries]
    );

    /*
      Five entries to a page, oldest page first: page 1 is the beginning of the
      cleanup, the last page is where it stands now.
    */
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(orderedEntries, CLEANER_PAGE_SIZE);

    /**
     * Open one entry and close whichever was open.
     *
     * Clicking the entry that is already open collapses it, so the same
     * control both opens and closes - there is no separate close button to
     * hunt for at the bottom of a long entry.
     */
    function toggleEntry(activityLogId) {
        setOpenId((current) => (current === activityLogId ? null : activityLogId));
    }

    /*
      Collapse on paging.

      Without this the card at the same position on the next page would appear
      pre-opened, because the open entry is remembered by id and the id is
      gone from view. Every page therefore starts closed.
    */
    function handlePageChange(nextPage) {
        setOpenId(null);
        goToPage(nextPage);
    }

    return (
        <div>

            {/* Back to where the log was opened from */}
            <Link
                to="/cleaner/tasks"
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
            >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to My Tasks
            </Link>

            <PageHeading
                title="Activity Log"
                titleHi="गतिविधि विवरण"
                subtitle={
                    reportTitle
                        // Named when we know the site, so the page is not just an id
                        ? `Work you have recorded for "${reportTitle}", earliest entry first.`
                        : "Work you have recorded for this cleanup, earliest entry first."
                }
            />

            {/* First load */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Load failed outright */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {/*
              An empty log is not a fault. Activity entries were always
              optional, so this says so rather than apologising.
            */}
            {!loading && !error && total === 0 && (
                <ReportListEmpty
                    title="No activity recorded yet"
                    description="Activity entries are optional - a small cleanup can go straight to the final proof photograph. Use the Activity Log button on the task to record what you have done so far."
                    actionLabel="Back to My Tasks"
                    actionTo="/cleaner/tasks"
                />
            )}

            {!loading && !error && total > 0 && (
                <>
                    {/* Says plainly what the page is, and what it is not */}
                    <div className="mb-4">
                        <Alert type="info" title="Reading order">
                            Entries are shown oldest to newest, so the log reads as the
                            story of the cleanup. Select any entry to see the full text,
                            the photograph and where it was recorded from. This page is a
                            record only - new entries are added from the Activity Log
                            button on the task itself.
                        </Alert>
                    </div>

                    <div className="space-y-3">
                        {pageItems.map((entry, indexOnPage) => (
                            <ActivityCard
                                key={entry.activityLogId}
                                entry={entry}
                                // Numbered across the whole log, not per page
                                index={rangeStart + indexOnPage}
                                expanded={openId === entry.activityLogId}
                                onToggle={toggleEntry}
                            />
                        ))}
                    </div>

                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        // Wrapped, so changing page also collapses the open card
                        onPageChange={handlePageChange}
                        itemLabel="entries"
                    />

                    {/* The site itself, for the context the entries assume */}
                    {reportId && (
                        <div className="mt-6 border-t border-rule pt-4">
                            <Link
                                to={`/reports/${reportId}`}
                                className="text-sm font-semibold text-gov-blue hover:underline"
                            >
                                View the original report
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}