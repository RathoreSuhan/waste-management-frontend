import { Link } from "react-router-dom";
import { Building2, ClipboardList, Truck, ClipboardCheck, History } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import BiText from "@/components/common/BiText";
import MunicipalStatGrid from "@/components/municipal/MunicipalStatGrid";
import useMunicipalStats from "@/hooks/useMunicipalStats";
import { AI_ADVISORY_NOTICE } from "@/constants/municipalConstants";

/**
 * ============================================================================
 * Municipal Dashboard (Phase 15 - Municipal Corporation Console)
 * ============================================================================
 *
 * Home screen of the Municipal Officer. Everything an officer sees on this
 * console is scoped to their own Municipal Corporation - the corporation is
 * resolved on the server from the signed-in corporation's own registered
 * email, never from a query parameter or a self-declared city, so one
 * corporation can never review another's work.
 *
 * The dashboard answers three questions in order:
 *   1. Which corporation am I acting for?          -> corporation header
 *   2. How much work is waiting on my desk?        -> MunicipalStatGrid
 *   3. Where do I go next?                         -> the four desk links
 *
 * It also states the governing principle of the whole workflow: Gemini AI and
 * GPS only *assist* the officer. The assignment is closed by the officer's
 * written decision, never by the AI verdict.
 * ============================================================================
 */

// The four desks an officer works through, in workflow order - the last of
// which is the record of work already closed rather than a queue to act on.
const QUEUE_LINKS = [
    {
        to: "/municipal/proposals",
        icon: ClipboardList,
        label: "Proposal Review",
        labelHi: "प्रस्ताव समीक्षा",
        description:
            "Compare the cleanup plans filed for each site, then approve one proposal to assign the work.",
    },
    {
        to: "/municipal/active",
        icon: Truck,
        label: "Active Cleanups",
        labelHi: "चालू सफाई",
        description:
            "Track assignments already under way, with the cleaner's on-site activity record.",
    },
    {
        to: "/municipal/completions",
        icon: ClipboardCheck,
        label: "Completion Review",
        labelHi: "पूर्णता समीक्षा",
        description:
            "Examine before/after evidence, GPS distance and AI advice, then close or return the work.",
    },
    {
        to: "/municipal/history",
        icon: History,
        label: "Cleanup History",
        labelHi: "सफाई इतिहास",
        description:
            "Re-open the file on any cleanup this corporation has approved, newest sign-off first.",
    },
];

// The lifecycle in plain words, so a new officer knows where their step sits.
const WORKFLOW_STEPS = [
    "A citizen reports a garbage site and it enters your corporation's queue.",
    "A cleaner inspects the site within 50 m and files a cleanup proposal.",
    "You approve one proposal - that single decision assigns the work.",
    "The cleaner starts on site, keeps an activity diary and uploads proof.",
    "GPS and Gemini AI check the proof and hand you an advisory verdict.",
    "You approve the completion, or return it for rework, until you are satisfied.",
];

export default function MunicipalDashboard() {

    // Loading, failure and reload handling all live in the hook.
    const { stats, loading, error, reload } = useMunicipalStats();

    return (
        <div>
            <PageHeading
                title="Municipal Dashboard"
                titleHi="नगर निगम डैशबोर्ड"
                subtitle="Cleanup operations for your Municipal Corporation, from proposal to closure."
            />

            {/* Which corporation this officer is acting for. The name and city come
                from the corporation record the admin registered, so the scope is
                never ambiguous. */}
            <section className="mb-5 rounded-gov border border-rule bg-white p-4">
                <div className="flex items-start gap-3">
                    <span
                        className="mt-0.5 rounded-gov bg-gov-navy/10 p-2 text-gov-navy"
                        aria-hidden="true"
                    >
                        <Building2 size={20} />
                    </span>

                    <div>
                        <h2 className="font-serif text-lg font-bold text-gov-navy">
                            {/* Until the summary lands, keep the heading honest rather than blank */}
                            {stats?.corporationName || "Your Municipal Corporation"}
                        </h2>

                        <p className="mt-0.5 text-sm text-ink-muted">
                            {/* One city per corporation, so the city alone identifies the jurisdiction */}
                            {stats?.city || "City"}
                        </p>

                        <p className="mt-2 text-sm leading-relaxed text-ink">
                            You are the approving authority for this jurisdiction. Only
                            reports, proposals and cleanups belonging to this corporation
                            are visible here.
                        </p>
                    </div>
                </div>
            </section>

            {/* Summary failed to load - the queues below are still reachable */}
            {!loading && error && (
                <div className="mb-5">
                    <Alert type="error" title="Summary Unavailable">
                        {error}{" "}
                        <button
                            type="button"
                            onClick={reload}
                            className="font-semibold text-gov-blue underline"
                        >
                            Try again
                        </button>
                    </Alert>
                </div>
            )}

            {/* Five counters: relevant reports, pending proposals, active
                cleanups, completion reviews, completed cleanups */}
            {loading ? (
                <div
                    className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
                    aria-hidden="true"
                >
                    {[0, 1, 2, 3, 4].map((slot) => (
                        <div
                            key={slot}
                            className="h-28 animate-pulse rounded-gov border border-rule bg-paper"
                        />
                    ))}
                </div>
            ) : (
                <div className="mb-6">
                    <MunicipalStatGrid stats={stats} />
                </div>
            )}

            {/* Where to go next. Kept as real links so the browser back button
                and keyboard navigation behave normally. */}
            <section className="mb-6">
                <h2 className="mb-3 font-serif text-lg font-bold text-gov-navy">
                    <BiText en="Review Desks" hi="समीक्षा पटल" />
                </h2>

                {/* Four desks, so two rows of two on a tablet rather than three
                    across with one stranded underneath */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {QUEUE_LINKS.map((queue) => {
                        const Icon = queue.icon;

                        return (
                            <Link
                                key={queue.to}
                                to={queue.to}
                                className="rounded-gov border border-rule bg-white p-4 transition hover:border-gov-blue hover:bg-paper"
                            >
                                <span
                                    className="inline-flex rounded-gov bg-saffron/15 p-2 text-gov-navy"
                                    aria-hidden="true"
                                >
                                    <Icon size={18} />
                                </span>

                                <h3 className="mt-2 font-serif text-base font-bold text-gov-navy">
                                    <BiText en={queue.label} hi={queue.labelHi} />
                                </h3>

                                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                                    {queue.description}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </section>

            {/* The workflow, so the officer's authority is unambiguous */}
            <section className="mb-6 rounded-gov border border-rule bg-white p-4">
                <h2 className="font-serif text-lg font-bold text-gov-navy">
                    <BiText en="How a Cleanup Reaches You" hi="सफाई आपके पास कैसे आती है" />
                </h2>

                <ol className="mt-3 space-y-2">
                    {WORKFLOW_STEPS.map((step, index) => (
                        <li key={step} className="flex gap-3 text-sm text-ink">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gov-navy/10 text-xs font-bold text-gov-navy">
                                {index + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Advisory-AI principle, in the same words used on every decision screen */}
            <Alert type="info" title={AI_ADVISORY_NOTICE.title}>
                {AI_ADVISORY_NOTICE.body}
            </Alert>
        </div>
    );
}