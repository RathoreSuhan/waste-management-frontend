import { useCallback, useState } from "react";
import { Eye, Heart, Share2, Check } from "lucide-react";

import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";

import { toggleLike, incrementShare } from "@/services/publicFeedService";
import { useAuthContext } from "@/hooks/useAuthContext";

/**
 * ============================================================================
 * Appreciation Bar
 * ============================================================================
 *
 * Views, likes and shares for one success story, with the like and share
 * actions attached.
 *
 * A like belongs to an account. The backend stores one row per person per
 * cleanup and derives the total from those rows, so pressing the heart a
 * second time withdraws the like instead of counting it twice, and the
 * figure follows the person rather than the browser they used.
 *
 * The heart is therefore drawn from likedByMe on the record, and the reply
 * to a press is taken as the truth - it too is counted from stored likes,
 * so it settles any disagreement with the optimistic guess.
 *
 * Nothing is copied out of the record into state. What the visitor changes
 * is held separately and takes precedence while they are here, which keeps
 * a reloaded story correct without an effect to hold the two in step.
 *
 * Anonymous visitors see the counts and may share, but liking asks them to
 * sign in first: the endpoint would refuse them, and a heart that fills and
 * then empties again explains nothing.
 * ============================================================================
 */

export default function AppreciationBar({ story, compact = false }) {

    const { user } = useAuthContext();

    // Liking is recorded against an account, so it needs a session
    const isGuest = !user;

    /*
      The visitor's own like, once they press: { liked, likeCount } as the
      backend reported it. null means untouched, so the record is shown as
      it arrived.
    */
    const [myLike, setMyLike] = useState(null);

    // Shares this visitor started, added on top of the recorded total
    const [sharesGiven, setSharesGiven] = useState(0);

    // Raised when a signed-out visitor presses the heart
    const [loginPromptOpen, setLoginPromptOpen] = useState(false);

    /*
      Kept stable across renders. The dialog's focus, escape and scroll-lock
      effect is keyed on this handler, so a fresh arrow on every render would
      tear that effect down and set it up again - pulling focus back to the
      close button each time this bar re-rendered.
    */
    const closeLoginPrompt = useCallback(() => setLoginPromptOpen(false), []);

    // Ignore repeat presses while a toggle is in flight
    const [saving, setSaving] = useState(false);

    // Brief confirmation after the link is copied
    const [copied, setCopied] = useState(false);

    // What to show: the visitor's own action if there was one, else the record
    const liked = myLike ? myLike.liked : Boolean(story.likedByMe);

    const likes = myLike ? myLike.likeCount : Number(story.likeCount) || 0;

    const shares = (Number(story.shareCount) || 0) + sharesGiven;

    /**
     * Give or withdraw this account's appreciation.
     */
    async function handleLike() {

        /*
          The endpoint is authenticated, so a guest's press would come back
          401. They are invited to sign in rather than shown a heart that
          fills and then quietly empties.
        */
        if (isGuest) {
            setLoginPromptOpen(true);
            return;
        }

        if (saving) {
            return;
        }

        setSaving(true);

        // Kept to fall back on if the request never lands
        const previous = myLike;

        // Move first so the heart responds immediately
        setMyLike({
            liked: !liked,
            likeCount: liked ? Math.max(0, likes - 1) : likes + 1,
        });

        try {
            const result = await toggleLike(story.reportId);

            /*
              Replaces the guess above. The reply is counted from the stored
              likes, so it also picks up anyone else who liked the same
              cleanup while this page was open.
            */
            setMyLike({
                liked: Boolean(result?.liked),
                likeCount: Number(result?.likeCount) || 0,
            });
        } catch (requestError) {

            // Put the display back, nothing was stored
            setMyLike(previous);

            /*
              A session that expired while the page sat open looks exactly
              like being signed out, so it is treated the same way.
            */
            if (requestError?.response?.status === 401) {
                setLoginPromptOpen(true);
            }

            /*
              Other failures pass without a notice. A like is a courtesy
              rather than a transaction, and an error banner in a public
              gallery would make more of it than a reader needs.
            */
        } finally {
            setSaving(false);
        }
    }

    /**
     * Copy the public link and record the share.
     *
     * Uses the native share sheet on devices that have one, since a phone
     * is where a story is most likely to be passed on, and falls back to
     * the clipboard elsewhere.
     */
    async function handleShare() {

        const url = `${window.location.origin}/success-stories/${story.reportId}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: story.reportTitle,
                    text: "A cleanup completed through the community waste platform.",
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);

                // Confirms the copy, which is otherwise invisible
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch {

            // Dismissing the share sheet lands here and is not a failure,
            // so nothing is counted and nothing is reported
            return;
        }

        // Counted only once the link actually left the page
        setSharesGiven((count) => count + 1);

        try {
            await incrementShare(story.reportId);
        } catch {
            setSharesGiven((count) => Math.max(0, count - 1));
        }
    }

    return (
        <div
            className={`flex items-center gap-4 ${compact ? "text-xs" : "text-sm"
                } text-ink-muted`}
        >

            {/* Views are recorded by the detail page, never clickable here */}
            <span className="inline-flex items-center gap-1" title="Views">
                <Eye size={compact ? 13 : 15} aria-hidden="true" />
                {Number(story.viewCount) || 0}
                <span className="sr-only">views</span>
            </span>

            {/* Like - pressing again withdraws it */}
            <button
                type="button"
                onClick={handleLike}
                /*
                  Only a request in flight closes the control. The heart
                  stays live once given, because it can be taken back.
                */
                disabled={saving}
                className={`inline-flex items-center gap-1 rounded transition-colors ${liked
                        ? "text-saffron"
                        : "hover:text-saffron focus-visible:text-saffron"
                    }`}
                aria-pressed={liked}
                title={
                    liked
                        ? "You appreciated this cleanup - press again to withdraw"
                        : "Appreciate this cleanup"
                }
            >
                <Heart
                    size={compact ? 13 : 15}
                    aria-hidden="true"
                    // Filled once given, so the state reads at a glance
                    fill={liked ? "currentColor" : "none"}
                />
                {likes}
                <span className="sr-only">
                    {liked ? "appreciated" : "appreciate this cleanup"}
                </span>
            </button>

            {/* Share */}
            <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1 rounded transition-colors hover:text-gov-blue focus-visible:text-gov-blue"
                title="Share this story"
            >
                {copied ? (
                    <Check size={compact ? 13 : 15} aria-hidden="true" />
                ) : (
                    <Share2 size={compact ? 13 : 15} aria-hidden="true" />
                )}
                {copied ? "Copied" : shares}
                <span className="sr-only">share this story</span>
            </button>

            {/* Shown when a signed-out visitor presses the heart.
                Renders through a portal, so it is centred on the viewport
                rather than trapped inside this card. */}
            <LoginRequiredDialog
                open={loginPromptOpen}
                onClose={closeLoginPrompt}
                action="appreciate this cleanup"
            />
        </div>
    );
}
