import { useCallback, useEffect, useState } from "react";
import { Trophy, MapPin, Info } from "lucide-react";

import PageIntro from "@/components/layout/PageIntro";
import PageSection from "@/components/layout/PageSection";
import ScopeSelector from "@/components/leaderboard/ScopeSelector";

import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import MyRankCard from "@/components/leaderboard/MyRankCard";
import BadgePill from "@/components/leaderboard/BadgePill";

import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import useAuth from "@/hooks/useAuth";

import {
    LEADERBOARD_SCOPE,
    BADGE_LADDER,
} from "@/constants/badgeConstants";

import {
    getNationalLeaderboard,
    getStateLeaderboard,
    getCityLeaderboard,
    getMyRanking,
} from "@/services/leaderboardService";

/**
 * ============================================================================
 * Leaderboard Page (Phase 11)
 * ============================================================================
 *
 * Public ranking of cleaners by reward points.
 *
 * Calls GET /api/leaderboard, /api/leaderboard/state/{state} and
 * /api/leaderboard/city/{city} - all three are permitAll in the backend
 * SecurityConfig.
 *
 * The rankings are public, since recognising this work openly is the point
 * of the module. The same component is also mounted at /app/leaderboard,
 * where it renders inside the signed-in shell for anyone following the
 * sidebar - PageIntro adjusts the opening block to suit.
 *
 * A signed-in cleaner additionally sees their own standing from
 * /api/leaderboard/me. That endpoint is authenticated and rejects every
 * role except ROLE_CLEANER, so it is requested for cleaners only.
 * ============================================================================
 */

/**
 * Starting value for the response.
 *
 * Declared at module level so the identity never changes between
 * renders, which matters because it seeds the hook's state.
 */
const EMPTY_RESPONSE = {
    leaderboardType: null,
    location: "",
    message: "",
    leaderboard: [],
};

