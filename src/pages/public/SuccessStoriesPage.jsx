import { Sparkles } from "lucide-react";

import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SuccessStoryCard from "@/components/feed/SuccessStoryCard";

import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

import useReports from "@/hooks/useReports";
import { getPublicFeed } from "@/services/publicFeedService";

/**
 * ============================================================================
 * Success Stories Page
 * ============================================================================
 *
 * Public gallery of completed, AI-verified cleanups.
 *
 * Calls GET /api/public-feed
 *
 * Open to everyone, including visitors who have never signed in. It carries
 * its own header and footer instead of using MainLayout, which sits behind
 * the login guard - the whole purpose of this page is to be readable by
 * people who do not have an account yet.
 * ============================================================================
 */

export default function SuccessStoriesPage() {

    // getPublicFeed is defined at module level, so it is already stable
    const { data: stories, loading, error, reload } = useReports(getPublicFeed, []);

    return (
        <div className="flex min-h-screen flex-col bg-paper">
            <SiteHeader />

            <main className="flex-1">

                {/* Heading band */}
                <section className="border-b border-rule bg-gov-navy text-white">
                    <div className="mx-auto max-w-7xl px-4 py-10">

                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">
                            <Sparkles size={12} aria-hidden="true" />
                            Community Success
                        </p>

                        <h1 className="mt-1 font-serif text-3xl leading-tight font-bold">
                            Cleanups Completed by the Community
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                            Every cleanup shown here was reported by a citizen, carried
                            out by a cleaner, and confirmed by comparing the photographs
                            taken before and after the work.
                        </p>
                    </div>
                </section>

                <div className="tricolour-rule" />

                {/* Gallery */}
                <section className="mx-auto max-w-7xl px-4 py-10">

                    {/* Loading */}
                    {loading && <ReportListSkeleton count={3} />}

                    {/* Failure, with a retry */}
                    {!loading && error && (
                        <ReportListError message={error} onRetry={reload} />
                    )}

                    {/* Nothing verified yet - a true state, not a fault */}
                    {!loading && !error && stories.length === 0 && (
                        <ReportListEmpty
                            title="No cleanups published yet"
                            message="Verified cleanups will appear here as reports are resolved."
                        />
                    )}

                    {/* Results */}
                    {!loading && !error && stories.length > 0 && (
                        <>
                            <p className="mb-4 text-sm text-ink-muted">
                                Showing{" "}
                                <span className="font-semibold text-ink">
                                    {stories.length}
                                </span>{" "}
                                verified {stories.length === 1 ? "cleanup" : "cleanups"}.
                            </p>

                            <div className="grid gap-5 lg:grid-cols-2">
                                {stories.map((story) => (
                                    <SuccessStoryCard
                                        key={story.reportId}
                                        story={story}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
