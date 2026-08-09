/**
 * ============================================================================
 * Rank Medal
 * ============================================================================
 *
 * Renders a leaderboard position.
 *
 * The top three are given a filled marker so the podium is readable at a
 * glance; everyone below is a plain number, which keeps a long table calm.
 *
 * Ranking is competition style on the backend, so two cleaners on equal
 * points share a rank and the following rank is skipped. Positions like
 * 1, 2, 2, 4 are therefore correct and must not be renumbered here.
 * ============================================================================
 */

/**
 * Marker styling for the podium places.
 */
const PODIUM = {
    1: "border-amber-300 bg-amber-100 text-amber-900",
    2: "border-slate-300 bg-slate-100 text-slate-800",
    3: "border-orange-200 bg-orange-100 text-orange-900",
};

export default function RankMedal({ rank }) {

    // A missing rank should not print "#undefined"
    if (rank === null || rank === undefined) {
        return <span className="text-sm text-ink-muted">&mdash;</span>;
    }

    const podiumClass = PODIUM[rank];

    // Fourth place downwards - plain, restrained
    if (!podiumClass) {
        return (
            <span className="text-sm font-semibold text-ink-muted tabular-nums">
                {rank}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex h-7 w-7 items-center justify-center border text-sm font-bold tabular-nums ${podiumClass}`}
        >
            {rank}
        </span>
    );
}
