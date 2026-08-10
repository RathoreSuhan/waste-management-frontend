import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * ============================================================================
 * Pagination
 * ============================================================================
 *
 * The pager shown under every list of ten in the portal.
 *
 * Two halves: a plain sentence saying which records are on screen, and
 * the controls to move between pages. The sentence matters as much as
 * the buttons - "Showing 11 to 20 of 47 records" tells the reader both
 * where they are and how much is left, which a row of numbers alone
 * does not.
 *
 * Long runs are collapsed with ellipses so the control never wraps: the
 * first page, the last page, and a window around the current one are
 * always reachable, and everything between is folded away.
 *
 * The pager renders nothing when there is only one page. A single
 * disabled "1" button is noise on a list of three records.
 * ============================================================================
 */

/**
 * Which page numbers to show, given where the reader is.
 *
 * Up to seven pages are listed in full - that fits comfortably and
 * avoids ellipses on lists that barely need paging. Beyond that the
 * first and last are pinned and a window of three follows the current
 * page, with "…" standing in for the rest.
 */
function buildPageList(current, totalPages) {

    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];

    const windowStart = Math.max(2, current - 1);
    const windowEnd = Math.min(totalPages - 1, current + 1);

    // Gap between the first page and the window
    if (windowStart > 2) {
        pages.push("start-ellipsis");
    }

    for (let page = windowStart; page <= windowEnd; page += 1) {
        pages.push(page);
    }

    // Gap between the window and the last page
    if (windowEnd < totalPages - 1) {
        pages.push("end-ellipsis");
    }

    pages.push(totalPages);

    return pages;
}

export default function Pagination({
    // Current page, 1-based
    page,

    totalPages,

    // Total records across all pages, and the slice on screen
    total,
    rangeStart,
    rangeEnd,

    // Called with the requested page number
    onPageChange,

    /*
      What is being counted, for the sentence and the labels: "reports",
      "records", "tasks". Kept generic by default so a caller that does
      not care still reads correctly.
    */
    itemLabel = "records",

    /*
      Anchor to scroll back to when the page changes. Without it, moving
      to page 2 leaves the reader looking at the pager with ten new rows
      above them, off screen.
    */
    scrollTargetRef,
}) {

    // Used when no anchor is supplied, so the button still behaves
    const fallbackRef = useRef(null);

    if (totalPages <= 1) {
        return null;
    }

    const pages = buildPageList(page, totalPages);

    function handleChange(next) {

        if (next === page) {
            return;
        }

        onPageChange(next);

        /*
          Back to the head of the list, so page 2 starts at its first
          record rather than in the middle of it. Instant rather than
          smooth: this is a jump between two sets of results, not a
          journey through them, and a smooth scroll here fights the
          fresh content painting underneath it.
        */
        const anchor = scrollTargetRef?.current ?? fallbackRef.current;

        if (anchor) {
            const top =
                anchor.getBoundingClientRect().top + window.scrollY - 96;

            window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
        }
    }

    return (
        <nav
            ref={fallbackRef}
            aria-label="Pagination"
            className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-rule pt-4 sm:flex-row"
        >

            {/*
              The count, phrased as a sentence.

              aria-live so a screen reader hears "Showing 11 to 20 of 47
              reports" after paging, rather than being left to work out
              that anything changed at all.
            */}
            <p
                aria-live="polite"
                className="text-xs text-ink-muted tabular-nums"
            >
                Showing{" "}
                <span className="font-semibold text-ink">
                    {rangeStart}
                </span>
                {" to "}
                <span className="font-semibold text-ink">
                    {rangeEnd}
                </span>
                {" of "}
                <span className="font-semibold text-ink">
                    {total}
                </span>
                {" "}
                {itemLabel}
            </p>

            <div className="flex items-center gap-1">

                {/* Previous */}
                <button
                    type="button"
                    onClick={() => handleChange(page - 1)}
                    disabled={page === 1}
                    className="inline-flex items-center gap-1 rounded-gov border border-rule bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:border-gov-blue hover:text-gov-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-ink"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={14} aria-hidden="true" />
                    <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page numbers */}
                {pages.map((entry) => {

                    // Folded-away run, not a destination
                    if (typeof entry === "string") {
                        return (
                            <span
                                key={entry}
                                aria-hidden="true"
                                className="px-1 text-xs text-ink-muted"
                            >
                                …
                            </span>
                        );
                    }

                    const isCurrent = entry === page;

                    return (
                        <button
                            key={entry}
                            type="button"
                            onClick={() => handleChange(entry)}
                            aria-current={isCurrent ? "page" : undefined}
                            aria-label={`Page ${entry}`}
                            className={`min-w-[2rem] rounded-gov border px-2 py-1.5 text-xs font-semibold tabular-nums transition ${isCurrent
                                ? "border-gov-blue bg-gov-blue text-white"
                                : "border-rule bg-white text-ink hover:border-gov-blue hover:text-gov-blue"
                                }`}
                        >
                            {entry}
                        </button>
                    );
                })}

                {/* Next */}
                <button
                    type="button"
                    onClick={() => handleChange(page + 1)}
                    disabled={page === totalPages}
                    className="inline-flex items-center gap-1 rounded-gov border border-rule bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:border-gov-blue hover:text-gov-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-ink"
                    aria-label="Next page"
                >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={14} aria-hidden="true" />
                </button>
            </div>
        </nav>
    );
}
