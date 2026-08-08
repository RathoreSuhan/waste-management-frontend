import { TrendingUp, MessageSquare, CornerDownRight, Gauge } from "lucide-react";
import { formatScore } from "@/constants/engagementConstants";

/**
 * ==========================================================
 * Engagement Bar
 * ----------------------------------------------------------
 * The breakdown strip shown under a report row.
 *
 * An engagement score on its own is an unexplained number, so
 * the parts that produced it are printed beside it:
 *
 *   engagement = urgency + (comments x 2) + (replies x 1)
 *
 * The counts come from /api/analytics/trending. That call can
 * fail independently of the report list, so `analytics` is
 * optional - the score still renders from ReportResponse and
 * only the breakdown disappears.
 * ==========================================================
 */

export default function EngagementBar({ report, analytics, rank }) {

    // Reports that were never voted on or discussed have null scores
    const engagement = report.engagementScore ?? 0;
    const urgency = report.urgencyScore ?? 0;

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-b-gov border border-t-0 border-rule bg-paper px-3.5 py-2 text-xs text-ink-muted">

            {/* Position, shown only when the list is actually ranked */}
            {rank != null && (
                <span className="font-mono text-[11px] font-semibold text-gov-navy">
                    #{rank}
                </span>
            )}

            {/* The headline number */}
            <span
                className="flex items-center gap-1 font-semibold text-gov-navy"
                title="Urgency score plus discussion activity"
            >
                <TrendingUp size={12} aria-hidden="true" />
                {formatScore(engagement)} engagement
            </span>

            {/* Average citizen urgency vote, absent until someone votes */}
            {urgency > 0 && (
                <span className="flex items-center gap-1" title="Average citizen urgency rating">
                    <Gauge size={12} aria-hidden="true" />
                    {formatScore(urgency)} / 5 urgency
                </span>
            )}

            {/* Discussion breakdown - only when analytics loaded */}
            {analytics && (
                <>
                    <span className="flex items-center gap-1">
                        <MessageSquare size={12} aria-hidden="true" />
                        {analytics.commentCount ?? 0}
                        {analytics.commentCount === 1 ? " comment" : " comments"}
                    </span>

                    {/* Replies are worth half a comment, so keep them distinct */}
                    <span className="flex items-center gap-1">
                        <CornerDownRight size={12} aria-hidden="true" />
                        {analytics.replyCount ?? 0}
                        {analytics.replyCount === 1 ? " reply" : " replies"}
                    </span>
                </>
            )}
        </div>
    );
}
