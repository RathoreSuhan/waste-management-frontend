import { useEffect, useRef, useState } from "react";

import { GOOGLE_CLIENT_ID } from "@/constants/apiConstants";
import { LANGUAGES } from "@/constants/languageConstants";
import useLanguage from "@/hooks/useLanguage";

/**
 * ============================================================================
 * Google Sign-In
 * ============================================================================
 *
 * Loads Google Identity Services and renders Google's own button into a
 * container this hook hands back, calling onCredential with the ID token once
 * the visitor has signed in.
 *
 * WHY GOOGLE'S OWN BUTTON
 * -----------------------
 * Google's branding terms require it, and more usefully it is the control
 * people already recognise. It also means the account chooser, the popup, the
 * consent screen and the "signed in as" state are all Google's problem rather
 * than ours - there is no password field anywhere near this code.
 *
 * WHY NO WRAPPER PACKAGE
 * ----------------------
 * A React wrapper for Google Identity Services is a dependency, a version to
 * keep current and an extra layer between this project and Google's own API,
 * in exchange for the forty lines below. The script tag is loaded once at
 * module level, so both auth pages share it.
 *
 * ONE TAP IS DELIBERATELY NOT USED
 * --------------------------------
 * auto_select is off and nothing prompts on page load. A visitor reading the
 * sign-in page should not have an account chosen for them before they have
 * pressed anything, and on a shared device that would sign in whoever used it
 * last.
 *
 * DEGRADING
 * ---------
 * Two different things can go wrong, and they are reported separately because
 * they need different answers:
 *
 *   "unconfigured"  no VITE_GOOGLE_CLIENT_ID. Google sign-in was simply never
 *                   set up for this deployment. Nobody needs telling - the
 *                   caller renders nothing at all and the password form on the
 *                   page is the way in.
 *
 *   "unavailable"   a client id exists but Google's script did not load: a
 *                   privacy extension blocked it, or the network failed. Worth
 *                   a quiet note, because the person may have expected a button.
 *
 * Collapsing the two into one message was wrong: it showed a warning about
 * browser extensions on a site that had simply never been given a client id.
 * ============================================================================
 */

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

/*
  Shared across every caller and every mount. React 19 StrictMode runs effects
  twice in development, and both auth pages can use this hook, so without one
  shared promise the script would be appended several times.
*/
let scriptPromise = null;

function loadGoogleIdentityScript() {

    if (scriptPromise) {
        return scriptPromise;
    }

    scriptPromise = new Promise((resolve, reject) => {

        const script = document.createElement("script");

        script.src = GIS_SCRIPT_SRC;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            // Loaded, but an extension may still have emptied the global
            if (window.google?.accounts?.id) {
                resolve(window.google.accounts.id);
            } else {
                reject(new Error("Google Identity Services did not initialise"));
            }
        };

        script.onerror = () => {
            // Cleared so a later attempt - a retry, another page - can try again
            scriptPromise = null;

            reject(new Error("Google Identity Services could not be loaded"));
        };

        document.head.appendChild(script);
    });

    return scriptPromise;
}

/**
 * Google's button sizing rules: it refuses anything outside this range, and
 * measuring the container is what keeps the button the same width as the form
 * beneath it on a desktop card without overflowing a narrow phone.
 */
function buttonWidth(container) {
    return Math.min(400, Math.max(200, container.clientWidth || 280));
}

/**
 * @param {Object} options
 * @param {(credential: string) => void} options.onCredential called with the
 *        Google ID token once the visitor has signed in
 * @param {(error: Object) => void} [options.onError] called when Google itself
 *        reports a problem, e.g. a blocked popup
 * @returns {{ buttonRef: Object, status: "loading"|"ready"|"unconfigured"|"unavailable" }}
 */
export default function useGoogleSignIn({ onCredential, onError }) {

    const buttonRef = useRef(null);

    /*
      The handlers are held in refs so a re-render with a new function identity
      does not re-initialise Google or re-draw its button - which would reset
      the control while somebody was using it.
    */
    const credentialHandler = useRef(onCredential);

    const errorHandler = useRef(onError);

    const [status, setStatus] = useState(
        GOOGLE_CLIENT_ID ? "loading" : "unconfigured"
    );

    // Google renders the button's own text, so it follows the reader's language
    const { language } = useLanguage();

    useEffect(() => {
        credentialHandler.current = onCredential;
        errorHandler.current = onError;
    }, [onCredential, onError]);

    useEffect(() => {

        // Nothing to load without an audience to sign in against
        if (!GOOGLE_CLIENT_ID) {
            return;
        }

        let cancelled = false;

        loadGoogleIdentityScript()
            .then((googleId) => {

                // Unmounted, or navigated away, while the script was loading
                if (cancelled || !buttonRef.current) {
                    return;
                }

                googleId.initialize({
                    client_id: GOOGLE_CLIENT_ID,

                    callback: (response) => {
                        credentialHandler.current?.(response?.credential);
                    },

                    error_callback: (error) => {
                        errorHandler.current?.(error);
                    },

                    // See the note above: nothing is chosen for the visitor
                    auto_select: false,

                    cancel_on_tap_outside: true,
                });

                // Emptied first, because a language switch re-runs this effect
                buttonRef.current.replaceChildren();

                googleId.renderButton(buttonRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    logo_alignment: "center",
                    width: buttonWidth(buttonRef.current),
                    locale: language === LANGUAGES.HI ? "hi" : "en",
                });

                setStatus("ready");
            })
            .catch(() => {
                if (!cancelled) {
                    setStatus("unavailable");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [language]);

    return { buttonRef, status };
}
