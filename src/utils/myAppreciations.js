/**
 * ============================================================================
 * Appreciation Memory
 * ============================================================================
 *
 * Remembers which success stories this browser has already liked.
 *
 * POST /api/public-feed/{id}/like takes no user identity and performs no
 * de-duplication, and there is no endpoint to ask whether a story was
 * already liked. Without a local record the heart would reset on every
 * reload and the same visitor could raise the count endlessly just by
 * clicking again.
 *
 * Unlike vote memory this is not namespaced per account, because the
 * feed is public and most visitors are not signed in. It is a per-device
 * record rather than a per-person one.
 *
 * This is a courtesy guard, not a security control. It stops accidental
 * double-counting; it cannot stop anyone who clears storage or calls the
 * endpoint directly. Trustworthy totals need a uniqueness constraint on
 * the backend.
 * ============================================================================
 */

// Single device-wide key, since the feed has no signed-in identity
const STORAGE_KEY = "cb:myAppreciations";

/**
 * Read every remembered like.
 *
 * Any failure (private browsing, malformed data) degrades to "nothing
 * remembered" rather than breaking the page.
 *
 * @returns {string[]} report ids already liked
 */
function readAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);

        // Guard against an object or hand-edited value
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * Has this browser already liked the story?
 *
 * @param {number|string} reportId
 * @returns {boolean}
 */
export function hasLiked(reportId) {
    return readAll().includes(String(reportId));
}

/**
 * Remember a like that was just recorded.
 *
 * @param {number|string} reportId
 */
export function rememberLike(reportId) {
    try {
        const all = readAll();
        const key = String(reportId);

        // Keep the list free of duplicates
        if (!all.includes(key)) {
            all.push(key);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
        }
    } catch {
        // Storage unavailable or full - the like itself already succeeded,
        // so losing the local copy is not worth surfacing to the user.
    }
}
