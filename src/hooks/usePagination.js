import { useEffect, useMemo, useRef, useState } from "react";

import {
    PAGE_SIZE,
    countPages,
    paginate,
} from "@/constants/paginationConstants";

/**
 * ============================================================================
 * usePagination
 * ============================================================================
 *
 * Turns a list into pages of ten.
 *
 * Given the array a page already has - after its own filtering and
 * sorting - this returns just the slice that belongs on the current
 * page, plus everything the pager needs to describe itself.
 *
 * Two things it does that a bare `useState` would not:
 *
 * 1. It resets to page 1 whenever the length of the list changes. Change
 *    a status filter while sitting on page 4 and the result may only run
 *    to two pages; without the reset the reader is left staring at an
 *    empty list with no clue why.
 *
 * 2. It clamps. If rows are removed while you are on the last page - an
 *    administrator deleting records, say - the page number is pulled back
 *    into range on the same render rather than after an empty flash.
 * ============================================================================
 */

export default function usePagination(items, pageSize = PAGE_SIZE) {

    const [page, setPage] = useState(1);

    // Empty array literal on every render, so it is not used as a dependency
    const list = Array.isArray(items) ? items : [];

    const total = list.length;

    const totalPages = countPages(total, pageSize);

    /*
      Length is the signal for "this is a different list now".

      Comparing the arrays themselves is no use: pages rebuild filtered
      arrays on every render, so a reference check would reset the page
      constantly and the pager would never move off 1.
    */
    const previousTotal = useRef(total);

    useEffect(() => {

        if (previousTotal.current !== total) {
            previousTotal.current = total;
            setPage(1);
        }
    }, [total]);

    // Never render a page that no longer exists
    const safePage = Math.min(page, totalPages);

    const pageItems = useMemo(
        () => paginate(list, safePage, pageSize),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [items, safePage, pageSize],
    );

    /**
     * Move to a page, ignoring anything out of range so a stale button
     * press cannot strand the reader.
     */
    function goToPage(next) {

        if (next < 1 || next > totalPages || next === safePage) {
            return;
        }

        setPage(next);
    }

    /*
      Human-readable bounds for the "Showing 11-20 of 47" line. Both are
      1-based, and an empty list reports 0 to 0 rather than 1 to 0.
    */
    const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;

    const rangeEnd = Math.min(safePage * pageSize, total);

    return {
        page: safePage,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        pageSize,
        goToPage,

        // True when a pager would be a control with nothing behind it
        isSinglePage: totalPages <= 1,
    };
}
