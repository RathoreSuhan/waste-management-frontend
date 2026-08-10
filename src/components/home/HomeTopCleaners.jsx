import { Link } from "react-router-dom";
import { Trophy, ArrowRight } from "lucide-react";

import RankMedal from "@/components/leaderboard/RankMedal";
import BadgePill from "@/components/leaderboard/BadgePill";

import useReports from "@/hooks/useReports";
import { getNationalLeaderboard } from "@/services/leaderboardService";

/**
 * ============================================================================
 * Home Top Cleaners
 * ============================================================================
 *
 * The top three of the national leaderboard, previewed on the landing page.
 *
 * Recognition only works if it is visible to people who are not looking
 * for it. A cleaner ranked first sees it on their own dashboard either
 * way; putting the leading three on the front page is what makes the
 * ranking worth climbing.
 *
 * Reuses RankMedal and BadgePill so a rank and a badge look identical
 * here and on the full leaderboard. Falls silent while loading, on
 * failure or before anybody has been ranked, for the same reason as the
 * other landing page sections.
 * ============================================================================
 */

// Three is a podium; more would duplicate the leaderboard page
const PREVIEW_COUNT = 3;

export default function HomeTopCleaners() {

    // Module level function, so the reference is stable across renders
    const { data, loading, error } = useReports(getNationalLeaderboard);

    /*
      The endpoint answers with the full LeaderboardResponse wrapper -
      { leaderboardType, location, message, leaderboard } - not a bare
      array, so the ranking has to be taken out of it. LeaderboardPage
      unwraps the same way.
    */
    const entries = data?.leaderboard || [];

    if (loading || error || entries.length === 0) {
        return null;
    }


    return (
        <section className="border-t border-rule bg-paper">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">

                    <div>
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                            <Trophy size={12} aria-hidden="true" />
                            Recognition
                        </p>

                        <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy">
                            Leading Cleaners
                        </h2>

                        <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                            Ranked nationally by reward points earned for verified
                            cleanups.
                        </p>
                    </div>

                    <Link
                        to="/leaderboard"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-gov-blue hover:underline"
                    >
                        View full leaderboard
                        <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                </div>

                <ol className="mt-6 grid gap-4 md:grid-cols-3">
                    {entries.slice(0, PREVIEW_COUNT).map((entry, index) => (
                        <li
                            key={`${entry.rank}-${entry.cleanerName}-${index}`}
                            className="rounded-gov border border-rule bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <RankMedal rank={entry.rank} />

                                <BadgePill badge={entry.badge} size="small" />
                            </div>

                            <p className="mt-3 font-serif text-lg font-bold text-gov-navy">
                                {entry.cleanerName || "Unnamed cleaner"}
                            </p>

                            {/*
                              Points lead, since that is what the ranking is
                              ordered by, with the cleanup counts behind it
                              so the figure can be accounted for.
                            */}
                            <p className="mt-2 text-sm text-ink">
                                <span className="font-bold tabular-nums">
                                    {(entry.rewardPoints ?? 0).toLocaleString("en-IN")}
                                </span>
                                <span className="ml-1 text-ink-muted">
                                    reward points
                                </span>
                            </p>

                            <p className="mt-1 text-xs text-ink-muted tabular-nums">
                                {entry.completedCleanups ?? 0} cleanups
                                {" · "}
                                {entry.aiVerifiedCleanups ?? 0} verified
                            </p>
                        </li>
                    ))}
                </ol>
            </div>
        </section>
    );
}
