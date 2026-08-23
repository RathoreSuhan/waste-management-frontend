/**
 * ============================================================================
 * Cleanup Proposal Draft
 * ============================================================================
 *
 * A cleanup proposal is a long form: observations, method, waste plan, crew,
 * equipment. A cleaner filling it in on a phone at the waste site can easily
 * tap the sidebar or the browser Back gesture, which unmounts the page and
 * would otherwise throw away every answer.
 *
 * This module keeps the work-in-progress alive for the tab, in two stores
 * because they hold different kinds of value:
 *
 *   - typed answers  -> sessionStorage, so they also survive a refresh
 *   - photograph     -> a module variable, because a File cannot be turned
 *                       into JSON, and base64 of a camera photo would blow
 *                       past the ~5 MB sessionStorage quota
 *   - GPS reading    -> a module variable, kept beside the photograph so the
 *                       verified inspection is not lost either
 *
 * Drafts are keyed by assignment, so inspecting two different sites in the
 * same session never mixes one plan into the other.
 *
 * Each sessionStorage entry is an envelope, not the bare answers:
 *
 *   { values, site, savedAt }
 *
 * The extra two fields let My Proposals list an unfinished draft by site name
 * and say when it was last saved, instead of showing a bare assignment number.
 *
 * sessionStorage is deliberate: a draft belongs to one browsing session. Close
 * the tab or sign out and the unsubmitted plan is gone, which is what a shared
 * or borrowed phone requires.
 * ============================================================================
 */

// Shared by the single-draft key builder and the "list every draft" scan
const DRAFT_KEY_PREFIX = "proposalDraft:";

// Marks a draft that revises an ALREADY FILED proposal, not a new bid
const EDIT_DRAFT_PREFIX = "edit:";

/**
 * Draft id for revising a filed proposal.
 *
 * A revision is keyed by proposalId, not assignmentId: the same cleaner can be
 * revising one plan while drafting a fresh bid for another site, and the two
 * must never overwrite each other.
 *
 * @param {number|string} proposalId the proposal being revised
 * @returns {string} draft id understood by every function in this module
 */
export function proposalEditDraftId(proposalId) {
    return `${EDIT_DRAFT_PREFIX}${proposalId}`;
}

// One sessionStorage entry per assignment being proposed for
function draftKey(assignmentId) {
    return `${DRAFT_KEY_PREFIX}${assignmentId}`;
}

// Tab-lifetime stores for the values that cannot be serialised
let draftFiles = {};        // assignmentId -> File (inspection photograph)
let draftLocations = {};    // assignmentId -> { position, status, distanceMetres }

/**
 * Read the stored envelope for one assignment.
 *
 * Entries written before the envelope existed hold the answers directly, so
 * those are wrapped on the way out and keep working.
 */
function readDraftEnvelope(assignmentId) {

    try {

        const raw = sessionStorage.getItem(draftKey(assignmentId));

        if (!raw) {

            return null;

        }

        const parsed = JSON.parse(raw);

        // Envelope written by the current version
        if (parsed && parsed.values) {

            return parsed;

        }

        // Older entry: the object itself was the answers
        return { values: parsed, site: null, savedAt: null };

    } catch {

        return null; // corrupt entry is treated as no draft at all

    }

}

/**
 * Save the typed answers. Called on every change, so failures stay silent:
 * a full or blocked sessionStorage must never break form typing.
 *
 * `site` is optional. It is only known when the form was opened from the
 * available-tasks list, so an already stored site is kept rather than erased
 * when the page is opened directly and cannot supply it.
 */
export function saveProposalDraft(assignmentId, values, site) {

    try {

        const existing = readDraftEnvelope(assignmentId); // whatever was stored before

        sessionStorage.setItem(

            draftKey(assignmentId),

            JSON.stringify({
                values,
                site: site || existing?.site || null, // never lose a known site
                savedAt: new Date().toISOString(),    // powers "last saved" on My Proposals
            })

        );

    } catch {

        /* private mode or quota exceeded - the form still works */

    }

}

