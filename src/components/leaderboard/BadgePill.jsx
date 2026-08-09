import { getBadgeMeta } from "@/constants/badgeConstants";

/**
 * ============================================================================
 * Badge Pill
 * ============================================================================
 *
 * Shows the reward badge a cleaner has earned - Bronze, Silver or Gold.
 *
 * The value always comes from the backend. Nothing here recalculates a
 * badge from points, so the screen can never disagree with the server.
 *
 * Colour alone must not carry the meaning, so the metal is also spelled
 * out in text for anyone who cannot distinguish the shades.
 * ============================================================================
 */

export default function BadgePill({ badge, size = "default" }) {

    // Falls back to a neutral "Unranked" pill for a null badge
    const meta = getBadgeMeta(badge);

    // The compact variant is used inside dense table rows
    const sizeClasses =
        size === "small"
            ? "px-1.5 py-0.5 text-[10px]"
            : "px-2 py-0.5 text-[11px]";

    return (
        <span
            className={`inline-flex items-center gap-1.5 border font-semibold tracking-wide uppercase ${sizeClasses} ${meta.className}`}
        >
            {/* Metal marker, decorative only - the label carries the meaning */}
            <span
                className={`h-1.5 w-1.5 rounded-full ${meta.dotClassName}`}
                aria-hidden="true"
            />

            {meta.label}
        </span>
    );
}
