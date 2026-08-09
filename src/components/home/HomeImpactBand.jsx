import { useEffect, useState } from "react";
import { FileText, Sparkles, Users, ShieldCheck } from "lucide-react";

import { getAllReports } from "@/services/reportService";
import { getPublicFeed } from "@/services/publicFeedService";
import { getNationalLeaderboard } from "@/services/leaderboardService";

/**
 * ============================================================================
 * Home Impact Band
 * ============================================================================
 *
 * Four figures describing what the platform has actually done.
 *
 * Every number is counted from a public endpoint - GET /api/reports,
 * /api/public-feed and /api/leaderboard are all readable without a token.
 * Nothing here is illustrative or rounded up: a civic platform that
 * invents its own numbers has nothing left to be trusted with.
 *
 * The admin dashboard holds richer totals, but /api/admin/** is
 * ROLE_ADMIN only and is deliberately not touched from a public page.
 *
 * Like HomeSuccessSection, the band removes itself while loading, on
 * failure, or before there is anything to count. A row of zeroes under
 * the heading "Platform Impact" would be worse than no row at all.
 * ============================================================================
 */

export default function HomeImpactBand() {

    const [figures, setFigures] = useState(null);

    useEffect(() => {

        // Set false on unmount so a late response cannot update a gone component
        let active = true;

        async function load() {

            try {

                /*
                  Requested together rather than in sequence. They are
                  three independent reads, and waiting for each in turn
                  would make the band the slowest part of the page.
                */
                const [reports, cleanups, leaderboard] = await Promise.all([
                    getAllReports(),
                    getPublicFeed(),
                    getNationalLeaderboard(),
                ]);

                if (!active) {
                    return;
                }

                /*
                  Three endpoints, three shapes. The report and feed calls
                  answer with a plain list, but the leaderboard answers
                  with the LeaderboardResponse wrapper and keeps the
                  ranking under `leaderboard`.

                  Everything is forced to an array before being counted.
                  A count is not worth taking a page down for, and this
                  section reads from three sources at once.
                */
                const reportList = Array.isArray(reports) ? reports : [];
                const cleanupList = Array.isArray(cleanups) ? cleanups : [];
                const cleaners = leaderboard?.leaderboard || [];

                setFigures({

                    reports: reportList.length,

                    cleanups: cleanupList.length,

                    // Only cleaners who have earned a place on the board
                    cleaners: cleaners.length,

                    // Cleanups the image check confirmed, summed across cleaners
                    verified: cleaners.reduce(
                        (total, entry) => total + (entry.aiVerifiedCleanups ?? 0),
                        0,
                    ),
                });

            } catch {

                // Stay silent - the landing page is not the place for an error box
                if (active) {
                    setFigures(null);
                }
            }
        }

        load();

        return () => {
            active = false;
        };

    }, []);

    // Nothing to show yet, or nothing worth showing
    if (!figures || figures.reports === 0) {
        return null;
    }

    const ITEMS = [
        {
            icon: FileText,
            value: figures.reports,
            label: "Reports Filed",
            hint: "Waste sites reported by citizens",
            accent: "text-gov-blue",
        },
        {
            icon: Sparkles,
            value: figures.cleanups,
            label: "Sites Cleared",
            hint: "Cleanups completed and published",
            accent: "text-india-green",
        },
        {
            icon: Users,
            value: figures.cleaners,
            label: "Cleaners Ranked",
            hint: "Teams and individuals on the leaderboard",
            accent: "text-civic-teal",
        },
        {
            icon: ShieldCheck,
            value: figures.verified,
            label: "Verified Cleanups",
            hint: "Confirmed from before and after photographs",
            accent: "text-civic-plum",
        },
    ];

    return (
        <section className="border-b border-rule bg-white">
            <div className="mx-auto max-w-7xl px-4 py-10">

                <div className="border-b border-rule pb-3">
                    <h2 className="font-serif text-2xl font-bold text-gov-navy">
                        Platform Impact
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 text-sm text-ink-muted">
                        Counted live from the public record, not estimated.
                    </p>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {ITEMS.map((item) => (
                        <div
                            key={item.label}
                            className="rounded-gov border border-rule bg-paper p-5"
                        >
                            <item.icon
                                size={20}
                                className={item.accent}
                                aria-hidden="true"
                            />

                            {/*
                              tabular-nums keeps the digits on a shared
                              grid, so four cards side by side line up
                              instead of drifting.
                            */}
                            <dd className="mt-3 font-serif text-3xl font-bold text-gov-navy tabular-nums">
                                {item.value.toLocaleString("en-IN")}
                            </dd>

                            <dt className="mt-0.5 text-sm font-semibold text-ink">
                                {item.label}
                            </dt>

                            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                                {item.hint}
                            </p>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}
