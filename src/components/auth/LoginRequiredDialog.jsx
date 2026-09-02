import { createPortal } from "react-dom";                  // Lifts the overlay out of whatever opened it
import { useLocation, useNavigate } from "react-router-dom";
import { X, LogIn, UserPlus } from "lucide-react";

import useModalBehaviour from "@/hooks/useModalBehaviour";  // Escape, scroll lock and focus trap, shared by every dialog
import { ROLE_LABELS } from "@/constants/roleLabels";

/**
 * ============================================================================
 * Login Required Dialog
 * ============================================================================
 *
 * Shown when someone tries to take part but cannot yet: commenting,
 * replying, rating urgency, or filing a report.
 *
 * Reading is public, but every write endpoint stays authenticated on the
 * backend. Rather than firing a request that is certain to come back 401,
 * the action is intercepted here and the visitor is invited to sign in.
 *
 * The current location is passed along to /login as `from`, so the visitor
 * returns to the report they were reading instead of a dashboard. Losing
 * their place is the quickest way to lose the contribution altogether.
 *
 * It also covers a second case: someone who *is* signed in but whose role
 * cannot perform the action, such as a cleaner pressing File a Report.
 * There is nothing to sign in to there, so the dialog explains the
 * restriction instead of offering login.
 *
 * A third case is a Municipal Corporation account, whose email is held in
 * municipal_corporation rather than users. A like or a comment has no citizen
 * record to be stored against, so the backend refuses it - previously as a bare
 * "User not found", or as a heart that silently sprang back. Same treatment as
 * the second case: state the rule, offer no login.
 *
 * On placement: the overlay is sent to document.body through a portal.
 * The dialog is raised from controls that live inside cards, and a card
 * that lifts on hover is a transformed element - which becomes the
 * containing block for anything positioned fixed inside it. Mounted in
 * place, the dialog was therefore pinned to the corner of the card that
 * opened it, dimmed that card alone, and jumped as the hover transform
 * animated away. The card also clips its overflow, so the part of the
 * overlay that reached past its edges was cut off. At the body there is
 * no transformed ancestor and nothing to clip against, so inset-0 always
 * means the viewport and the panel always lands in the middle of it.
 * ============================================================================
 */

