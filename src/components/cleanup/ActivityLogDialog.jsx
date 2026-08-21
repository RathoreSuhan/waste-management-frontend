import { useEffect, useMemo, useState } from "react";
import {
    X,
    NotebookPen,
    Plus,
    Trash2,
    MapPin,
    Crosshair,
    Clock,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Textarea from "@/components/ui/Textarea";
import ImageUploadField from "@/components/reports/ImageUploadField";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import useGeoLocation from "@/hooks/useGeoLocation";
import {
    addActivityLog,
    deleteActivityLog,
    getActivityLogs,
} from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import { formatCoordinates, formatDateTime } from "@/utils/formatters";
import { formatDistance } from "@/utils/geo";
import {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    MAX_IMAGE_SIZE_LABEL,
} from "@/constants/reportConstants";

/**
 * ============================================================================
 * Activity Log Dialog (Task 4)
 * ============================================================================
 *
 * The cleaner's optional work diary for a cleanup that is under way.
 *
 * Large sites are not cleared in one visit, and the Municipal Corporation
 * reviewing the final proof has no way of knowing what happened in between.
 * Entries fill that gap: a line of text, when it happened, and optionally a
 * photograph or a position.
 *
 * Optional is the operative word. Nothing here gates the final proof upload,
 * so a bin cleared in twenty minutes never needs an entry. The dialog says so
 * explicitly rather than leaving the cleaner guessing.
 *
 * Because entries can be back-dated, a multi-day cleanup can be written up
 * from memory at the end of the day - the date-time field is the only thing
 * needed to keep the timeline honest, and the backend defaults it to now when
 * it is left blank.
 *
 * Note that entry coordinates are recorded but never enforced: only starting
 * the cleanup and submitting the final proof apply the 50 m rule.
 * ============================================================================
 */

export default function ActivityLogDialog({
    assignment,
    onClose,
    onChanged,
    canEdit = true,        // False once the cleanup has left IN_PROGRESS
}) {

    // Entries already recorded against this assignment, oldest first
    const [entries, setEntries] = useState([]);

    // True until the first load settles
    const [loading, setLoading] = useState(true);

    // Failure while reading the diary, kept apart from write failures
    const [loadError, setLoadError] = useState("");

    // ---- Add-entry form state ----

    // What was done - the only mandatory field
    const [description, setDescription] = useState("");

    // Validation message for the description
    const [descriptionError, setDescriptionError] = useState("");

    // Optional "when", as a datetime-local string ("2026-08-19T14:30")
    const [activityAt, setActivityAt] = useState("");

    // Optional photograph for this entry
    const [file, setFile] = useState(null);

    // Validation message for the photograph
    const [fileError, setFileError] = useState("");

    // Optional device reading attached to this entry
    const [position, setPosition] = useState(null);

    // True while an entry is being saved
    const [saving, setSaving] = useState(false);

    // Failure from the save request
    const [saveError, setSaveError] = useState("");

    // Id of the entry currently being removed, so only its button spins
    const [deletingId, setDeletingId] = useState(null);

    // Browser geolocation plumbing, shared with the other cleanup dialogs
    const {
        detecting,
        locationError,
        detectLocation,
        clearLocationError,
    } = useGeoLocation();

    /*
      Escape and the scroll lock come from useModalBehaviour. Escape is
      ignored during a write so a stray keypress cannot hide its outcome.
    */
    const panelRef = useModalBehaviour(true, onClose, {
        closeOnEscape: !saving && deletingId === null,
    });

    // Upper bound for the date-time field: work cannot be logged in the future
    const nowLocalValue = useMemo(() => toLocalInputValue(new Date()), []);

    /**
     * Load the diary once per assignment.
     *
     * Entries are held locally afterwards and patched from each write
     * response, which keeps the dialog responsive without re-fetching.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        getActivityLogs(assignment.assignmentId)
            .then((data) => {
                if (!ignore) {
                    setEntries(data);
                    setLoadError("");
                }
            })
            .catch((requestError) => {
                if (!ignore) {
                    setLoadError(
                        getErrorMessage(
                            requestError,
                            "The activity entries could not be loaded."
                        )
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
    }, [assignment.assignmentId]);

    /**
     * Attach the cleaner's current position to the entry being written.
     *
     * Purely descriptive - a reading far from the site is still accepted,
     * since useful work (a disposal run, for instance) happens elsewhere.
     */
    async function handleCapturePosition() {
        clearLocationError();

        const captured = await detectLocation();

        // A failed read leaves any previous reading alone
        if (captured) {
            setPosition(captured);
            setSaveError("");
        }
    }

    /**
     * Validate the optional photograph, mirroring the backend limits.
     */
    function validateFile(selected) {

        // No photograph is a perfectly valid entry
        if (!selected) {
            return "";
        }

        if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
            return "Only JPG, PNG or WEBP photographs are accepted.";
        }

        if (selected.size > MAX_IMAGE_SIZE_BYTES) {
            return `The photograph must be smaller than ${MAX_IMAGE_SIZE_LABEL}.`;
        }

        return "";
    }

    /**
     * Store the selection and clear any stale validation message.
     */
    function handleFileChange(selected) {
        setFile(selected);
        setFileError("");
        setSaveError("");
    }

    /**
     * Return the form to its empty state after a successful save.
     */
    function resetForm() {
        setDescription("");
        setDescriptionError("");
        setActivityAt("");
        setFile(null);
        setFileError("");

        // The next entry gets its own reading rather than inheriting this one
        setPosition(null);
    }

    /**
     * Save one activity entry.
     */
    async function handleSubmit(event) {
        event.preventDefault();

        const trimmed = description.trim();

        // The description carries the whole meaning of an entry
        if (!trimmed) {
            setDescriptionError("Describe what was done.");
            return;
        }

        if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
            setDescriptionError(
                `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`
            );
            return;
        }

        const fileMessage = validateFile(file);

        if (fileMessage) {
            setFileError(fileMessage);
            return;
        }

        setSaving(true);
        setSaveError("");

        try {
            const created = await addActivityLog(
                assignment.assignmentId,
                {
                    description: trimmed,
                    activityAt,                       // Blank means "now"
                    latitude: position?.latitude,     // Optional, never enforced
                    longitude: position?.longitude,
                },
                file                                  // Optional photograph
            );

            // Appended rather than re-fetched: the list is already ordered
            setEntries((current) => [...current, created]);

            resetForm();

            // Keeps the entry count on the task card honest
            onChanged?.();
        } catch (requestError) {
            setSaveError(
                getErrorMessage(
                    requestError,
                    "The activity entry could not be saved."
                )
            );
        } finally {
            setSaving(false);
        }
    }

    /**
     * Remove one of the cleaner's own entries.
     *
     * Kept simple deliberately: an entry is a note, not evidence the
     * municipality has acted on, and the backend allows removal only while
     * the cleanup is still in progress.
     */
    async function handleDelete(activityLogId) {
        setDeletingId(activityLogId);
        setSaveError("");

        try {
            await deleteActivityLog(activityLogId);

            // Drop it locally instead of reloading the whole diary
            setEntries((current) =>
                current.filter((entry) => entry.activityLogId !== activityLogId)
            );

            onChanged?.();
        } catch (requestError) {
            setSaveError(
                getErrorMessage(
                    requestError,
                    "The activity entry could not be removed."
                )
            );
        } finally {
            setDeletingId(null);
        }
    }

    // Live counter, so the 1000-character ceiling is never a surprise
    const remaining = MAX_DESCRIPTION_LENGTH - description.length;

    return (
        <div
            // Dim the page: the diary is a focused, single-task view
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
        >
            {/*
              role="dialog" belongs on the box, not on the backdrop above:
              the backdrop is the dimming layer, not the dialog itself.
            */}
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="activity-log-title"
                // my-4 on a phone: my-8 wastes screen a small viewport needs
                className="my-4 w-full max-w-2xl rounded-gov border border-rule bg-white shadow-lg outline-none sm:my-8"
            >

                {/* ---------------- Header ---------------- */}
                <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">

                    <div className="min-w-0">
                        <h2
                            id="activity-log-title"
                            className="flex items-center gap-2 font-serif text-lg font-bold text-gov-navy"
                        >
                            <NotebookPen size={18} aria-hidden="true" />
                            Cleanup Activity Log
                        </h2>

                        {/* Which task this diary belongs to */}
                        <p className="mt-0.5 truncate text-sm text-ink-muted">
                            {assignment.reportTitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        // Blocked mid-write so the outcome is not hidden
                        disabled={saving || deletingId !== null}
                        // p-2 rather than p-1: a 16px hit area is not usable on a phone
                        className="shrink-0 rounded-gov p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-5 px-5 py-5">

                    {/* States plainly that the diary is never mandatory */}
                    <Alert type="info" title="Optional record">
                        Activity entries are optional. They are useful when a
                        cleanup runs across several visits or days, so the
                        Municipal Corporation can see how the work progressed.
                        A small cleanup can go straight to the final proof
                        photograph without any entries.
                    </Alert>

                    {/* ---------------- Existing entries ---------------- */}
                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-ink">
                            Recorded Activity
                            {/* Count is meaningful only once loading finishes */}
                            {!loading && entries.length > 0 && (
                                <span className="ml-1 font-normal text-ink-muted">
                                    ({entries.length})
                                </span>
                            )}
                        </h3>

                        {loading && (
                            <p className="text-sm text-ink-muted">
                                Loading activity entries…
                            </p>
                        )}

                        {!loading && loadError && (
                            <Alert type="error">{loadError}</Alert>
                        )}

                        {/* An empty diary is normal, not an error */}
                        {!loading && !loadError && entries.length === 0 && (
                            <p className="rounded-gov border border-dashed border-rule bg-paper px-4 py-3 text-sm text-ink-muted">
                                No activity recorded yet.
                            </p>
                        )}

                        {!loading && !loadError && entries.length > 0 && (
                            <ol className="space-y-3">
                                {entries.map((entry) => (
                                    <ActivityEntry
                                        key={entry.activityLogId}
                                        entry={entry}
                                        canEdit={canEdit}
                                        deleting={deletingId === entry.activityLogId}
                                        // One write at a time keeps the list truthful
                                        disabled={saving || deletingId !== null}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </ol>
                        )}
                    </section>

                    {/* ---------------- Add entry ---------------- */}
                    {canEdit && (
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4 border-t border-rule pt-5"
                        >
                            <h3 className="text-sm font-semibold text-ink">
                                Add an Entry
                            </h3>

                            <Textarea
                                label="What was done"
                                required
                                rows={3}
                                value={description}
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                placeholder="e.g. Cleared plastic waste from the eastern footpath and bagged it for collection."
                                onChange={(event) => {
                                    setDescription(event.target.value);

                                    // The old complaint no longer applies
                                    setDescriptionError("");
                                }}
                                // Textarea reads error.message, so wrap the string
                                error={
                                    descriptionError
                                        ? { message: descriptionError }
                                        : undefined
                                }
                                disabled={saving}
                            />

                            {/* Only shown near the ceiling, to avoid noise */}
                            {remaining <= 200 && (
                                <p className="text-xs text-ink-muted">
                                    {remaining} characters remaining.
                                </p>
                            )}

                            {/* Back-dating is what makes multi-day diaries work */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="activity-at"
                                    className="block text-sm font-semibold text-ink"
                                >
                                    When did this happen?
                                </label>

                                <p className="text-xs text-ink-muted">
                                    Optional. Leave blank to record the current
                                    date and time.
                                </p>

                                <input
                                    id="activity-at"
                                    type="datetime-local"
                                    value={activityAt}
                                    max={nowLocalValue}   // Work cannot be logged ahead of time
                                    onChange={(event) =>
                                        setActivityAt(event.target.value)
                                    }
                                    disabled={saving}
                                    className="w-full rounded-gov border border-rule bg-white px-3 py-2 text-sm outline-none transition focus:border-gov-blue disabled:opacity-60 sm:w-auto"
                                />
                            </div>

                            {/* Optional photograph - no AI verification here */}
                            <div>
                                <ImageUploadField
                                    file={file}
                                    onFileChange={handleFileChange}
                                    error={fileError}
                                />

                                <p className="mt-1 text-xs text-ink-muted">
                                    Optional. Entry photographs are stored as a
                                    record of progress and are not checked by AI.
                                </p>
                            </div>

                            {/* Optional coordinates, recorded as-is */}
                            <div className="rounded-gov border border-rule bg-paper px-4 py-3">
                                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                    <MapPin size={15} aria-hidden="true" />
                                    Position
                                </p>

                                <p className="mt-0.5 text-xs text-ink-muted">
                                    Optional. Attaching a reading shows where the
                                    work was carried out.
                                </p>

                                {/* Confirms exactly what will be sent */}
                                {position && (
                                    <p className="mt-2 text-sm text-ink">
                                        {formatCoordinates(
                                            position.latitude,
                                            position.longitude
                                        )}
                                    </p>
                                )}

                                {/* Denied permission or an unavailable device */}
                                {locationError && (
                                    <p className="mt-2 text-xs font-medium text-red-700">
                                        {locationError}
                                    </p>
                                )}

                                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleCapturePosition}
                                        loading={detecting}
                                        disabled={saving}
                                    >
                                        <Crosshair size={15} aria-hidden="true" />
                                        {position
                                            ? "Update Position"
                                            : "Attach My Position"}
                                    </Button>

                                    {/* Escape hatch: an attached reading can be dropped */}
                                    {position && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => setPosition(null)}
                                            disabled={saving}
                                        >
                                            Remove Position
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Write failure, distinct from the load failure above */}
                            {saveError && <Alert type="error">{saveError}</Alert>}

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button type="submit" loading={saving}>
                                    <Plus size={15} aria-hidden="true" />
                                    Add Entry
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                    disabled={saving || deletingId !== null}
                                >
                                    Close
                                </Button>
                            </div>
                        </form>
                    )}

                    {/*
                      Once the proof has been submitted the diary is read-only:
                      the municipality is reviewing exactly what is shown here.
                    */}
                    {!canEdit && (
                        <div className="border-t border-rule pt-5">
                            <Alert type="info">
                                This cleanup is no longer in progress, so entries
                                can no longer be added or removed.
                            </Alert>

                            <div className="mt-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * ----------------------------------------------------------
 * Activity Entry
 * ----------------------------------------------------------
 * One line of the diary: what happened, when, and whatever
 * evidence the cleaner chose to attach.
 * ----------------------------------------------------------
 */
function ActivityEntry({ entry, canEdit, deleting, disabled, onDelete }) {

    return (
        <li className="rounded-gov border border-rule bg-white px-4 py-3">

            <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">
                    {/* When comes first: the timeline is the point of the diary */}
                    <p className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                        <Clock size={13} aria-hidden="true" />
                        {formatDateTime(entry.activityAt)}
                    </p>

                    {/* whitespace-pre-line keeps the cleaner's own line breaks */}
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">
                        {entry.description}
                    </p>
                </div>

                {/* Removal is offered only while the cleanup is in progress */}
                {canEdit && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onDelete(entry.activityLogId)}
                        loading={deleting}
                        // Blocked while any other write is in flight
                        disabled={disabled && !deleting}
                        // An icon action must not stretch across the entry
                        fullWidth={false}
                        aria-label="Delete this activity entry"
                        className="shrink-0"
                    >
                        <Trash2 size={14} aria-hidden="true" />
                    </Button>
                )}
            </div>

            {/* Optional progress photograph */}
            {entry.imageUrl && (
                <img
                    src={entry.imageUrl}
                    alt="Photograph attached to this activity entry"
                    className="mt-3 h-40 w-full rounded-gov border border-rule object-cover"
                />
            )}

            {/* Optional position, with the measured distance when available */}
            {entry.latitude !== null && entry.latitude !== undefined && (
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
                    <MapPin size={13} aria-hidden="true" />

                    {formatCoordinates(entry.latitude, entry.longitude)}

                    {/* Informational only - entries are never rejected on distance */}
                    {entry.distanceMeters !== null &&
                        entry.distanceMeters !== undefined && (
                            <span>
                                • {formatDistance(entry.distanceMeters)} from the
                                reported site
                            </span>
                        )}
                </p>
            )}
        </li>
    );
}

/**
 * Mirrors the backend @Size(max = 1000) on the description column, so an
 * over-long entry is refused before the request is made.
 */
const MAX_DESCRIPTION_LENGTH = 1000;

/**
 * Convert a Date into the value format a datetime-local input expects.
 *
 * toISOString() would shift the reading into UTC and show the cleaner a time
 * they did not work, so the timezone offset is removed first.
 *
 * @param {Date} date
 * @returns {string} e.g. "2026-08-19T14:30"
 */
function toLocalInputValue(date) {
    const offsetMs = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}