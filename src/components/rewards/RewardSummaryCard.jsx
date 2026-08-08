import { Award } from "lucide-react";

/**
 * ============================================================================
 * Reward Summary Card (Phase 9)
 * ============================================================================
 *
 * Total points earned by the logged-in cleaner.
 *
 * Uses the tricolour green already defined in the theme, tinted lightly
 * against the paper background. Green is the established "resolved"
 * colour across the app, and every point here comes from a verified
 * cleanup, so the same colour carries the same meaning.
 * ============================================================================
 */

export default function RewardSummaryCard({ summary, entryCount = 0 }) {

    // Points can legitimately be zero, so fall back only on null/undefined
    const points = summary?.totalRewardPoints ?? 0;

    return (
        <section className="rounded-gov border border-rule border-l-4 border-l-india-green bg-india-green/5 p-5">

            <div className="flex flex-wrap items-start justify-between gap-4">

                <div className="min-w-0">

                    <p className="text-[10px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        Total Reward Points
                    </p>

                    <div className="mt-2 flex items-baseline gap-2">

                        {/* The headline figure */}
                        <span className="font-serif text-4xl font-bold text-india-green">
                            {points}
                        </span>

                        <span className="text-sm text-ink-muted">
                            {points === 1 ? "point" : "points"}
                        </span>
                    </div>

                    {/* Name is echoed back so a cleaner can confirm whose ledger this is */}
                    {summary?.cleanerName && (
                        <p className="mt-1 truncate text-sm text-ink-muted">
                            Earned by {summary.cleanerName}
                        </p>
                    )}
                </div>

                {/* Decorative medal, hidden from assistive technology */}
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-gov border border-india-green/30 bg-white">
                    <Award size={22} className="text-india-green" aria-hidden="true" />
                </span>
            </div>

            {/* Explains where the number comes from, rather than leaving it unexplained */}
            <p className="mt-4 border-t border-india-green/20 pt-3 text-xs text-ink-muted">
                {entryCount > 0
                    ? `Awarded across ${entryCount} verified ${entryCount === 1 ? "cleanup" : "cleanups"}. Points are credited automatically once AI confirms a site is clear.`
                    : "Points are credited automatically once AI confirms a cleaned site."}
            </p>
        </section>
    );
}