export default function LoginRequiredDialog({
    open,
    onClose,
    // What the visitor was trying to do, used in the message
    action = "take part in this discussion",
    // true when the blocker is the signed-in user's role, not a missing session
    citizenOnly = false,
    /*
      true when a Municipal Corporation account is signed in. Municipal emails
      live in municipal_corporation rather than users, so a community write
      cannot be recorded against them at all - see the note on that branch below.
    */
    municipalAccount = false,
    // Role of the signed-in user, named in the citizen-only message
    currentRole,
    // Where to send them after signing in, when it is not the current page
    redirectTo,
}) {

    const navigate = useNavigate();
    const location = useLocation();

    /*
      Escape closes it, the page behind is frozen, focus moves into the
      panel and is kept there, and the trigger gets focus back on close.

      This file used to carry its own copy of all four. The shared hook
      does the same work and adds the Tab trap the hand-written version
      was missing, so there is one behaviour to maintain rather than two.
    */
    const panelRef = useModalBehaviour(open, onClose);  // attached to the panel below

    if (!open) {
        return null;
    }

    /**
     * Send the visitor to login or register, remembering where they were.
     *
     * redirectTo covers actions that finish somewhere other than the
     * current page - filing a report starts on the leaderboard but ends
     * on the reporting form.
     */
    function goTo(path) {
        navigate(path, {
            state: {
                from: redirectTo || location.pathname + location.search,
            },
        });
    }

    // Readable name for the signed-in role, e.g. "Cleaner"
    const roleLabel = ROLE_LABELS[currentRole] || "account";

    /*
      Which of the three cases this is. Named here rather than nested in the
      markup, where a three-way ternary reads worse than the branch it chooses.
    */
    const heading = municipalAccount
        ? "Not available to municipal accounts"
        : citizenOnly
            ? "Available to citizen accounts"
            : "Sign in to continue";


    /*
      Portalled to document.body rather than returned in place, so the
      fixed overlay is measured against the viewport instead of against
      the hover-lifted card it was opened from. See the note at the top
      of the file for what that mis-placement looked like.
    */
    return createPortal(
        <div
            /*
              overflow-y-auto keeps the panel reachable when the viewport is
              shorter than the dialog - a phone in landscape, for instance,
              where a centred panel would otherwise be cut off at both ends.
            */
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
            role="presentation"
        >
            {/* Backdrop - clicking outside dismisses */}
            <div
                className="absolute inset-0 bg-ink/50"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                // A plain div cannot take focus on its own, so the hook is given a target
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-required-title"
                aria-describedby="login-required-description"
                className="relative w-full max-w-md rounded-gov border border-rule bg-white shadow-lg focus:outline-none"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-rule bg-paper px-4 py-3">
                    <h2
                        id="login-required-title"
                        className="font-serif text-base font-bold text-gov-navy"
                    >
                        {heading}
                    </h2>


                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded p-1 text-ink-muted transition hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 py-4">

                    {municipalAccount ? (
                        /*
                          A Municipal Corporation account. Its email is held in
                          municipal_corporation, not in users, so a like or a
                          comment has no citizen record to be filed against and
                          the backend refuses it outright. Login would achieve
                          nothing and the refusal is permanent, so the dialog
                          states the rule and closes.
                        */
                        <>
                            <p
                                id="login-required-description"
                                className="text-sm text-ink"
                            >
                                You cannot {action} from this account. Community
                                contributions are recorded against a citizen or
                                sanitation-officer account, and you are signed in
                                as {roleLabel}.
                            </p>

                            <p className="mt-2 text-xs text-ink-muted">
                                A Municipal Corporation account records its part in
                                a cleanup through the Municipal Console - proposal
                                decisions, completion sign-off and the approval
                                trail - which is kept separate from the community's
                                own reactions and discussion.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                                >
                                    Understood
                                </button>
                            </div>
                        </>
                    ) : citizenOnly ? (
                        /*
                          Already signed in, so login would achieve nothing.
                          Say which account type is required and why.
                        */
                        <>
                            <p
                                id="login-required-description"
                                className="text-sm text-ink"
                            >
                                Filing reports is reserved for citizen accounts,
                                and you are signed in as {roleLabel}. Everything
                                else on this page remains available to you.
                            </p>

                            <p className="mt-2 text-xs text-ink-muted">
                                Reports are tied to the resident who raised them so
                                cleanup teams can follow up locally, which is why
                                the form is limited to citizen accounts.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                                >
                                    Understood
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p
                                id="login-required-description"
                                className="text-sm text-ink"
                            >
                                You need an account to {action}. Browsing reports,
                                the trending ranking and the leaderboard stays open
                                to everyone.
                            </p>

                            <p className="mt-2 text-xs text-ink-muted">
                                Contributions are recorded against a citizen account
                                so cleanup teams know the report was raised by a real
                                resident of the area.
                            </p>

                            {/* Actions */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => goTo("/login")}
                                    className="flex items-center gap-1.5 rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                                >
                                    <LogIn size={14} aria-hidden="true" />
                                    Login
                                </button>

                                <button
                                    type="button"
                                    onClick={() => goTo("/register")}
                                    className="flex items-center gap-1.5 rounded-gov border border-gov-blue bg-white px-4 py-2 text-sm font-semibold text-gov-blue transition hover:bg-gov-blue/5"
                                >
                                    <UserPlus size={14} aria-hidden="true" />
                                    Create account
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-gov px-4 py-2 text-sm font-medium text-ink-muted transition hover:text-ink"
                                >
                                    Keep browsing
                                </button>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>,

        // The one place on the page with no transformed or clipping ancestor
        document.body
    );
}
