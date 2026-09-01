import { Loader2 } from "lucide-react";

import BiText from "@/components/common/BiText";
import Alert from "@/components/ui/Alert";
import UI from "@/i18n/strings";
import useBackendStatus from "@/hooks/useBackendStatus";

/**
 * ============================================================================
 * Backend Wake Notice
 * ============================================================================
 *
 * The in-card explanation shown on the sign-in and registration pages while
 * the free-plan container is starting.
 *
 * It exists because the honest answer to "why is this taking so long?" is not
 * an error. The backend sleeps when nobody is using it and takes about a
 * minute to start, and the person waiting deserves to be told that rather than
 * left watching a spinner - or worse, told that something went wrong, which is
 * what the login page used to say when the request timed out.
 *
 * These two pages get the prominent treatment because they are where the wait
 * actually costs something: someone who has typed a password and pressed the
 * button will otherwise press it again, or leave.
 *
 * Renders nothing at all when the server is up or has not yet been slow enough
 * to mention, so both call sites are a bare <BackendWakeNotice />.
 * ============================================================================
 */

export default function BackendWakeNotice() {

    const { isWaking, isUnreachable, recheck } = useBackendStatus();

    // Warm server, or too early to say - stay out of the way entirely
    if (!isWaking && !isUnreachable) {
        return null;
    }

    /*
      Two minutes of retries have failed, so this is no longer a cold start.
      Saying "cannot reach" is more useful than a reassurance that has stopped
      being true, and the retry gives someone whose own connection dropped a
      way out without reloading the page.
    */
    if (isUnreachable) {
        return (
            <div className="mt-4">
                <Alert
                    type="error"
                    title={<BiText {...UI.backend.unreachable} />}
                >
                    <p>
                        <BiText {...UI.backend.unreachableExplain} primaryOnly />
                    </p>

                    <button
                        type="button"
                        onClick={recheck}
                        className="mt-2 text-xs font-semibold underline underline-offset-2 hover:no-underline"
                    >
                        <BiText {...UI.backend.retry} primaryOnly />
                    </button>
                </Alert>
            </div>
        );
    }

    return (
        <div className="mt-4">
            <Alert
                type="warning"

                /*
                  The spinner belongs beside the heading, not in place of the
                  Alert's own icon: the icon is part of the notice styling and
                  replacing it would mean changing Alert for every other caller.
                */
                title={
                    <span className="flex items-center gap-2">
                        <Loader2
                            size={14}
                            className="animate-spin shrink-0"
                            aria-hidden="true"
                        />

                        <BiText {...UI.backend.waking} />
                    </span>
                }
            >
                <p>
                    <BiText {...UI.backend.explain} primaryOnly />
                </p>

                <p className="mt-1">
                    <BiText {...UI.backend.reassure} primaryOnly />
                </p>
            </Alert>
        </div>
    );
}