export default function LeaderboardPage() {

    // Used to decide whether the personal card should be requested
    const { user } = useAuth();

    // National, by state, or by city
    const [scope, setScope] = useState(LEADERBOARD_SCOPE.NATIONAL);

    // Submitted location - not the text currently being typed
    const [location, setLocation] = useState("");

    // Personal standing, cleaners only
    const [myRanking, setMyRanking] = useState(null);

    /**
     * Pick the request for the current scope.
     *
     * Wrapped in useCallback because useReports treats the fetcher as an
     * effect dependency: an inline function would be a new value on every
     * render and would request the leaderboard in a loop.
     */
    const fetchLeaderboard = useCallback(() => {

        if (scope === LEADERBOARD_SCOPE.STATE) {
            return getStateLeaderboard(location);
        }

        if (scope === LEADERBOARD_SCOPE.CITY) {
            return getCityLeaderboard(location);
        }

        return getNationalLeaderboard();
    }, [scope, location]);

    const { data, loading, error, reload } = useReports(
        fetchLeaderboard,
        EMPTY_RESPONSE
    );

    /**
     * Load the signed-in cleaner's own position.
     *
     * Deliberately separate from the table request. A failure here must
     * not take down the public ranking, so the error is swallowed and the
     * card simply does not appear.
     */
    useEffect(() => {

        // Citizens and admins are rejected by the backend, so do not ask.
        // Nothing is cleared here - a stale value cannot reach the screen
        // because rendering is gated on the role as well.
        if (user?.role !== "ROLE_CLEANER") {
            return;
        }

        // Guards against a response arriving after a sign-out
        let ignore = false;

        getMyRanking()
            .then((ranking) => {
                if (!ignore) {
                    setMyRanking(ranking);
                }
            })
            .catch(() => {
                if (!ignore) {
                    setMyRanking(null);
                }
            });

        return () => {
            ignore = true;
        };
    }, [user?.role]);

    // The response always carries an array, but stay defensive
    const entries = data?.leaderboard || [];

    // State and city rankings need a place before they mean anything
    const awaitingLocation =
        scope !== LEADERBOARD_SCOPE.NATIONAL && !location.trim();

    /*
      The personal card is shown only to a cleaner. Checking the role at
      render time rather than clearing the state in the effect means a
      ranking fetched before a sign-out can never be shown to whoever
      signs in next.
    */
    const showMyRank = user?.role === "ROLE_CLEANER" && myRanking;

    return (
        <>
            {/* Band on the public site, page heading inside the shell */}
            <PageIntro
                icon={Trophy}
                eyebrow="Cleaner Recognition"
                en="Leaderboard"
                hi="अग्रणी सूची"
                description="Cleaners ranked by the reward points earned for cleanups confirmed by AI. Positions are calculated live, so the table reflects work verified moments ago."
            />

            <PageSection>

                    {/* Personal standing, shown to signed-in cleaners */}
                    {showMyRank && (
                        <div className="mb-6">
                            <MyRankCard ranking={myRanking} />
                        </div>
                    )}

                    {/* Scope tabs and the location box */}
                    <ScopeSelector
                        scope={scope}
                        location={location}
                        onScopeChange={setScope}
                        onLocationSubmit={setLocation}
                    />

                    {/* Waiting for a state or city to be entered */}
                    {awaitingLocation && (
                        <div className="border border-rule bg-white px-5 py-10 text-center">
                            <MapPin
                                size={22}
                                className="mx-auto text-ink-muted"
                                aria-hidden="true"
                            />

                            <p className="mt-2 font-semibold text-ink">
                                {scope === LEADERBOARD_SCOPE.STATE
                                    ? "Enter a state to see its ranking"
                                    : "Enter a city to see its ranking"}
                            </p>

                            <p className="mt-1 text-sm text-ink-muted">
                                Spelling is matched loosely, so capitals and extra
                                spaces will not affect the result.
                            </p>
                        </div>
                    )}

                    {!awaitingLocation && (
                        <>
                            {/* First load */}
                            {loading && <ReportListSkeleton count={3} />}

                            {/* Request failed */}
                            {!loading && error && (
                                <ReportListError message={error} onRetry={reload} />
                            )}

                            {/*
                              No cleaners for this place. The backend returns 200
                              with an empty list and an explanatory message here,
                              so this is a real answer rather than a failure.
                            */}
                            {!loading && !error && entries.length === 0 && (
                                <ReportListEmpty
                                    title="No ranking available yet"
                                    description={
                                        data?.message ||
                                        "No cleaner has earned reward points in this area so far."
                                    }
                                />
                            )}

                            {/* Ranking */}
                            {!loading && !error && entries.length > 0 && (
                                <>
                                    <p className="mb-3 text-sm text-ink-muted">
                                        Showing the top{" "}
                                        <span className="font-semibold text-ink">
                                            {entries.length}
                                        </span>{" "}
                                        {entries.length === 1 ? "cleaner" : "cleaners"}
                                        {data?.location && (
                                            <>
                                                {" "}in{" "}
                                                <span className="font-semibold text-ink">
                                                    {data.location}
                                                </span>
                                            </>
                                        )}
                                        .
                                    </p>

                                    <LeaderboardTable
                                        entries={entries}
                                        highlightName={
                                            showMyRank ? myRanking.cleanerName : null
                                        }
                                    />
                                </>
                            )}
                        </>
                    )}

                    {/* How the badges are earned */}
                    <div className="mt-6 border border-rule bg-white p-4">

                        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            <Info size={12} aria-hidden="true" />
                            How badges are earned
                        </p>

                        <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
                            {BADGE_LADDER.map((rung) => (
                                <li
                                    key={rung.badge}
                                    className="flex items-center gap-2 text-sm text-ink-muted"
                                >
                                    <BadgePill badge={rung.badge} size="small" />
                                    {rung.requirement}
                                </li>
                            ))}
                        </ul>

                        <p className="mt-3 text-xs text-ink-muted">
                            Cleaners on equal points share a position, so a rank may
                            appear twice and the next one is skipped.
                        </p>
                    </div>
            </PageSection>
        </>
    );
}


