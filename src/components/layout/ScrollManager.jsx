import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * ============================================================================
 * Scroll Manager
 * ============================================================================
 *
 * Decides where the window sits after every navigation.
 *
 * Two rules, and they are opposites:
 *
 *   Forward - clicking any link, or a navigate() call - starts the new
 *   page at the top. A report opened from halfway down a list should
 *   begin at its title, not at whatever happened to be at that height.
 *
 *   Back - the browser's back button, a swipe, Alt+Left - returns to the
 *   exact offset that entry was left at. Someone eight reports into a
 *   list who opens one and comes back expects to find their place, not
 *   to start the scroll again.
 *
 * Mounted once inside the router, so it covers every Link, NavLink and
 * programmatic navigation in the project at once. Nothing has to opt in.
 *
 * Why this rather than React Router's own <ScrollRestoration>: that
 * component only works under a data router (createBrowserRouter). This
 * project uses <BrowserRouter> with a plain <Routes> tree, where it is
 * unavailable.
 * ============================================================================
 */

/*
  Offsets, keyed by history entry.

  location.key is unique per entry, so the same URL visited twice is two
  separate positions - which is right, since they are two separate
  moments in the history stack.

  Deliberately a module-level Map rather than sessionStorage: these
  positions describe one page-load's history stack, and a reload starts
  a new one. Persisting them would restore offsets for entries that no
  longer exist.
*/
const scrollPositions = new Map();

/*
  How long to keep trying to restore a position.

  Every list on this site fetches after mount, so at the moment we are
  asked to restore, the document is usually still short - a skeleton or
  an empty shell. Scrolling to 2400px on a 900px document silently
  clamps to the bottom and the reader lands in the wrong place.

  So restoration is retried across a short window while the content
  arrives, and gives up quietly if it never grows enough.
*/
const RESTORE_TIMEOUT_MS = 1200;

