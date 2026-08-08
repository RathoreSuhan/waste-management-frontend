import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";

import { formatDateTime } from "@/utils/formatters";

/**
 * ============================================================================
 * Reward History Item (Phase 9)
 * ============================================================================
 *
 * A single line in the cleaner's reward ledger.
 *
 * The backend reason reads "Cleanup completed for Report #12". That report
 * id is the only link back to the job that earned the points, so it is
 * pulled out and turned into a link. The pattern is matched defensively:
 * if the backend ever rewords the reason, the row falls back to plain
 * text instead of rendering a broken link.
 * ============================================================================
 */

// Matches the trailing "#12" the backend writes into every reason
const REPORT_ID_PATTERN = /Report #(\d+)/i;

export default function RewardHistoryItem({ entry }) {

    // Reason text as stored by the backend
    const reason = entry?.reason || "Reward earned";

    // Report id, when the reason follows the expected wording
    const match = reason.match(REPORT_ID_PATTERN);
    const reportId = match ? match[1] : null;

    return (
        <li className="flex items-start justify-between gap-4 border-b border-rule px-4 py-3 last:border-b-0">

            <div className="flex min-w-0 items-start gap-3">

                {/* Credit marker, decorative only */}
                <span className="mt-0.5 shrink-0 text-india-green">
                    <PlusCircle size={16} aria-hidden="true" />
                </span>

                <div className="min-w-0">

                    <p className="text-sm text-ink">
                        {reportId ? (
                            <>
                                {/* Text before the id stays as the backend wrote it */}
                                {reason.replace(REPORT_ID_PATTERN, "").trim()}{" "}

                                <Link
                                    to={`/reports/${reportId}`}
                                    className="font-semibold text-gov-blue hover:underline"
                                >
                                    Report #{reportId}
                                </Link>
                            </>
                        ) : (
                            reason
                        )}
                    </p>

                    <p className="mt-0.5 text-xs text-ink-muted">
                        {formatDateTime(entry?.createdAt)}
                    </p>
                </div>
            </div>

            {/* Credit amount - always a gain, so the sign is hardcoded */}
            <span className="shrink-0 font-serif text-base font-bold text-india-green">
                +{entry?.points ?? 0}
            </span>
        </li>
    );
}
