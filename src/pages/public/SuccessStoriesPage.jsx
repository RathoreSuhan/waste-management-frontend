import { Sparkles } from "lucide-react";

import PageIntro from "@/components/layout/PageIntro";
import PageSection from "@/components/layout/PageSection";
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
 * Open to everyone, including visitors who have never signed in - the whole
 * purpose of the page is to be readable by people without an account.
 *
 * Also reachable at /app/success-stories from the sidebar, where the same
 * component renders inside the signed-in shell. PageIntro handles the
 * difference between the two openings.
 * ============================================================================
 */

export default function SuccessStoriesPage() {

    // getPublicFeed is defined at module level, so it is already stable
    const { data: stories, loading, error, reload } = useReports(getPublicFeed, []);

    return (
        <>
            {/* Band on the public site, page heading inside the shell */}
            <PageIntro
                icon={Sparkles}
                eyebrow="Community Success"
                en="Cleanups Completed by the Community"
                hi="पूर्ण हुई सफाई"
                description="Every cleanup shown here was reported by a citizen, carried out by a cleaner, and confirmed by comparing the photographs taken before and after the work."
            />

            {/* Gallery */}
            <PageSection>

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
                        description="Verified cleanups will appear here as reports are resolved."
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
            </PageSection>
        </>
    );
}