export default function ScrollManager() {

    const location = useLocation();

    /*
      PUSH and REPLACE are forward moves; POP is the back/forward button
      - including a POP that moves forward again, which should also be
      restored rather than reset.
    */
    const navigationType = useNavigationType();

    // The entry we are currently on, so the scroll listener knows what to record
    const currentKey = useRef(location.key);

    // Cancels an in-flight restore when the reader navigates again mid-retry
    const restoreFrame = useRef(null);

    /**
     * Record the offset of whichever entry is on screen.
     *
     * Throttled to one write per frame: a scroll event can fire dozens
     * of times a second and there is no point recording more often than
     * the browser can paint.
     */
    useEffect(() => {

        /*
          Take over from the browser.

          Chrome and Firefox restore scroll themselves on POP, on their
          own schedule, which lands at the wrong offset on pages whose
          content has not arrived yet - and then fights our correction.
          Turning it off makes this component the only thing moving the
          window.
        */
        const previousBehaviour = window.history.scrollRestoration;

        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }

        let ticking = false;

        function recordPosition() {

            if (ticking) {
                return;
            }

            ticking = true;

            window.requestAnimationFrame(() => {
                scrollPositions.set(currentKey.current, window.scrollY);
                ticking = false;
            });
        }

        window.addEventListener("scroll", recordPosition, { passive: true });

        return () => {
            window.removeEventListener("scroll", recordPosition);

            // Leave the browser as we found it
            if ("scrollRestoration" in window.history) {
                window.history.scrollRestoration = previousBehaviour;
            }
        };
    }, []);

    /**
     * Move the window after the route changes.
     *
     * useLayoutEffect so the jump happens before the browser paints -
     * with a plain useEffect the reader sees the new page at the old
     * offset for a frame, then watches it snap.
     */
    useLayoutEffect(() => {

        /*
          The outgoing entry's position, captured before the key changes.

          The scroll listener has been keeping this up to date all along;
          this last write covers the case where the reader clicked
          without scrolling since the previous frame.
        */
        const leavingKey = currentKey.current;

        if (leavingKey !== location.key) {
            scrollPositions.set(leavingKey, window.scrollY);
            currentKey.current = location.key;
        }

        // A restore from the previous navigation is no longer wanted
        if (restoreFrame.current) {
            window.cancelAnimationFrame(restoreFrame.current);
            restoreFrame.current = null;
        }

        /*
          An in-page anchor wins over both rules. The header's "skip to
          content" link and any #hash in a URL are explicit requests for
          a particular place on the page.
        */
        if (location.hash) {

            /*
              Aiming at an anchor has the same problem as restoring an
              offset, so it gets the same treatment.

              A single scrollIntoView on arrival is only correct when the
              whole page is already laid out. Coming from another route
              it usually is not: the landing page mounts bands that fetch
              their own data, and each one that arrives afterwards is
              taller than the nothing it replaced. The reader is left
              some way above the section they asked for, having watched
              it slide past.

              So retry until the anchor stops moving - once it is present
              and nothing grew during a frame, the position is final.
              RESTORE_TIMEOUT_MS caps it, in case something on the page
              never stops changing size.

              An arrow rather than a declaration because this sits inside
              a block, where a hoisted function is a lint error.
            */
            const deadline = Date.now() + RESTORE_TIMEOUT_MS;

            let lastHeight = -1;
            let found = false;

            const attemptAnchor = () => {

                const target = document.querySelector(location.hash);
                const height = document.documentElement.scrollHeight;

                if (target) {
                    found = true;
                    target.scrollIntoView();

                    // Anchor present and the page held still - we are there
                    if (height === lastHeight) {
                        restoreFrame.current = null;
                        return;
                    }
                }

                lastHeight = height;

                if (Date.now() < deadline) {
                    restoreFrame.current =
                        window.requestAnimationFrame(attemptAnchor);
                    return;
                }

                restoreFrame.current = null;

                /*
                  The anchor never appeared - a stale or mistyped hash.
                  The window is still sitting at the previous route's
                  offset, which belongs to a page that is no longer on
                  screen, so treat it as an ordinary forward navigation.
                */
                if (!found && navigationType !== "POP") {
                    window.scrollTo(0, 0);
                }
            };

            attemptAnchor();
            return;
        }

        // Forward: always start at the top
        if (navigationType !== "POP") {
            window.scrollTo(0, 0);
            return;
        }

        // Back or forward through history: put them back where they were
        const savedOffset = scrollPositions.get(location.key);

        if (!savedOffset) {

            /*
              Either a genuinely unvisited entry, or one left at the very
              top. Both want the same thing.
            */
            window.scrollTo(0, 0);
            return;
        }

        const deadline = Date.now() + RESTORE_TIMEOUT_MS;

        /**
         * Try to reach the saved offset, retrying while the page is
         * still filling in.
         *
         * The check is whether the document is tall enough to hold that
         * offset. Once it is, the scroll will land exactly, and there is
         * nothing more to wait for.
         */
        function attemptRestore() {

            const reachable =
                document.documentElement.scrollHeight - window.innerHeight;

            if (reachable >= savedOffset) {
                window.scrollTo(0, savedOffset);
                restoreFrame.current = null;
                return;
            }

            /*
              Not tall enough yet. Scroll as far as it currently goes, so
              a slow fetch still shows movement rather than sitting at
              the top, and try again next frame.
            */
            window.scrollTo(0, Math.max(0, reachable));

            if (Date.now() < deadline) {
                restoreFrame.current =
                    window.requestAnimationFrame(attemptRestore);
            } else {
                // The content never arrived, or the page is simply shorter now
                restoreFrame.current = null;
            }
        }

        attemptRestore();

        return () => {
            if (restoreFrame.current) {
                window.cancelAnimationFrame(restoreFrame.current);
                restoreFrame.current = null;
            }
        };
    }, [location.key, location.hash, navigationType]);

    // Behaviour only - there is nothing to draw
    return null;
}
