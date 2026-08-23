import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    X,
    NotebookPen,
    Plus,
    MapPin,
    Crosshair,
    History,        // the record kept on its own page
    ArrowRight,     // leaving the dialog for that page
} from "lucide-react";

import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Textarea from "@/components/ui/Textarea";
import ImageUploadField from "@/components/reports/ImageUploadField";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import useGeoLocation from "@/hooks/useGeoLocation";
import { addActivityLog } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import { formatCoordinates } from "@/utils/formatters";
import {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    MAX_IMAGE_SIZE_LABEL,
} from "@/constants/reportConstants";

/**
 * ============================================================================
 * Activity Log Dialog — writing only
 * ============================================================================
 *
 * Records one entry in the cleaner's optional work diary for a cleanup that is
 * under way.
 *
 * Large sites are not cleared in one visit, and the Municipal Corporation
 * reviewing the final proof has no way of knowing what happened in between.
 * Entries fill that gap: a line of text, when it happened, and optionally a
 * photograph or a position.
 *
 * Why this dialog no longer lists anything
 * ----------------------------------------
 * It used to do both jobs - show every entry recorded so far and take the next
 * one. On a cleanup that ran across several visits the list grew until the
 * form it was meant to introduce sat below the fold, and each entry carried a
 * delete button that had to be locked while any other write was in flight.
 * One dialog, two concerns, and a lot of state holding them apart.
 *
 * The record now lives on its own page - /cleaner/tasks/:assignmentId/activity
 * - which can afford to page through the entries and expand them. This dialog
 * keeps the single job it is opened for: write the next entry. A link at the
 * top leads to the record for anyone who came here to read it.
 *
 * Optional is still the operative word. Nothing here gates the final proof
 * upload, so a bin cleared in twenty minutes never needs an entry. The dialog
 * says so explicitly rather than leaving the cleaner guessing.
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

    /*
      How many entries this sitting has added.

      With the list gone, a saved entry no longer appears anywhere in the
      dialog, so the form would otherwise just empty itself and say nothing.
      This drives an explicit confirmation instead.
    */
    const [savedCount, setSavedCount] = useState(0);

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
        closeOnEscape: !saving,
    });

    // Upper bound for the date-time field: work cannot be logged in the future
    const nowLocalValue = useMemo(() => toLocalInputValue(new Date()), []);

    /*
      Entries on record, counting what this sitting has just added.

      activityLogCount comes from the task listing and is only refreshed when
      the parent re-fetches, so the local additions are added on top to keep
      the number honest while the dialog stays open.
    */
    const recordedCount = (assignment.activityLogCount ?? 0) + savedCount;

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
            // The saved entry is not held here any more - the record page reads it
            await addActivityLog(
                assignment.assignmentId,
                {
                    description: trimmed,
                    activityAt,                       // Blank means "now"
                    latitude: position?.latitude,     // Optional, never enforced
                    longitude: position?.longitude,
                },
                file                                  // Optional photograph
            );

            resetForm();

            // Drives the confirmation, since nothing is listed here
            setSavedCount((count) => count + 1);

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
                            Record Cleanup Activity
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
                        disabled={saving}
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

                    {/*
                      The way through to the record.

                      This dialog writes; the page reads. Whoever opened the
                      Activity Log to check what was already recorded needs one
                      obvious way out to it, and this is it.
                    */}
                    <div className="flex flex-col gap-2 rounded-gov border border-rule bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                        <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                                <History size={15} aria-hidden="true" />
                                Already recorded
                            </p>

                            <p className="mt-0.5 text-xs text-ink-muted">
                                {recordedCount === 0
                                    // An empty diary is normal, not a warning
                                    ? "Nothing has been recorded for this cleanup yet."
                                    : `${recordedCount} ${recordedCount === 1 ? "entry" : "entries"} on record, earliest first.`}
                            </p>
                        </div>

                        <Link
                            to={`/cleaner/tasks/${assignment.assignmentId}/activity`}
                            // The record page has no way to look a report up by id
                            state={{
                                reportTitle: assignment.reportTitle,
                                reportId: assignment.reportId,
                            }}
                            // Closes the dialog as well, so the parent is not left holding it open
                            onClick={onClose}
                            /*
                              Neutralised mid-save. Navigating away during a
                              write would abandon the entry being submitted.
                            */
                            aria-disabled={saving}
                            tabIndex={saving ? -1 : undefined}
                            className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline ${saving ? "pointer-events-none opacity-50" : ""}`}
                        >
                            View Activity Log
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </div>

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

                            {/*
                              Confirmation of the write.

                              The entry is not shown here any longer, so it is
                              stated instead - with the way to go and read it.
                            */}
                            {savedCount > 0 && !saving && !saveError && (
                                <Alert type="success" title="Entry recorded">
                                    {savedCount === 1
                                        ? "Your entry has been added to the activity log."
                                        : `${savedCount} entries have been added to the activity log.`}
                                    {" "}
                                    Add another below, or open the activity log to
                                    read the full record.
                                </Alert>
                            )}

                            {/* Write failure, kept next to the button that caused it */}
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
                                    disabled={saving}
                                >
                                    Close
                                </Button>
                            </div>
                        </form>
                    )}

                    {/*
                      Once the proof has been submitted the diary is closed:
                      the municipality is reviewing exactly what is on record.
                    */}
                    {!canEdit && (
                        <div className="border-t border-rule pt-5">
                            <Alert type="info">
                                This cleanup is no longer in progress, so entries
                                can no longer be added. The record itself remains
                                available to read.
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