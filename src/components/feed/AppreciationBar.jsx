import { useState } from "react";
import { Eye, Heart, Share2, Check } from "lucide-react";

import { incrementLike, incrementShare } from "@/services/publicFeedService";
import { hasLiked, rememberLike } from "@/utils/myAppreciations";

/**
 * ============================================================================
 * Appreciation Bar
 * ============================================================================
 *
 * Views, likes and shares for one success story, with the like and share
 * actions attached.
 *
 * The counters are held in local state and moved optimistically. The
 * backend acknowledges a like with a message and timestamp but does not
 * return the new total, so the only alternative would be re-fetching the
 * whole story to move one number.
 *
 * A failed request rolls the number back. Silently, because a like is a
 * courtesy rather than a transaction: an error notice would make more of
 * the failure than a reader of a public gallery needs.
 * ============================================================================
 */

export default function AppreciationBar({ story, compact = false }) {

    // Counts start from the record and drift as the visitor interacts
    const [likes, setLikes] = useState(Number(story.likeCount) || 0);
    const [shares, setShares] = useState(Number(story.shareCount) || 0);

    // Seeded from this device's history so a reload does not forget
    const [liked, setLiked] = useState(() => hasLiked(story.reportId));

    // Brief confirmation after the link is copied
    const [copied, setCopied] = useState(false);

    /**
     * Record a like, unless this browser already did.
     */
    async function handleLike() {

        // The backend would happily count a second like from the same person
        if (liked) {
            return;
        }

        // Move first so the heart responds immediately
        setLiked(true);
        setLikes((count) => count + 1);

        try {
            await incrementLike(story.reportId);

            // Only remembered once the backend has actually accepted it
            rememberLike(story.reportId);
        } catch {

            // Put the count back rather than show a total that was never stored
            setLiked(false);
            setLikes((count) => Math.max(0, count - 1));
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
        setShares((count) => count + 1);

        try {
            await incrementShare(story.reportId);
        } catch {
            setShares((count) => Math.max(0, count - 1));
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

            {/* Like */}
            <button
                type="button"
                onClick={handleLike}
                disabled={liked}
                className={`inline-flex items-center gap-1 rounded transition-colors ${liked
                        ? "text-saffron"
                        : "hover:text-saffron focus-visible:text-saffron"
                    }`}
                title={liked ? "You appreciated this cleanup" : "Appreciate this cleanup"}
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
        </div>
    );
}
