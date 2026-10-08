import BiText from "@/components/common/BiText";
import useGoogleSignIn from "@/hooks/useGoogleSignIn";
import { UI } from "@/i18n/strings";

/**
 * ============================================================================
 * Google Sign-In Block
 * ============================================================================
 *
 * The slot Google draws its own button into, the states around it, and - when
 * asked - the "or" rule that separates it from the form below.
 *
 * Shared by the sign-in and registration pages so there is one definition of
 * what the control looks like and how it behaves. Both pages then differ only
 * in what they do with the credential.
 *
 * WHY IT OWNS THE DIVIDER
 * -----------------------
 * Because it is the thing that knows whether there is anything to divide. When
 * Google is not configured this renders nothing at all, and a divider left
 * behind in the page would be a rule with blank space above it. Keeping both
 * here means neither page carries a conditional.
 *
 * WHY "NOT CONFIGURED" IS SILENT
 * ------------------------------
 * An optional feature nobody set up is not a fault, and saying so helps no one:
 * the form below is right there and works. The earlier version showed a warning
 * about browser extensions on a site that had simply never been given a client
 * id, which read as something being broken. A client id that IS set and then
 * fails to load is different - that one gets a quiet line, because the person
 * may well have been expecting a button.
 *
 * WHY THE BUSY STATE HIDES RATHER THAN REPLACES
 * ---------------------------------------------
 * Google renders its button imperatively, once, into the element below. Taking
 * that element off the page and putting it back - which a conditional return
 * here would do - gives back an empty div: the effect that drew the button does
 * not run again, so a failed sign-in would leave somebody looking at a page
 * with no way to retry. Hiding keeps the same node, and Google's button with it.
 *
 * Google's button also cannot be disabled, because the control is Google's own,
 * so hiding it is what prevents a second press while a request is in flight -
 * which on a cold start can be most of a minute.
 *
 * Props
 *   onCredential  called with the Google ID token
 *   onError       called when Google reports a problem it can name
 *   busy          true while the credential is being exchanged with the backend
 *   busyLabel     what to say meanwhile, as an { en, hi } pair
 *   divider       render an "or" rule underneath, for a page with a form below
 * ============================================================================
 */

export default function GoogleSignInButton({
    onCredential,
    onError,
    busy = false,
    busyLabel,
    divider = false,
}) {

    const { buttonRef, status } = useGoogleSignIn({ onCredential, onError });

    // Never set up here: show nothing, divider included
    if (status === "unconfigured") {
        return null;
    }

    return (
        <>
            {status === "unavailable" ? (
                /*
                  A client id exists but Google's script never arrived. Stated
                  as one quiet line rather than a full Alert - the page still
                  works, so this is a footnote, not an error.
                */
                <p className="rounded-gov border border-rule bg-paper px-4 py-3 text-center text-xs leading-relaxed text-ink-muted">
                    <BiText {...UI.auth.googleUnavailableExplain} />
                </p>
            ) : (
                <div>
                    {/*
                      Google measures this element to size its button, so it is
                      full width and the button fills the card it sits in.
                      Hidden, never unmounted - see the note above.
                    */}
                    <div
                        ref={buttonRef}
                        className={`w-full justify-center ${busy ? "hidden" : "flex"}`}
                    />

                    {busy && (
                        <p
                            role="status"
                            className="rounded-gov border border-rule bg-paper px-4 py-3 text-center text-sm font-medium text-ink-muted"
                        >
                            <BiText {...(busyLabel || UI.auth.signingIn)} />
                        </p>
                    )}

                    {/*
                      Only while the script is still loading. Kept in the layout
                      rather than shown as a spinner, so the button does not
                      arrive by pushing the form down the page.
                    */}
                    {status === "loading" && !busy && (
                        <p className="text-center text-xs text-ink-muted">
                            <BiText {...UI.auth.preparingGoogle} />
                        </p>
                    )}
                </div>
            )}

            {divider && (
                // Rule with the word set into it, as used between form sections
                <div className="my-5 flex items-center gap-3" aria-hidden="true">
                    <span className="h-px flex-1 bg-rule" />

                    <span className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        <BiText {...UI.auth.or} />
                    </span>

                    <span className="h-px flex-1 bg-rule" />
                </div>
            )}
        </>
    );
}
