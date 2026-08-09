/**
 * ============================================================================
 * Leaderboard Badge Constants (Phase 11)
 * ============================================================================
 *
 * Mirrors the backend BadgeType enum and the thresholds applied in
 * LeaderboardServiceImpl:
 *
 *     0 - 199 points  -> BRONZE
 *   200 - 499 points  -> SILVER
 *   500+ points       -> GOLD
 *
 * The badge shown on screen is always the one the backend sent. The
 * thresholds below are duplicated here only to describe the ladder in
 * the legend and to phrase "N points to Silver" - never to decide a
 * cleaner's badge, which would risk drifting from the server.
 * ============================================================================
 */

/**
 * Badge values exactly as they arrive from the backend enum.
 */
export const BADGE = {
    BRONZE: "BRONZE",
    SILVER: "SILVER",
    GOLD: "GOLD",
};

/**
 * Presentation for each badge.
 *
 * Colours follow the metal rather than the site palette, since a badge
 * is understood by its metal before its label is read.
 */
const BADGE_META = {
    [BADGE.GOLD]: {
        label: "Gold",
        className: "border-amber-300 bg-amber-50 text-amber-800",
        dotClassName: "bg-amber-500",
        minPoints: 500,
    },
    [BADGE.SILVER]: {
        label: "Silver",
        className: "border-slate-300 bg-slate-50 text-slate-700",
        dotClassName: "bg-slate-400",
        minPoints: 200,
    },
    [BADGE.BRONZE]: {
        label: "Bronze",
        className: "border-orange-200 bg-orange-50 text-orange-800",
        dotClassName: "bg-orange-600",
        minPoints: 0,
    },
};

/**
 * Fallback for an unknown or missing badge.
 *
 * A cleaner who has never earned points can legitimately arrive with a
 * null badge, so this must render calmly rather than looking broken.
 */
const UNKNOWN_BADGE = {
    label: "Unranked",
    className: "border-rule bg-paper text-ink-muted",
    dotClassName: "bg-ink-muted",
    minPoints: 0,
};

/**
 * Look up the presentation for a badge value.
 *
 * @param badge Backend BadgeType value - BRONZE, SILVER or GOLD
 */
export function getBadgeMeta(badge) {
    return BADGE_META[badge] || UNKNOWN_BADGE;
}

/**
 * The ladder, highest first, for the legend beneath the table.
 */
export const BADGE_LADDER = [
    { badge: BADGE.GOLD, requirement: "500 points and above" },
    { badge: BADGE.SILVER, requirement: "200 to 499 points" },
    { badge: BADGE.BRONZE, requirement: "Below 200 points" },
];

/**
 * Scopes offered by the leaderboard page.
 *
 * NATIONAL needs no location; STATE and CITY take one from the user
 * and put it straight into the URL path.
 */
export const LEADERBOARD_SCOPE = {
    NATIONAL: "NATIONAL",
    STATE: "STATE",
    CITY: "CITY",
};

/**
 * Tab definitions, kept beside the scope values they select.
 */
export const LEADERBOARD_SCOPES = [
    { value: LEADERBOARD_SCOPE.NATIONAL, label: "National", labelHi: "राष्ट्रीय" },
    { value: LEADERBOARD_SCOPE.STATE, label: "By State", labelHi: "राज्य" },
    { value: LEADERBOARD_SCOPE.CITY, label: "By City", labelHi: "शहर" },
];
