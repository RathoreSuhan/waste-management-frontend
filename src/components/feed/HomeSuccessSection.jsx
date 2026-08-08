import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

import SuccessStoryCard from "@/components/feed/SuccessStoryCard";
import useReports from "@/hooks/useReports";
import { getPublicFeed } from "@/services/publicFeedService";

/**
 * ============================================================================
 * Home Success Section
 * ============================================================================
 *
 * A short preview of recent verified cleanups for the landing page.
 *
 * The section removes itself entirely while loading, on failure, or when
 * nothing has been published yet. A landing page is a first impression:
 * an empty shelf or a red error box under a heading promising results
 * would argue against the programme more effectively than the section
 * argues for it. The full gallery carries those states properly, because
 * a visitor who asked for the list deserves to know why it is empty.
 * ============================================================================
 */

// Enough to show a pattern, few enough to stay a preview
const PREVIEW_COUNT = 2;

export default function HomeSuccessSection() {

    // getPublicFeed is module level, so the reference is already stable
    const { data: stories, loading, error } = useReports(getPublicFeed, []);

    // Say nothing rather than say something discouraging
    if (loading || error || stories.length === 0) {
        return null;
    }

    return (
        <section className="border-t border-rule bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                            <Sparkles size={12} aria-hidden="true" />
                            Community Success
                        </p>

                        <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy">
                            Recently Cleaned
                        </h2>

                        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
                            Reported by citizens, cleaned by our teams, and confirmed
                            by comparing the before and after photographs.
                        </p>
                    </div>

                    <Link
                        to="/success-stories"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-gov-blue hover:underline"
                    >
                        View all success stories
                        <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {stories.slice(0, PREVIEW_COUNT).map((story) => (
                        <SuccessStoryCard key={story.reportId} story={story} />
                    ))}
                </div>
            </div>
        </section>
    );
}
