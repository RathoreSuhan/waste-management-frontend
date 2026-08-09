import { Link } from "react-router-dom";
import {
    FilePlus2,
    Search,
    ClipboardCheck,
    LogIn,
    UserPlus,
    LayoutDashboard,
    Users,
    ArrowRight,
} from "lucide-react";

import HomeSuccessSection from "@/components/feed/HomeSuccessSection";
import HomeImpactBand from "@/components/home/HomeImpactBand";
import HomeRolesSection from "@/components/home/HomeRolesSection";
import HomeTopCleaners from "@/components/home/HomeTopCleaners";

import useAuth from "@/hooks/useAuth";
import { getDashboardPath } from "@/utils/roleRedirect";

import heroImage from "@/assets/homepage-hero.webp";

/**
 * ============================================================================
 * Home Page
 * ============================================================================
 *
 * Public landing page - visible to everyone.
 *
 * The masthead, navigation and footer come from PublicLayout, so this file
 * contains only the page content. Rendering them here as well would put a
 * second copy of each on the screen.
 *
 * The call to action changes with the session, so a logged-in visitor is
 * never stranded here without a route back into the app.
 *
 * Reading order is deliberate: what the platform is, what it has done,
 * how it works, who it is for, what it has produced, who is leading, and
 * only then the invitation to join. Each section earns the next.
 * ============================================================================
 */

// How the reporting process works, stated in three plain steps
const PROCESS_STEPS = [
    {
        icon: FilePlus2,
        title: "File a Report",
        description:
            "Submit a photograph of the waste site along with its location. A reference number is issued immediately.",
    },
    {
        icon: ClipboardCheck,
        title: "Assigned to a Cleaner",
        description:
            "The report is verified and passed to a cleanup team working in that locality.",
    },
    {
        icon: Search,
        title: "Track till Closure",
        description:
            "Follow your report from the moment it is filed through to resolution using its reference number.",
    },
];

