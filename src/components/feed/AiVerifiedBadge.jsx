import { BadgeCheck } from "lucide-react";

/**
 * ============================================================================
 * AI Verified Badge
 * ============================================================================
 *
 * Marks a cleanup that the image model confirmed by comparing the before
 * and after photographs.
 *
 * The confidence percentage is shown rather than hidden. A story published
 * on 62% confidence is a weaker claim than one at 96%, and a reader
 * judging the programme deserves to see which they are looking at.
 *
 * Nothing renders when verification is absent, so an unverified record can
 * never borrow the credibility of a verified one.
 * ============================================================================
 */

export default function AiVerifiedBadge({ verified, confidence, className = "" }) {

    // Absent verification is left unmarked rather than marked as failed
    if (!verified) {
        return null;
    }

    // Confidence arrives as a percentage from the backend
    const percentage =
        typeof confidence === "number" ? Math.round(confidence) : null;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded border border-india-green/30 bg-india-green/10 px-2 py-0.5 text-[11px] font-semibold text-india-green ${className}`}
        >
            <BadgeCheck size={12} aria-hidden="true" />

            {/* Reads as a sentence for screen readers, not just an icon */}
            AI Verified
            {percentage !== null && (
                <span className="font-normal">({percentage}%)</span>
            )}
        </span>
    );
}
