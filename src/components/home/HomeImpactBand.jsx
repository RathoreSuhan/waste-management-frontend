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
 *
 * Set on white, immediately below the hero. The section carries the first
 * real information on the page, and it reads best as clean paper with the
 * colour held back for the accents on each card.
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

    /*
      Each figure keeps its own accent, carried by the rule across the top
      of the card and the tinted chip behind its icon.

      The band sits on white. It was tried on the navy hero gradient to
      break up a run of pale sections, but a full-width dark block that
      close to the hero read as a second masthead rather than as a
      continuation of the page, so the surface went back to white and the
      separation is now doing its work through the accents alone.

      Those accents are the soft tints from index.css with the saturated
      colour on the icon, which is the pairing every other light card on
      the site uses.
    */
    const ITEMS = [
        {
            icon: FileText,
            value: figures.reports,
            label: "Reports Filed",
            hint: "Waste sites reported by citizens",
            rule: "bg-gov-blue",
            chip: "bg-civic-teal-soft text-gov-blue",
        },
        {
            icon: Sparkles,
            value: figures.cleanups,
            label: "Sites Cleared",
            hint: "Cleanups completed and published",
            rule: "bg-india-green",
            chip: "bg-green-soft text-india-green",
        },
        {
            icon: Users,
            value: figures.cleaners,
            label: "Cleaners Ranked",
            hint: "Teams and individuals on the leaderboard",
            rule: "bg-civic-teal",
            chip: "bg-civic-teal-soft text-civic-teal",
        },
        {
            icon: ShieldCheck,
            value: figures.verified,
            label: "Verified Cleanups",
            hint: "Confirmed from before and after photographs",
            rule: "bg-saffron",
            chip: "bg-saffron-soft text-civic-amber",
        },
    ];



    return (
        <section className="border-b border-rule bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="border-b border-rule pb-3">

                    <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        By the Numbers
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                        Platform Impact
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 text-sm text-ink-muted">
                        Counted live from the public record, not estimated.
                    </p>
                </div>


                <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {ITEMS.map((item) => (
                        <div
                            key={item.label}
                            className="overflow-hidden rounded-gov border border-rule bg-paper transition hover:border-gov-blue/40"
                        >
                            {/* The card's accent, and the only saturated colour on it */}

                            <div
                                aria-hidden="true"
                                className={`h-1 w-full ${item.rule}`}
                            />

                            <div className="p-5">

                                <span
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-gov ${item.chip}`}
                                >
                                    <item.icon size={18} aria-hidden="true" />
                                </span>

                                {/*
                                  tabular-nums keeps the digits on a shared
                                  grid, so four cards side by side line up
                                  instead of drifting.
                                */}
                                <dd className="mt-3 font-serif text-4xl font-bold text-gov-navy tabular-nums">
                                    {item.value.toLocaleString("en-IN")}
                                </dd>

                                <dt className="mt-1 text-sm font-semibold text-gov-navy">
                                    {item.label}
                                </dt>

                                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                                    {item.hint}
                                </p>

                            </div>
                        </div>
                    ))}
                </dl>
            </div>
        </section>
    );
}


