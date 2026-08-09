import { useState } from "react";
import { Star } from "lucide-react";

import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";

import { submitVote } from "@/services/voteService";
import { getMyVote, rememberMyVote } from "@/utils/myVotes";
import { getErrorMessage } from "@/utils/errorMessage";
import { useAuthContext } from "@/hooks/useAuthContext";



/**
 * ============================================================================
 * Urgency Rating (Phase 6)
 * ============================================================================
 *
 * Citizens rate how urgent a report is from 1 to 5. The backend keeps one
 * vote per citizen and overwrites it when they rate again, so changing a
 * rating is expected rather than blocked.
 *
 * Only citizens may vote - the backend restricts /api/votes to ROLE_CITIZEN,
 * so cleaners and admins are shown the community average on its own instead
 * of a control that could only ever fail for them.
 *
 * Voting also closes once a report is resolved: rating the urgency of
 * garbage that has already been cleared serves no purpose.
 * ============================================================================
 */

/** The five choices, worded so the number carries meaning */
const RATING_LABELS = {
    1: "Minor",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Critical",
};

export default function UrgencyRating({
    reportId,
    // Community average from the report record
    urgencyScore,
    // Resolved reports no longer accept votes
    resolved = false,
    // Lets the page refresh the report so both scores stay accurate
    onVoted,
}) {
    const { user } = useAuthContext();

    // Only citizens can vote, and only while the report is open
    const isCitizen = user?.role === "ROLE_CITIZEN";

    /*
      Anonymous visitors read this page too, since reports are public.

      They are shown the same stars rather than a bare average: hiding the
      control would leave no hint that rating exists, and the invitation to
      take part is the reason the page is open to them in the first place.
      Clicking asks them to sign in.
    */
    const isGuest = !user;

    const canVote = (isCitizen || isGuest) && !resolved;

    // Raised when a guest clicks a star
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);


    // Rating this citizen last submitted from this browser
    const [myRating, setMyRating] = useState(() =>
        getMyVote(user?.email, reportId),
    );

    // Star currently under the pointer or keyboard focus
    const [preview, setPreview] = useState(0);

    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");

    const [confirmation, setConfirmation] = useState("");

    // Average shown to everyone, rounded for the star display
    const average = Number(urgencyScore) || 0;

    // Preview wins while hovering, otherwise show the citizen's own rating
    const highlighted = preview || myRating || 0;

    async function handleVote(rating) {
        /*
          A guest has nothing to send the vote with, so the request is
          not attempted - POST /api/votes requires ROLE_CITIZEN and would
          come back 401. They are invited to sign in instead.
        */
        if (isGuest) {
            setLoginPromptOpen(true);
            return;
        }

        // Ignore repeat clicks while a request is in flight
        if (submitting) {
            return;
        }


        setSubmitting(true);
        setError("");
        setConfirmation("");

        // Show the choice straight away, and keep the old value to undo with
        const previous = myRating;
        setMyRating(rating);

        try {
            await submitVote(reportId, rating);

            // Remember it so a page refresh still shows their rating
            rememberMyVote(user?.email, reportId, rating);

            setConfirmation(
                previous
                    ? "Your rating has been updated."
                    : "Thank you - your rating has been recorded.",
            );

            // Voting shifts both the urgency and engagement scores, so the
            // report is reloaded rather than patched locally.
            if (onVoted) {
                await onVoted();
            }
        } catch (requestError) {
            // Put the previous rating back, the vote never landed
            setMyRating(previous);

            setError(
                getErrorMessage(
                    requestError,
                    "Unable to record your rating. Please try again.",
                ),
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="space-y-3">

            {/* Community average, the authoritative figure */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">

                <div className="flex items-center gap-1" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            size={16}
                            className={
                                star <= Math.round(average)
                                    ? "fill-amber-500 text-amber-500"
                                    : "text-rule"
                            }
                        />
                    ))}
                </div>

                <p className="text-sm text-ink">
                    <span className="font-semibold">
                        {average ? average.toFixed(1) : "Not yet rated"}
                    </span>

                    {average > 0 && (
                        <span className="text-ink-muted"> / 5 community urgency</span>
                    )}
                </p>
            </div>

            {/* Citizens rate the report themselves */}
            {canVote && (
                <fieldset
                    className="rounded-gov border border-rule bg-paper p-3"
                    disabled={submitting}
                >
                    <legend className="px-1 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                        {myRating ? "Your Rating" : "Rate This Report"}
                    </legend>

                    <div
                        className="mt-1 flex items-center gap-1"
                        // Leaving the row clears the preview
                        onMouseLeave={() => setPreview(0)}
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleVote(star)}
                                onMouseEnter={() => setPreview(star)}
                                onFocus={() => setPreview(star)}
                                onBlur={() => setPreview(0)}
                                // Screen readers announce the meaning, not just a number
                                aria-label={`Rate ${star} of 5 - ${RATING_LABELS[star]}`}
                                aria-pressed={myRating === star}
                                className="rounded p-1 transition disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-gov-blue"
                            >
                                <Star
                                    size={22}
                                    className={
                                        star <= highlighted
                                            ? "fill-amber-500 text-amber-500"
                                            : "text-ink-muted/40 hover:text-amber-500"
                                    }
                                />
                            </button>
                        ))}

                        {/* Word for the star being considered */}
                        <span className="ml-2 text-xs font-medium text-ink-muted">
                            {highlighted ? RATING_LABELS[highlighted] : "Select a rating"}
                        </span>
                    </div>

                    <p className="mt-2 text-[11px] text-ink-muted">
                        {isGuest
                            ? "Ratings from citizens decide which reports are attended to first. Sign in to add yours."
                            : "Ratings from citizens decide which reports are attended to first. You can change yours at any time."}
                    </p>
                </fieldset>
            )}

            {/* Voting is closed once the garbage has been cleared */}
            {(isCitizen || isGuest) && resolved && (
                <p className="text-xs text-ink-muted">
                    This report has been resolved, so rating is now closed.
                </p>
            )}

            {/*
              Cleaners and admins read the score but cannot influence it.
              Guests are excluded here - they are shown the stars above,
              so telling them rating is for citizens would contradict it.
            */}
            {!isCitizen && !isGuest && (
                <p className="text-xs text-ink-muted">
                    Urgency is rated by citizens.
                </p>
            )}


            {confirmation && (
                <p role="status" className="text-xs font-medium text-india-green">
                    {confirmation}
                </p>
            )}

            {error && (
                <p role="alert" className="text-xs font-medium text-red-700">
                    {error}
                </p>
            )}

            {/* Shown when a guest tries to rate */}
            <LoginRequiredDialog
                open={loginPromptOpen}
                onClose={() => setLoginPromptOpen(false)}
                action="rate how urgent this report is"
            />
        </div>
    );
}


