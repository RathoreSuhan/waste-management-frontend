/**
 * ==========================================================
 * Municipal Stat Grid
 * ----------------------------------------------------------
 * The five headline figures on the Municipal Officer
 * dashboard, rendered with the shared StatCard tile so the
 * officer console looks like the rest of the console.
 *
 * Every figure is scoped to the officer's OWN corporation -
 * the backend derives the jurisdiction from the officer's
 * city, so there is nothing global on this screen.
 *
 * Counters (from MunicipalDashboardStatsResponse):
 *   relevantReports    - reports raised inside the city
 *   pendingProposals   - cleaner proposals awaiting review
 *   activeCleanups     - ASSIGNED / IN_PROGRESS / REWORK_REQUIRED
 *   completionReviews  - AWAITING_APPROVAL, officer must decide
 *   completedCleanups  - closed after an officer approval
 *
 * Two of those figures are supplied by useMunicipalStats rather than the
 * backend, because the backend counts SITES awaiting a decision while the
 * Proposal Review desk decides per PROPOSAL:
 *   pendingProposals        - live proposals, as the review desk lists them
 *   pendingProposalSites    - how many sites those proposals belong to
 *   pendingProposalsAreSites - set only when the queue could not be read, so
 *                              the tile can say "sites" instead of implying a
 *                              proposal count it does not actually have
 * ==========================================================
 */

import {
    ClipboardCheck,
    ClipboardList,
    FileText,
    ShieldCheck,
    Truck,
} from "lucide-react";

import StatCard from "@/components/common/StatCard";

export default function MunicipalStatGrid({ stats }) {

    // Counters can be absent while the first request is in flight
    const safe = stats || {};

    // Small helper so a missing counter shows 0 rather than "undefined"
    const count = (value) => (typeof value === "number" ? value : 0);

    // Sites behind the pending proposals - falls back to the proposal count
    // itself, which is correct whenever one site carries a single bid
    const pendingSites = count(safe.pendingProposalSites ?? safe.pendingProposals);

    /*
      Sub-line for the Pending Proposals tile.

      It names the unit the number is in, which is exactly what was missing
      before: "1" was a site total sitting under a heading that reads as a
      proposal total. The wording now matches the Proposal Review page, which
      says "N proposals ... across M sites".
    */
    const pendingDescription = safe.pendingProposalsAreSites
        // Queue unreachable - the figure is a site count, so it is labelled as one
        ? `${pendingSites === 1 ? "Site" : "Sites"} awaiting your review`
        : `Across ${pendingSites} site${pendingSites === 1 ? "" : "s"} awaiting your review`;

    return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

            {/* Volume of citizen demand inside this jurisdiction */}
            <StatCard
                title="Relevant Reports"
                value={count(safe.relevantReports)}
                description="Raised in your city"
                accent="navy"
                icon={FileText}
            />

            {/* The officer's primary inbox - one tile per PLAN, not per site,
                so it reads the same as the Proposal Review desk */}
            <StatCard
                title="Pending Proposals"
                value={count(safe.pendingProposals)}
                description={pendingDescription}
                accent="saffron"
                icon={ClipboardList}
            />

            {/* Work the corporation has already authorised */}
            <StatCard
                title="Active Cleanups"
                value={count(safe.activeCleanups)}
                description="Assigned, running or in rework"
                accent="blue"
                icon={Truck}
            />

            {/* Proof submitted, GPS + AI done, officer decision pending */}
            <StatCard
                title="Completion Reviews"
                value={count(safe.completionReviews)}
                description="Evidence awaiting approval"
                accent="saffron"
                icon={ClipboardCheck}
            />

            {/* Only an officer approval can land a cleanup here */}
            <StatCard
                title="Completed Cleanups"
                value={count(safe.completedCleanups)}
                description="Approved and closed"
                accent="green"
                icon={ShieldCheck}
            />
        </div>
    );
}