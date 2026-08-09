import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, LogIn, UserPlus } from "lucide-react";

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
 * ============================================================================
 */

export default function LoginRequiredDialog({
    open,
    onClose,
    // What the visitor was trying to do, used in the message
    action = "take part in this discussion",
    // true when the blocker is the signed-in user's role, not a missing session
    citizenOnly = false,
    // Role of the signed-in user, named in the citizen-only message
    currentRole,
    // Where to send them after signing in, when it is not the current page
    redirectTo,
}) {

    const navigate = useNavigate();
    const location = useLocation();

    // Focus target on open, so keyboard and screen reader users start inside
    const closeButtonRef = useRef(null);

    // Element focused before opening, restored on close
    const previouslyFocused = useRef(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        previouslyFocused.current = document.activeElement;

        closeButtonRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        // The page behind must not scroll while the dialog is up
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;

            // Send focus back where it came from
            if (previouslyFocused.current instanceof HTMLElement) {
                previouslyFocused.current.focus();
            }
        };
    }, [open, onClose]);

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


    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="presentation"
        >
            {/* Backdrop - clicking outside dismisses */}
            <div
                className="absolute inset-0 bg-ink/50"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-required-title"
                aria-describedby="login-required-description"
                className="relative w-full max-w-md rounded-gov border border-rule bg-white shadow-lg"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-rule bg-paper px-4 py-3">
                    <h2
                        id="login-required-title"
                        className="font-serif text-base font-bold text-gov-navy"
                    >
                        {citizenOnly
                            ? "Available to citizen accounts"
                            : "Sign in to continue"}
                    </h2>


                    <button
                        ref={closeButtonRef}
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

                    {citizenOnly ? (
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
        </div>
    );
}