/**
 * Read the saved answers back, or null when there is nothing usable.
 */
export function loadProposalDraft(assignmentId) {

    return readDraftEnvelope(assignmentId)?.values || null;

}

/**
 * Every draft left unfinished in this session, newest save first.
 *
 * My Proposals uses this so a half-filled form is visible from the dashboard
 * instead of looking like nothing was ever started.
 */
export function listProposalDrafts() {

    const drafts = [];

    try {

        for (let index = 0; index < sessionStorage.length; index += 1) {

            const key = sessionStorage.key(index);

            if (!key || !key.startsWith(DRAFT_KEY_PREFIX)) {

                continue; // not ours

            }

            const assignmentId = key.slice(DRAFT_KEY_PREFIX.length);

            // Revision drafts belong to a proposal that is already filed, and
            // My Proposals lists it from the server - so it is not an
            // "unfinished new proposal" and must not appear twice.
            if (assignmentId.startsWith(EDIT_DRAFT_PREFIX)) {

                continue;

            }

            const envelope = readDraftEnvelope(assignmentId);

            // An empty or unreadable draft is not worth showing
            if (!envelope || !hasProposalDraftContent(envelope.values)) {

                continue;

            }

            drafts.push({
                assignmentId,
                values: envelope.values,
                site: envelope.site || null,
                savedAt: envelope.savedAt || null,
            });

        }

    } catch {

        return []; // storage unavailable, so there is nothing to resume

    }

    // Most recently touched draft first, entries without a timestamp last
    return drafts.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));

}

/**
 * Remember the chosen inspection photograph for this assignment.
 */
export function setProposalFile(assignmentId, file) {

    draftFiles[assignmentId] = file;

}

/**
 * The photograph chosen earlier, if the tab has not been reloaded since.
 */
export function getProposalFile(assignmentId) {

    return draftFiles[assignmentId] || null;

}

/**
 * Remember the verified GPS reading so a returning cleaner need not walk
 * back into range and capture the location a second time.
 */
export function setProposalLocation(assignmentId, location) {

    draftLocations[assignmentId] = location;

}

/**
 * The GPS reading captured earlier for this assignment, if any.
 */
export function getProposalLocation(assignmentId) {

    return draftLocations[assignmentId] || null;

}

/**
 * Drop the draft once it has been submitted, or deliberately abandoned.
 */
export function clearProposalDraft(assignmentId) {

    delete draftFiles[assignmentId];      // release the photograph

    delete draftLocations[assignmentId];  // release the GPS reading

    try {

        sessionStorage.removeItem(draftKey(assignmentId));

    } catch {

        /* nothing to clean up if storage is unavailable */

    }

}

/**
 * Drop every draft at once.
 *
 * Called on sign out: an unsubmitted plan is personal working material, so the
 * next person to use the device must not find it waiting on the screen.
 */
export function clearAllProposalDrafts() {

    draftFiles = {};      // release every held photograph

    draftLocations = {};  // release every held GPS reading

    try {

        // Keys are collected first, because removing while iterating shifts indexes
        const keys = [];

        for (let index = 0; index < sessionStorage.length; index += 1) {

            const key = sessionStorage.key(index);

            if (key && key.startsWith(DRAFT_KEY_PREFIX)) {

                keys.push(key);

            }

        }

        keys.forEach((key) => sessionStorage.removeItem(key));

    } catch {

        /* nothing to clean up if storage is unavailable */

    }

}

/**
 * Whether a restored draft actually carries typed work, so the page only
 * announces a restore when there is something worth mentioning.
 */
export function hasProposalDraftContent(values) {

    if (!values) {

        return false;

    }

    return Object.values(values).some(

        (value) => typeof value === "string" && value.trim() !== ""

    );

}

/**
 * How many answers a draft actually holds, so the draft card can show real
 * progress ("4 answers saved") instead of an unhelpful "in progress".
 */
export function countFilledDraftFields(values) {

    if (!values) {

        return 0;

    }

    return Object.values(values).filter(

        (value) => typeof value === "string" && value.trim() !== ""

    ).length;

}