export default function HomePage() {

    // Session information
    const { isAuthenticated, user } = useAuth();

    return (
        <>
                {/* ---------------- Hero band ---------------- */}
                {/*
                  A photograph rather than the flat gradient band used on
                  interior pages. This is the one screen where a visitor
                  decides whether the platform is real, and a picture of
                  the problem argues that faster than a paragraph.
                */}
                <section className="relative border-b border-rule text-white">

                    {/* Decorative, so it carries no alternative text */}
                    <img
                        src={heroImage}
                        alt=""
                        aria-hidden="true"
                        fetchPriority="high"
                        className="absolute inset-0 h-full w-full object-cover"
                    />

                    {/*
                      Navy scrim, weighted to the left where the text sits.
                      Solid at that edge and thinning across, so the
                      headings hold their contrast while the photograph
                      stays visible on the right.
                    */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-r from-gov-navy via-gov-navy/90 to-gov-navy/60"
                    />

                    <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">

                        <div className="max-w-3xl">

                            {/* States who runs this, rather than claiming a scheme */}
                            <p className="inline-flex items-center gap-1.5 border border-white/25 px-2.5 py-1 text-[11px] font-semibold tracking-[0.15em] uppercase">
                                <Users size={12} aria-hidden="true" />
                                A Community Initiative
                            </p>

                            {/* Devanagari sits above the English title */}
                            <p className="mt-5 font-serif text-xl text-white/80">
                                कचरा रिपोर्टिंग मंच
                            </p>

                            <h1 className="mt-1 font-serif text-3xl leading-tight font-bold lg:text-5xl">
                                Community Waste Reporting Platform
                            </h1>

                            {/* Saffron rule, the standard section marker */}
                            <div className="mt-4 h-1 w-20 bg-saffron" />

                            <p className="mt-5 max-w-2xl leading-relaxed text-white/85">
                                Uncollected waste in your neighbourhood is everybody's
                                problem, and it usually goes unreported. File it here and
                                every report is recorded against a reference number, passed
                                to a cleanup team, and tracked until the site is cleared.
                            </p>

                            {/* Session aware actions */}
                            <div className="mt-7 flex flex-wrap gap-3">

                                {isAuthenticated ? (
                                    // Logged in - straight to the matching dashboard
                                    <Link
                                        to={getDashboardPath(user?.role)}
                                        className="inline-flex items-center gap-2 rounded-gov border border-white bg-white px-6 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-white/90"
                                    >
                                        <LayoutDashboard size={15} aria-hidden="true" />
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    // Guest - offer sign in and registration
                                    <>
                                        <Link
                                            to="/login"
                                            className="inline-flex items-center gap-2 rounded-gov border border-white bg-white px-6 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-white/90"
                                        >
                                            <LogIn size={15} aria-hidden="true" />
                                            Citizen Sign In
                                        </Link>

                                        <Link
                                            to="/register"
                                            className="inline-flex items-center gap-2 rounded-gov border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                                        >
                                            <UserPlus size={15} aria-hidden="true" />
                                            New Registration
                                        </Link>
                                    </>
                                )}

                                {/*
                                  Reading needs no account, and saying so
                                  keeps a curious visitor from bouncing at
                                  the sight of two sign-in buttons.
                                */}
                                <Link
                                    to="/reports"
                                    className="inline-flex items-center gap-2 px-2 py-2.5 text-sm font-semibold text-white/85 underline-offset-4 transition hover:text-white hover:underline"
                                >
                                    Browse reports without an account
                                    <ArrowRight size={15} aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Accent rule closes the hero band */}
                <div className="tricolour-rule" />

                {/* ---------------- Impact ---------------- */}
                {/*
                  Placed immediately after the promise so it is answered
                  with evidence before anything is asked of the reader.
                  Counted from public endpoints, and removes itself if
                  there is nothing to count.
                */}
                <HomeImpactBand />

                {/* ---------------- Process ---------------- */}
                <section className="mx-auto max-w-7xl px-4 py-12">

                    <div className="border-b border-rule pb-3">
                        <h2 className="font-serif text-2xl font-bold text-gov-navy">
                            How the Process Works
                        </h2>

                        <div className="mt-1.5 h-0.5 w-12 bg-saffron" />
                    </div>

                    {/* Numbered steps, so the sequence is unambiguous */}
                    <ol className="mt-6 grid gap-4 md:grid-cols-3">
                        {PROCESS_STEPS.map((step, index) => (
                            <li
                                key={step.title}
                                className="rounded-gov border border-rule bg-white p-5"
                            >
                                <div className="flex items-center gap-3">
                                    {/* Step number in a solid navy square */}
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-gov bg-gov-navy text-sm font-bold text-white">
                                        {index + 1}
                                    </span>

                                    <step.icon
                                        size={18}
                                        className="text-gov-blue"
                                        aria-hidden="true"
                                    />
                                </div>

                                <h3 className="mt-3 font-serif text-lg font-bold text-gov-navy">
                                    {step.title}
                                </h3>

                                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                                    {step.description}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* ---------------- Roles ---------------- */}
                {/*
                  Follows the process, because "who does this" only makes
                  sense once "what happens" has been read.
                */}
                <HomeRolesSection />

                {/* ---------------- Community success ---------------- */}
                {/*
                  Placed after the process so the reader learns how the
                  service works before being shown what it has produced.
                  Renders nothing until there are verified cleanups to show.
                */}
                <HomeSuccessSection />

                {/* ---------------- Recognition ---------------- */}
                <HomeTopCleaners />

                {/* ---------------- Public notice ---------------- */}

                <section className="mx-auto max-w-7xl px-4 py-12">
                    <div className="rounded-gov border border-rule border-l-4 border-l-saffron bg-white p-5">

                        <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                            Before You Report
                        </h2>

                        <p className="mt-2 text-sm leading-relaxed text-ink">
                            Please attach a clear photograph and the exact location, as
                            incomplete reports take longer to assign to a cleanup team. If
                            somebody has already reported the same spot, your report is
                            linked to that existing one instead of creating a duplicate.
                        </p>

                        {/* Ownership is stated up front, not just buried in the footer */}
                        <p className="mt-3 border-t border-rule pt-3 text-xs leading-relaxed text-ink-muted">
                            This platform is an independent community project. It is not run
                            by, affiliated with, or endorsed by any government department.
                        </p>
                    </div>
                </section>

                {/* ---------------- Closing call to action ---------------- */}
                {/*
                  Shown only to guests. A signed-in visitor has already
                  acted on this, and repeating the invitation at the foot
                  of the page would be addressing somebody who is not there.
                */}
                {!isAuthenticated && (
                    <section className="hero-band border-t border-rule text-white">
                        <div className="mx-auto max-w-7xl px-4 py-12 text-center">

                            <h2 className="font-serif text-2xl font-bold lg:text-3xl">
                                Seen a waste site that needs clearing?
                            </h2>

                            <div className="mx-auto mt-3 h-1 w-20 bg-saffron" />

                            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-white/85">
                                Registration takes a minute. Reporting a site takes a
                                photograph and its location.
                            </p>

                            <div className="mt-6 flex flex-wrap justify-center gap-3">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center gap-2 rounded-gov border border-white bg-white px-6 py-2.5 text-sm font-semibold text-gov-navy transition hover:bg-white/90"
                                >
                                    <UserPlus size={15} aria-hidden="true" />
                                    Create an Account
                                </Link>

                                <Link
                                    to="/success-stories"
                                    className="inline-flex items-center gap-2 rounded-gov border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                                >
                                    See What Has Been Cleaned
                                    <ArrowRight size={15} aria-hidden="true" />
                                </Link>
                            </div>
                        </div>
                    </section>
                )}
        </>
    );
}
