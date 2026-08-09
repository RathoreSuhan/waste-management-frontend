import { UserRound, CheckCircle2 } from "lucide-react";

import BadgePill from "@/components/leaderboard/BadgePill";
import RankMedal from "@/components/leaderboard/RankMedal";

/**
 * ============================================================================
 * Leaderboard Table
 * ============================================================================
 *
 * The ranked list of cleaners for whichever scope is selected.
 *
 * Built as a real table rather than a grid of divs: this is tabular data
 * with column headers, so a screen reader should be able to announce
 * "Reward points, 320" while moving through the rows.
 *
 * On narrow screens the two cleanup columns are dropped rather than
 * shrunk. Rank, name, badge and points are what the ranking is actually
 * about; the breakdown is detail that can wait for a wider window.
 * ============================================================================
 */

export default function LeaderboardTable({ entries, highlightName }) {

    return (
        <div className="overflow-x-auto border border-rule bg-white">
            <table className="w-full border-collapse text-sm">

                <caption className="sr-only">
                    Cleaners ranked by reward points, highest first
                </caption>

                <thead>
                    <tr className="border-b border-rule bg-paper text-left">

                        <th scope="col" className="w-16 px-4 py-2.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Rank
                        </th>

                        <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Cleaner
                        </th>

                        <th scope="col" className="px-4 py-2.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Badge
                        </th>

                        {/* Hidden below md - detail rather than headline */}
                        <th scope="col" className="hidden px-4 py-2.5 text-right text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase md:table-cell">
                            Cleanups
                        </th>

                        <th scope="col" className="hidden px-4 py-2.5 text-right text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase md:table-cell">
                            AI Verified
                        </th>

                        <th scope="col" className="px-4 py-2.5 text-right text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Points
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {entries.map((entry, index) => {

                        /*
                          Competition ranking means rank is not unique, and
                          two cleaners can share a display name, so neither
                          is safe as a React key. The array index is stable
                          here because the list is replaced wholesale on
                          every fetch and never reordered in place.
                        */
                        const isMe =
                            highlightName &&
                            entry.cleanerName === highlightName;

                        return (
                            <tr
                                key={`${entry.rank}-${entry.cleanerName}-${index}`}
                                className={`border-b border-rule last:border-b-0 ${isMe ? "bg-saffron/10" : "hover:bg-paper"
                                    }`}
                            >
                                {/* Position */}
                                <td className="px-4 py-3">
                                    <RankMedal rank={entry.rank} />
                                </td>

                                {/* Name */}
                                <td className="px-4 py-3">
                                    <span className="flex items-center gap-2">
                                        <UserRound
                                            size={14}
                                            className="shrink-0 text-ink-muted"
                                            aria-hidden="true"
                                        />

                                        <span className="font-semibold text-ink">
                                            {entry.cleanerName || "Unnamed cleaner"}
                                        </span>

                                        {/* Marks the signed-in cleaner's own row */}
                                        {isMe && (
                                            <span className="border border-saffron bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-gov-navy uppercase">
                                                You
                                            </span>
                                        )}
                                    </span>
                                </td>

                                {/* Badge */}
                                <td className="px-4 py-3">
                                    <BadgePill badge={entry.badge} size="small" />
                                </td>

                                {/* Completed cleanups */}
                                <td className="hidden px-4 py-3 text-right text-ink-muted tabular-nums md:table-cell">
                                    {entry.completedCleanups ?? 0}
                                </td>

                                {/* AI-verified subset of the above */}
                                <td className="hidden px-4 py-3 text-right md:table-cell">
                                    <span className="inline-flex items-center gap-1.5 text-ink-muted tabular-nums">
                                        <CheckCircle2
                                            size={13}
                                            className="text-green-700"
                                            aria-hidden="true"
                                        />
                                        {entry.aiVerifiedCleanups ?? 0}
                                    </span>
                                </td>

                                {/* Points - what the ranking is sorted by */}
                                <td className="px-4 py-3 text-right">
                                    <span className="font-bold text-gov-navy tabular-nums">
                                        {entry.rewardPoints ?? 0}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
