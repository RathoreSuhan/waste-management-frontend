/**
 * ============================================================================
 * Comment Ownership Memory
 * ============================================================================
 *
 * The backend decides who may delete a comment, but it does not tell the
 * frontend who wrote one: CommentResponse carries only `userName`, and login
 * returns only an email and a role. There is therefore no reliable way to
 * match a comment to the signed-in user from the API alone.
 *
 * To keep the Delete action honest, the ids of comments created in this
 * browser are remembered here, namespaced per account so that switching
 * users on a shared machine never exposes someone else's actions.
 *
 * Limits worth knowing:
 * - a comment written on another device will not offer Delete here
 * - clearing site data forgets ownership
 *
 * Both are cosmetic. The backend remains the only authority, and a stale
 * entry simply results in a 403 that the UI reports plainly.
 *
 * The clean fix is a `userId` (or `isOwner`) field on CommentResponse, at
 * which point this whole module can be deleted.
 * ============================================================================
 */

/**
 * Storage key for one account.
 */
function storageKey(email) {
    return `cb:myComments:${email}`;
}

/**
 * Read the remembered comment ids of an account.
 *
 * Storage can throw (private browsing, disabled cookies) and may hold data
 * from an older version, so every failure degrades to "nothing remembered".
 *
 * @param {string} email - signed-in user's email
 * @returns {Set<number>} remembered comment ids
 */
export function getMyCommentIds(email) {
    if (!email) {
        return new Set();
    }

    try {
        const raw = localStorage.getItem(storageKey(email));

        if (!raw) {
            return new Set();
        }

        const parsed = JSON.parse(raw);

        // Guard against a malformed or hand-edited value
        if (!Array.isArray(parsed)) {
            return new Set();
        }

        return new Set(parsed);
    } catch {
        return new Set();
    }
}

/**
 * Persist a set of comment ids for an account.
 */
function save(email, ids) {
    try {
        localStorage.setItem(storageKey(email), JSON.stringify([...ids]));
    } catch {
        // Storage unavailable or full - ownership is a convenience, not a
        // requirement, so failing quietly is better than breaking the page.
    }
}

/**
 * Remember a comment the user just created.
 *
 * @param {string} email - signed-in user's email
 * @param {number} commentId - id returned by the backend
 */
export function rememberMyComment(email, commentId) {
    if (!email || commentId === undefined || commentId === null) {
        return;
    }

    const ids = getMyCommentIds(email);

    ids.add(commentId);

    save(email, ids);
}

/**
 * Forget a comment after it has been deleted.
 *
 * @param {string} email - signed-in user's email
 * @param {number} commentId - id of the removed comment
 */
export function forgetMyComment(email, commentId) {
    if (!email) {
        return;
    }

    const ids = getMyCommentIds(email);

    // Nothing to write when the id was never remembered
    if (!ids.delete(commentId)) {
        return;
    }

    save(email, ids);
}
