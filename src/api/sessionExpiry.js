/**
 * ============================================================================
 * Session Expiry Signal
 * ============================================================================
 *
 * Lets the Axios layer announce that the stored session is no longer accepted,
 * and lets React listen for it.
 *
 * The response interceptor is where a rejected token is first seen, but it is
 * a plain module: it has no hooks, so it cannot clear AuthContext, and no
 * router, so it cannot navigate. Before this existed it did the only thing it
 * could - empty localStorage - and the application carried on believing
 * somebody was signed in, still showing their role and a Sign Out button while
 * every authenticated request failed.
 *
 * A window event would have worked too. A module-level Set is used instead
 * because both ends are inside this bundle: it needs no event name that could
 * collide, nothing outside the app can raise it, and it works in a test
 * environment with no DOM.
 *
 * The module also holds the note the sign-in form reads to explain itself -
 * see recordSessionExpiryNotice below for why that does not travel in router
 * state.
 * ============================================================================
 */

const listeners = new Set();

/*
  What the last refused session was doing when it was refused, waiting to be
  read by the sign-in form.

  Kept here rather than carried in router state, because the redirect to
  /login is not always ours to make. On a protected page the cleared session
  makes ProtectedRoute redirect too, and its navigation - which carries no
  state - can be the one that lands. Verified: from /app/reports/trending the
  form arrived with the state stripped and explained nothing. A fact recorded
  beside the signal survives whichever guard gets there first.

  Exposed as a subscribable store rather than something the form copies into
  state on mount: the form reads it during render through useSyncExternalStore,
  so there is no render-then-correct flicker, and a session refused while the
  form is already open still shows the note.
*/
let pendingNotice = null;

const noticeListeners = new Set();

function emitNoticeChange() {

    for (const listener of [...noticeListeners]) {
        listener();
    }
}

/**
 * Note that a session was refused, and what it was doing.
 *
 * @param {{ from?: string }} notice
 */
export function recordSessionExpiryNotice(notice) {

    pendingNotice = notice;

    emitNoticeChange();
}

/**
 * Drop the note once it has served its purpose.
 *
 * Called when somebody signs in successfully: from then on the sign-out was
 * history, and a later visit to the form - a deliberate sign-out, say - must
 * not be told a session expired.
 */
export function clearSessionExpiryNotice() {

    /*
      Nothing to announce when there was nothing there. Guarding this keeps a
      subscriber from re-rendering for a clear that changed nothing.
    */
    if (!pendingNotice) {
        return;
    }

    pendingNotice = null;

    emitNoticeChange();
}

/**
 * The current note, or null.
 *
 * Stable between changes - the same object is handed back every time, which is
 * what useSyncExternalStore needs to avoid re-rendering forever.
 *
 * @returns {{ from?: string } | null}
 */
export function getSessionExpiryNotice() {
    return pendingNotice;
}

/**
 * Watch the note for changes.
 *
 * @param {() => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribeSessionExpiryNotice(listener) {

    noticeListeners.add(listener);

    return () => {
        noticeListeners.delete(listener);
    };
}

/**
 * Register interest in the session ending.
 *
 * @param {() => void} listener called once each time a session is rejected
 * @returns {() => void} unsubscribe, for an effect's cleanup
 */
export function onSessionExpired(listener) {

    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
}

/**
 * Announce that the stored session has been refused.
 *
 * Called by the Axios response interceptor only, after it has cleared the
 * stored credentials.
 */
export function notifySessionExpired() {

    /*
      Copied before iterating: a listener is free to unsubscribe while it
      runs, and removing from the Set being walked would skip the next one.
    */
    for (const listener of [...listeners]) {
        try {
            listener();
        } catch {
            /*
              One broken listener must not stop the others, and must not turn
              into a second rejection on top of the request that failed.
            */
        }
    }
}
