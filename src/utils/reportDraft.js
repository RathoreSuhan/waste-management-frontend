/**
 * ============================================================================
 * Report Draft Store
 * ============================================================================
 *
 * Keeps a half-filled report form alive when the user navigates away and
 * comes back. The page unmounts on navigation, so React state alone is lost.
 *
 * Two different stores are needed because of one awkward constraint:
 *
 *   Text fields -> sessionStorage, so they also survive a page refresh.
 *   Photograph  -> a module-level variable, because a File object cannot be
 *                  serialised to JSON. Encoding it to base64 would also risk
 *                  blowing the ~5MB sessionStorage quota, since uploads are
 *                  allowed up to 10MB.
 *
 * The consequence is that the photograph survives route changes but not a
 * hard refresh, so the form tells the user when it needs re-attaching.
 * ============================================================================
 */

// sessionStorage key for the text portion of the draft
const DRAFT_KEY = "reportDraft";

/**
 * Selected photograph.
 *
 * Module scope means it lives as long as the tab does, which is exactly the
 * lifetime we want - longer than the component, shorter than the browser.
 */
let draftFile = null;

/**
 * Save the text fields of the form.
 */
export function saveDraftValues(values) {

    try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
        // Storage can be full or blocked in private mode. A lost draft is not
        // worth breaking the form over, so the failure is swallowed.
    }
}

/**
 * Read the saved text fields, or null when there is no usable draft.
 */
export function loadDraftValues() {

    try {
        const raw = sessionStorage.getItem(DRAFT_KEY);

        // Nothing saved yet
        if (!raw) {
            return null;
        }

        return JSON.parse(raw);

    } catch {
        // Corrupted JSON - treat it as no draft at all
        return null;
    }
}

/**
 * Store the chosen photograph for the lifetime of the tab.
 */
export function setDraftFile(file) {
    draftFile = file;
}

/**
 * Retrieve the previously chosen photograph.
 */
export function getDraftFile() {
    return draftFile;
}

/**
 * Discard the whole draft.
 *
 * Called after a successful submission and when the user cancels, so a
 * finished report never bleeds into the next one.
 */
export function clearDraft() {

    draftFile = null;

    try {
        sessionStorage.removeItem(DRAFT_KEY);
    } catch {
        // Nothing useful to do if removal fails
    }
}

/**
 * True when the saved draft contains at least one non-empty field.
 *
 * Used to decide whether the "draft restored" notice is worth showing -
 * an empty object would otherwise trigger it on a first visit.
 */
export function hasDraftContent(values) {

    if (!values) {
        return false;
    }

    return Object.values(values).some(
        (value) => typeof value === "string" && value.trim() !== ""
    );
}
