import { useRef } from "react";

import PageHeading from "@/components/common/PageHeading";
import RewardSummaryCard from "@/components/rewards/RewardSummaryCard";
import RewardHistoryItem from "@/components/rewards/RewardHistoryItem";
import Pagination from "@/components/common/Pagination";
import useRewards from "@/hooks/useRewards";
import usePagination from "@/hooks/usePagination";

import {
    ReportListSkeleton,
    ReportListError,
    ReportListEmpty,
} from "@/components/reports/ReportListStates";

/**
 * ============================================================================
 * My Rewards (Phase 9)
 * ============================================================================
 *
 * Reward points earned by the logged-in cleaner, with the ledger of
 * individual credits behind the total.
 *
 * Data comes from GET /api/rewards/me and GET /api/rewards/history,
 * loaded together by useRewards so the total and the entries that
 * justify it always appear in the same paint.
 *
 * Every entry the backend can currently produce is a fixed 50 point
 * credit for one verified cleanup, so there is no filtering or grouping
 * here - there is only one kind of row to show.
 * ============================================================================
 */

export default function MyRewardsPage() {

    const { summary, history, loading, error, reload } = useRewards();

    // Ten credits to a page
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(history);

    // Anchor for the jump back up when the page changes
    const ledgerTopRef = useRef(null);


    return (
        <div>
            <PageHeading
                title="My Rewards"
                titleHi="मेरे पुरस्कार"
                subtitle="Points earned for cleanups verified by AI."
            />

            {/* First load - the summary and ledger arrive together */}
            {loading && <ReportListSkeleton count={3} />}

            {/* Either request failed, so the whole view is retried as one */}
            {!loading && error && (
                <ReportListError message={error} onRetry={reload} />
            )}

            {!loading && !error && (
                <div className="space-y-6">

                    {/* Headline total */}
                    <RewardSummaryCard summary={summary} entryCount={history.length} />

                    {/* Ledger */}
                    <section className="rounded-gov border border-rule bg-white">

                        <div className="border-b border-rule bg-paper px-5 py-3">
                            <h2 className="font-serif text-base font-bold text-gov-navy">
                                Reward History
                            </h2>

                            <p className="mt-0.5 text-sm text-ink-muted">
                                Every credit, most recent first.
                            </p>
                        </div>

                        {history.length > 0 ? (
                            <div ref={ledgerTopRef}>
                                <ul>
                                    {pageItems.map((entry, index) => (
                                        /**
                                         * RewardHistoryResponse carries no id, so the
                                         * timestamp is combined with the index to stay
                                         * stable even when two credits share a second.
                                         */
                                        <RewardHistoryItem
                                            key={`${entry.createdAt}-${index}`}
                                            entry={entry}
                                        />
                                    ))}
                                </ul>

                                {/* Inset so the pager sits inside the panel */}
                                <div className="px-5 pb-4">
                                    <Pagination
                                        page={page}
                                        totalPages={totalPages}
                                        total={total}
                                        rangeStart={rangeStart}
                                        rangeEnd={rangeEnd}
                                        onPageChange={goToPage}
                                        itemLabel="credits"
                                        scrollTargetRef={ledgerTopRef}
                                    />
                                </div>
                            </div>
                        ) : (

                            <div className="p-5">
                                <ReportListEmpty
                                    title="No rewards yet"
                                    description="Complete a cleanup and upload the after photograph. Once AI verifies the site is clear, your points appear here."
                                    actionLabel="Browse Available Tasks"
                                    actionTo="/cleaner/available"
                                />
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
