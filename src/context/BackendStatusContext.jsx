import { useCallback, useEffect, useState } from "react";

import {
    WAKE_NOTICE_AFTER,
    WARMUP_MAX_WAIT,
    WARMUP_RETRY_DELAY,
} from "@/constants/apiConstants";
import BackendStatusContext, {
    BACKEND_STATUS,
} from "@/context/backendStatusContextInstance";
import { pingBackend } from "@/services/healthService";

/**
 * ============================================================================
 * Backend Status Context
 * ============================================================================
 *
 * Wakes the backend when the site is opened, and tells the rest of the
 * application whether it is up yet.
 *
 * The backend is hosted on a free plan that stops the container after a spell
 * with no traffic, and starting it again takes close to a minute. Until this
 * existed, that minute began when the visitor pressed Sign In - the worst
 * possible moment - and ended in a ten-second timeout reported as "Something
 * went wrong".
 *
 * Mounting this provider is the warm-up: the ping goes out on first paint of
 * whichever route was opened, so the container starts while the visitor is
 * still reading the page. By the time they have typed an email and a password,
 * the server that has to check them is usually already running.
 *
 * The status it publishes is the second half of the job. A visitor who is kept
 * waiting is told why, in plain words, instead of being left to guess.
 * ============================================================================
 */

export function BackendStatusProvider({ children }) {

    const [status, setStatus] = useState(BACKEND_STATUS.UNKNOWN);

    /*
      Bumped by recheck() to start a fresh warm-up. A counter rather than a
      boolean, so repeated presses each start their own attempt.
    */
    const [attemptKey, setAttemptKey] = useState(0);

    useEffect(() => {

        /*
          React 19 StrictMode mounts every effect twice in development. Without
          this flag the second mount would run a second warm-up loop alongside
          the first, doubling the requests to a container that is already
          struggling to start.
        */
        let cancelled = false;

        let noticeTimer = null;

        let sleepTimer = null;

        // A ping that has not answered by now is worth explaining to the reader
        noticeTimer = setTimeout(() => {
            if (cancelled) {
                return;
            }

            /*
              Read the current status through the updater rather than from the
              render above, so this effect does not have to depend on status -
              depending on it would tear the warm-up loop down and start it
              again on every transition. A ping that has already succeeded
              leaves the state alone.
            */
            setStatus((current) =>
                current === BACKEND_STATUS.UNKNOWN
                    ? BACKEND_STATUS.WAKING
                    : current
            );
        }, WAKE_NOTICE_AFTER);

        function sleep(ms) {
            return new Promise((resolve) => {
                sleepTimer = setTimeout(resolve, ms);
            });
        }

        async function warmUp() {

            const deadline = Date.now() + WARMUP_MAX_WAIT;

            /*
              Keep trying until the server answers or the budget runs out. Each
              attempt has its own short timeout (see HEALTH_PING_TIMEOUT):
              waiting a long time on any single attempt gains nothing when the
              next one is only WARMUP_RETRY_DELAY away.
            */
            while (!cancelled) {

                try {
                    await pingBackend();

                    if (!cancelled) {
                        setStatus(BACKEND_STATUS.AWAKE);
                    }

                    return;
                } catch {
                    /*
                      Any failure is treated the same way. A starting container
                      refuses connections, times out, or is answered for by the
                      host with a 502 - none of which distinguishes "still
                      starting" from "broken", and the retry loop is the only
                      thing that can tell them apart.
                    */
                }

                if (cancelled) {
                    return;
                }

                if (Date.now() >= deadline) {
                    setStatus(BACKEND_STATUS.UNREACHABLE);
                    return;
                }

                // Space the attempts out rather than hammering a restart
                await sleep(WARMUP_RETRY_DELAY);
            }
        }

        warmUp();

        return () => {
            cancelled = true;

            clearTimeout(noticeTimer);

            clearTimeout(sleepTimer);
        };
    }, [attemptKey]);

    /**
     * Try again from the beginning.
     *
     * Offered on the unreachable notice, so a visitor whose own connection was
     * the problem is not stuck with a permanent failure until they reload.
     */
    const recheck = useCallback(() => {
        setStatus(BACKEND_STATUS.UNKNOWN);

        setAttemptKey((key) => key + 1);
    }, []);

    const value = {

        status,

        // Convenience flags, so consumers never compare strings themselves
        isWaking: status === BACKEND_STATUS.WAKING,

        isAwake: status === BACKEND_STATUS.AWAKE,

        isUnreachable: status === BACKEND_STATUS.UNREACHABLE,

        recheck,
    };

    return (

        <BackendStatusContext.Provider value={value}>

            {children}

        </BackendStatusContext.Provider>

    );
}
