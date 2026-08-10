import { BadgeCheck } from "lucide-react";

import { formatConfidence } from "@/constants/assignmentConstants";

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

    /*
      Confidence arrives as a FRACTION between 0 and 1, not as a percentage.

      This previously read Math.round(confidence), which turned a genuine
      0.96 into "1%" - advertising the platform's most trustworthy evidence
      as its least. The scaling is delegated to formatConfidence, which the
      cleaner task cards and the upload dialog already use, so there is one
      definition of how a confidence score is written rather than three
      that can drift apart.

      It returns "" for a missing score and handles 0 as a real value.
    */
    const percentage = formatConfidence(confidence);

    return (
        <span
            className={`inline-flex items-center gap-1 rounded border border-india-green/30 bg-india-green/10 px-2 py-0.5 text-[11px] font-semibold text-india-green ${className}`}
        >
            <BadgeCheck size={12} aria-hidden="true" />

            {/* Reads as a sentence for screen readers, not just an icon */}
            AI Verified
            {percentage && (
                <span className="font-normal">({percentage})</span>
            )}
        </span>
    );
}
