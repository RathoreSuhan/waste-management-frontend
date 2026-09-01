import { useState } from "react";
import { Loader2, X } from "lucide-react";

import BiText from "@/components/common/BiText";
import UI from "@/i18n/strings";
import useBackendStatus from "@/hooks/useBackendStatus";

/**
 * ============================================================================
 * Backend Wake Strip
 * ============================================================================
 *
 * The slim site-wide band shown under the masthead while the free-plan
 * container is starting.
 *
 * The auth pages get the full notice; every other page gets this. A visitor
 * who lands on the home page, the trending list or the leaderboard during a
 * cold start sees sections that will not load, and without a word of
 * explanation the site simply looks broken. One line at the top of the page
 * accounts for it.
 *
 * Deliberately quieter than BackendWakeNotice: it is one line, it can be
 * dismissed, and it never covers or shifts the content underneath - reading an
 * article should not be interrupted by a message about a server.
 *
 * Dismissal is local state on purpose. It lasts as long as the page does, and
 * a fresh visit during a genuine cold start should say so again rather than
 * inherit a decision made in a previous session.
 * ============================================================================
 */

export default function BackendWakeStrip() {

    const { isWaking } = useBackendStatus();

    const [dismissed, setDismissed] = useState(false);

    /*
      Only the waking case appears here. An unreachable backend is reported by
      each page in its own error state, where it belongs - a strip claiming the
      server is down above a page that loaded perfectly well from cache would
      be more confusing than helpful.
    */
    if (!isWaking || dismissed) {
        return null;
    }

    return (
        <div
            // Announced without stealing focus from whatever is being read
            role="status"
            className="border-b border-rule border-l-4 border-l-saffron bg-orange-50 text-orange-900"
        >
            <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2">

                <Loader2
                    size={14}
                    className="shrink-0 animate-spin text-orange-600"
                    aria-hidden="true"
                />

                <p className="min-w-0 text-xs leading-relaxed">
                    <span className="font-semibold">
                        <BiText {...UI.backend.waking} primaryOnly />
                    </span>

                    {" — "}

                    <BiText {...UI.backend.explain} primaryOnly />
                </p>

                <button
                    type="button"
                    onClick={() => setDismissed(true)}

                    // Icon-only control, so the label goes to assistive tech
                    aria-label={UI.backend.dismiss.en}
                    title={UI.backend.dismiss.en}
                    className="ml-auto shrink-0 rounded-gov p-1 text-orange-700 transition hover:bg-orange-100"
                >
                    <X size={14} aria-hidden="true" />
                </button>

            </div>
        </div>
    );
}
