import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import {
    Users,
    UserCheck,
    Sparkles,
    FileText,
    Clock,
    CheckCircle2,
    ShieldCheck,
    MessageSquare,
    ThumbsUp,
    Trophy,
    Building2,
    ArrowRight,
} from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import StatCard from "@/components/common/StatCard";
import Alert from "@/components/ui/Alert";
import { getDashboard } from "@/services/adminService";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Admin Dashboard (Phase 12)
 * ============================================================================
 *
 * Platform statistics for administrators.
 * Data comes from GET /api/admin/dashboard.
 *
 * Every figure is taken straight from that response. Nothing is derived
 * or estimated here - a number the backend does not count is simply not
 * shown, rather than approximated from something else.
 * ============================================================================
 */

export default function AdminDashboard() {

    // Statistics from the backend
    const [stats, setStats] = useState(null);

    // True until the first response arrives
    const [loading, setLoading] = useState(true);

    // Failure message, cleared on every new attempt
    const [error, setError] = useState("");

    // Counter used to re-run the request when the retry link is used
    const [reloadKey, setReloadKey] = useState(0);

    /**
     * Fetch the statistics on mount, and again on every retry.
     *
     * The state updates all sit inside the promise callbacks rather
     * than the effect body, so the fetch never triggers a cascading
     * render on the way in.
     */
    useEffect(() => {

        // Prevents state updates from an outdated request
        let ignore = false;

        getDashboard()
            .then((data) => {
                if (!ignore) {
                    setStats(data);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (!ignore) {
                    setError(
                        getErrorMessage(
                            requestError,
                            "Platform statistics could not be loaded."
                        )
                    );
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        // Cleanup runs when the component unmounts or reloads
        return () => {
            ignore = true;
        };
    }, [reloadKey]);

    /**
     * Retry after a failure - raises the loading state again so the
     * figures fall back to dashes while the request is in flight.
     */
    const reload = () => {
        setLoading(true);
        setError("");
        setReloadKey((key) => key + 1);
    };


    /**
     * Renders a figure, or a dash while it is unavailable.
     *
     * A missing count reads as "—" rather than 0, because zero is a
     * real and meaningful value on this page and the two must not be
     * confused while the request is still running.
     */
    const figure = (value) =>
        loading || value === null || value === undefined ? "—" : String(value);

    return (
        <div>
            <PageHeading
                title="Administration Dashboard"
                titleHi="प्रशासन डैशबोर्ड"
                subtitle="Platform statistics, user administration and report administration."
            />

            <div className="space-y-6">

                {/* Load failure - the figures below fall back to dashes */}
                {error && (
                    <Alert type="error" title="Statistics unavailable">
                        {error}{" "}
                        <button
                            type="button"
                            onClick={reload}

                            className="font-semibold underline"
                        >
                            Try again
                        </button>
                    </Alert>
                )}

                {/* Registered users, by designation */}
                <section>
                    <h2 className="mb-3 border-b border-rule pb-2 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Registered Users
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Users"
                            value={figure(stats?.totalUsers)}
                            description="All accounts registered on the platform."
                            accent="navy"
                            icon={Users}
                        />
                        <StatCard
                            title="Citizens"
                            value={figure(stats?.totalCitizens)}
                            description="Accounts that file and support reports."
                            accent="blue"
                            icon={UserCheck}
                        />
                        <StatCard
                            title="Sanitation Officers"
                            value={figure(stats?.totalCleaners)}
                            description="Accounts that claim and complete cleanups."
                            accent="green"
                            icon={Sparkles}
                        />
                        <StatCard
                            title="Administrators"
                            value={figure(stats?.totalAdmins)}
                            description="Accounts with platform administration rights."
                            accent="saffron"
                            icon={ShieldCheck}
                        />
                    </div>
                </section>

                {/* Report and cleanup progress */}
                <section>
                    <h2 className="mb-3 border-b border-rule pb-2 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Reports and Cleanups
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Total Reports"
                            value={figure(stats?.totalReports)}
                            description="Waste reports filed since launch."
                            accent="navy"
                            icon={FileText}
                        />
                        <StatCard
                            title="Pending"
                            value={figure(stats?.pendingReports)}
                            description="Reports awaiting cleanup action."
                            accent="saffron"
                            icon={Clock}
                        />
                        <StatCard
                            title="Resolved"
                            value={figure(stats?.completedReports)}
                            description="Reports closed after cleanup."
                            accent="green"
                            icon={CheckCircle2}
                        />
                        <StatCard
                            title="AI Verified"
                            value={figure(stats?.verifiedCleanups)}
                            description="Cleanups confirmed by image validation."
                            accent="blue"
                            icon={ShieldCheck}
                        />
                    </div>
                </section>

                {/* Community participation */}
                <section>
                    <h2 className="mb-3 border-b border-rule pb-2 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Community Participation
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            title="Comments"
                            value={figure(stats?.totalComments)}
                            description="Discussion entries across all reports."
                            accent="blue"
                            icon={MessageSquare}
                        />
                        <StatCard
                            title="Urgency Ratings"
                            value={figure(stats?.totalVotes)}
                            description="Citizen ratings recorded on reports."
                            accent="navy"
                            icon={ThumbsUp}
                        />

                        {/* Leaderboard leader - null until points are earned */}
                        <StatCard
                            title="Leading Officer"
                            value={
                                loading
                                    ? "—"
                                    : stats?.topCleaner || "Not yet awarded"
                            }
                            description="Highest ranked officer by reward points."
                            accent="saffron"
                            icon={Trophy}
                        />
                    </div>
                </section>

                {/* Administration sections */}
                <section className="rounded-gov border border-rule bg-white">

                    <div className="border-b border-rule bg-paper px-5 py-3">
                        <h2 className="font-serif text-base font-bold text-gov-navy">
                            Management
                        </h2>
                    </div>

                    <div className="grid gap-px bg-rule sm:grid-cols-3">

                        <ManagementLink
                            to="/admin/users"
                            icon={Users}
                            title="User Administration"
                            description="Review accounts, promote citizens and remove users."
                        />

                        <ManagementLink
                            to="/admin/reports"
                            icon={FileText}
                            title="Report Administration"
                            description="Search, filter and remove waste reports."
                        />

                        <ManagementLink
                            to="/admin/municipal-corporations"
                            icon={Building2}
                            title="Municipal Corporations"
                            description="Maintain city-wise municipal contact details."
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

/**
 * Single entry in the management panel.
 */
function ManagementLink({ to, icon: Icon, title, description }) {

    return (
        <Link
            to={to}
            className="group flex items-start gap-3 bg-white p-5 transition hover:bg-paper"
        >
            <span className="mt-0.5 rounded-gov border border-rule bg-paper p-2 text-gov-blue">
                <Icon size={16} aria-hidden="true" />
            </span>

            <span className="flex-1">
                <span className="flex items-center gap-1 font-semibold text-gov-navy group-hover:text-gov-blue">
                    {title}

                    <ArrowRight
                        size={13}
                        className="transition group-hover:translate-x-0.5"
                        aria-hidden="true"
                    />
                </span>

                <span className="mt-1 block text-sm text-ink-muted">
                    {description}
                </span>
            </span>
        </Link>
    );
}
