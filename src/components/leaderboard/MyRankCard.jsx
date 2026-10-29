import { Trophy, Target } from "lucide-react";

import BadgePill from "@/components/leaderboard/BadgePill";
import { getBadgeMeta, BADGE } from "@/constants/badgeConstants";

/**
 * ============================================================================
 * My Rank Card
 * ============================================================================
 *
 * The signed-in cleaner's own standing, shown above the public table.
 *
 * Data comes from GET /api/leaderboard/me, which is cleaner-only, so this
 * card is rendered for ROLE_CLEANER and for nobody else.
 *
 * The heading qualifies the rank as national: the number is the cleaner's
 * position across EVERY cleaner, computed the same way the National
 * board's ranks are, not a position in the top-10 table below.
 *
 * The number itself is shown only while the cleaner sits inside the top
 * 10 - the same window the national board displays. Beyond it the badge,
 * points and cleanup counts still tell their story, but the rank number
 * is hidden rather than showing a figure the table cannot corroborate.
 * ============================================================================
 */

/** The national board displays the top 10; beyond it the rank number hides. */
const NATIONAL_BOARD_SIZE = 10;

/**
 * Name of the badge above the current one.
 *
 * pointsToNextBadge tells us how far there is to go but not what is being
 * worked towards, so the next rung is derived from the current badge.
 * Returns null on GOLD, where there is nothing further to earn.
 */
function getNextBadgeLabel(badge) {
    if (badge === BADGE.BRONZE) {
        return getBadgeMeta(BADGE.SILVER).label;
    }

    if (badge === BADGE.SILVER) {
        return getBadgeMeta(BADGE.GOLD).label;
    }

    return null;
}

export default function MyRankCard({ ranking }) {

    // Nothing to show until the request resolves
    if (!ranking) {
        return null;
    }

    const nextBadgeLabel = getNextBadgeLabel(ranking.badge);

    // Zero or absent means there is nothing left to climb
    const pointsToNext = ranking.pointsToNextBadge ?? 0;

    const showProgress = nextBadgeLabel && pointsToNext > 0;

    return (
        <section className="rounded-gov border border-rule bg-white">

            <div className="border-b border-rule bg-gov-navy px-5 py-3 text-white">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase">
                    <Trophy size={13} aria-hidden="true" />
                    My Standing
                    <span className="font-medium text-white/60">
                        &middot; National Rank
                    </span>
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">

                {/* Position across all cleaners, shown only inside the
                    top 10 the national board can corroborate */}
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Rank
                    </p>

                    {ranking.rank != null && ranking.rank <= NATIONAL_BOARD_SIZE ? (
                        <p className="mt-1 font-serif text-3xl font-bold text-gov-navy tabular-nums">
                            {ranking.rank}
                        </p>
                    ) : (
                        <p className="mt-2 text-sm text-ink-muted">
                            Outside the top {NATIONAL_BOARD_SIZE}
                        </p>
                    )}
                </div>

                {/* Current badge */}
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Badge
                    </p>

                    <div className="mt-1.5">
                        <BadgePill badge={ranking.badge} />
                    </div>
                </div>

                {/* What the ranking is sorted by */}
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Points
                    </p>

                    <p className="mt-1 font-serif text-2xl font-bold text-gov-navy tabular-nums">
                        {ranking.rewardPoints ?? 0}
                    </p>
                </div>

                {/* Completed work behind the points */}
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Cleanups
                    </p>

                    <p className="mt-1 text-sm text-ink">
                        <span className="font-semibold tabular-nums">
                            {ranking.completedCleanups ?? 0}
                        </span>{" "}
                        completed
                        <span className="text-ink-muted">
                            {" "}&middot;{" "}
                            <span className="tabular-nums">
                                {ranking.aiVerifiedCleanups ?? 0}
                            </span>{" "}
                            AI verified
                        </span>
                    </p>
                </div>
            </div>

            {/* Distance to the next badge, hidden once Gold is reached */}
            {showProgress && (
                <div className="flex items-center gap-2 border-t border-rule bg-paper px-5 py-2.5">
                    <Target size={13} className="text-ink-muted" aria-hidden="true" />

                    <p className="text-sm text-ink-muted">
                        <span className="font-semibold text-ink tabular-nums">
                            {pointsToNext}
                        </span>{" "}
                        more {pointsToNext === 1 ? "point" : "points"} to reach{" "}
                        <span className="font-semibold text-ink">
                            {nextBadgeLabel}
                        </span>
                        .
                    </p>
                </div>
            )}

            {/* Top of the ladder - say so rather than showing an empty bar */}
            {!nextBadgeLabel && (
                <div className="flex items-center gap-2 border-t border-rule bg-paper px-5 py-2.5">
                    <Trophy size={13} className="text-amber-600" aria-hidden="true" />

                    <p className="text-sm text-ink-muted">
                        Highest badge earned. Thank you for your service.
                    </p>
                </div>
            )}
        </section>
    );
}
