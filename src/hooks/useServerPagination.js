import { useCallback, useEffect, useState } from "react";

import { PAGE_SIZE } from "@/constants/paginationConstants";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * useServerPagination
 * ============================================================================
 *
 * Drives a list whose pages come from the backend.
 *
 * The difference from usePagination is where the cutting happens. That hook
 * receives a complete array and slices it in the browser; this one asks the
 * server for one page and receives only those rows, together with the totals
 * needed to describe the rest. Nothing here ever holds more than a page.
 *
 * THE FETCHER CONTRACT
 *
 *   useServerPagination(getAllReports, { params: { status: "PENDING" } })
 *
 * The fetcher is called with `{ page, size, ...params }`. `page` is
 * ZERO-based, matching Spring's Pageable, while the pager shown to the
 * reader is one-based because that is what its buttons say. The conversion
 * happens here and nowhere else: one place to get it wrong, and one place
 * it is tested.
 *
 * `params` is the hook's signal that the result set has changed. Changing a
 * filter changes it, which returns the reader to the first page - page 5 of
 * one filter is not page 5 of another, and the new set may not even reach
 * that far. Values must be plain scalars: they are serialised to tell a
 * change from a fresh object literal, which is also what keeps functions
 * out of a query string.
 *
 * LOADING, RETRY AND REFRESH
 *
 *   reload()  - show the skeleton again (used by a failed request's retry)
 *   refresh() - re-fetch silently (used after an edit, where the page on
 *               screen is still valid and should not be unmounted)
 * ============================================================================
 */

// Shape held before the first response lands
const EMPTY_PAGE = {
    content: [],
    totalElements: 0,
    totalPages: 0,
};

/**
 * Reads a response into the one shape this hook works with.
 *
 * The backend sends { content, page, size, totalElements, totalPages,
 * hasNext, hasPrevious }. A plain array is still accepted and read as a
 * single complete page, so a service that has not been moved over yet
 * cannot break a page that uses this hook.
 */
function normalize(response) {

    if (Array.isArray(response)) {
        return {
            content: response,
            totalElements: response.length,
            totalPages: response.length > 0 ? 1 : 0,
        };
    }

    if (!response || !Array.isArray(response.content)) {
        return EMPTY_PAGE;
    }

    return {
        content: response.content,
        totalElements: response.totalElements ?? response.content.length,
        totalPages: response.totalPages ?? 0,
    };
}

export default function useServerPagination(
    fetcher,
    {
        params = {},
        pageSize = PAGE_SIZE,
        fallbackMessage = "Unable to load records.",
    } = {},
) {

    const [pageData, setPageData] = useState(EMPTY_PAGE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Bumped to re-run the request on retry or a silent refresh
    const [reloadKey, setReloadKey] = useState(0);

    /*
      Which result set is being asked for.

      Callers write the object inline, so a new identity says nothing about
      whether the filters moved. Serialising gives one value that only moves
      when the filters really do - which is what both the reset below and
      the effect's dependency list are built on.
    */
    const criteriaKey = JSON.stringify(params ?? {});

    /*
      Page number and the criteria it belongs to, kept together.

      A page number without the criteria it was asked against is a number
      waiting to be wrong.
    */
    const [query, setQuery] = useState(() => ({
        page: 0,
        criteriaKey,
    }));

    /*
      Back to the first page when the criteria change.

      Done during render rather than in an effect, so the request below runs
      once with the reset page instead of once with a page number that
      belonged to the previous result set and once more after. Loading is
      raised here too, so a change of filters is announced by the skeleton.
    */
    if (criteriaKey !== query.criteriaKey) {
        setQuery({ page: 0, criteriaKey });
        setLoading(true);
    }

    useEffect(() => {

        // Prevents a late response from an abandoned request landing
        let ignore = false;

        fetcher({
            page: query.page,
            size: pageSize,
            ...JSON.parse(criteriaKey),
        })
            .then((response) => {

                if (ignore) {
                    return;
                }

                const next = normalize(response);

                setPageData(next);
                setError("");

                /*
                  The page on screen no longer exists.

                  This happens when the last row of the last page is deleted
                  by someone else, or by this reader. Rather than showing an
                  empty list under a pager that still offers page 5, the
                  reader is pulled back to the last page that does exist.
                */
                if (next.totalPages > 0 && query.page >= next.totalPages) {
                    setQuery((current) => ({
                        ...current,
                        page: next.totalPages - 1,
                    }));
                }
            })
            .catch((requestError) => {

                if (!ignore) {
                    // Convert the Axios error into a readable message
                    setError(getErrorMessage(requestError, fallbackMessage));
                }
            })
            .finally(() => {

                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetcher, query.page, criteriaKey, pageSize, reloadKey]);

    // Never render a page past the end of what the server reported
    const totalPages = Math.max(1, pageData.totalPages);
    const currentPage = Math.min(query.page, totalPages - 1);

    /**
     * Move to a page, ignoring anything out of range so a stale button
     * press cannot strand the reader. One-based, as the pager speaks.
     */
    const goToPage = useCallback(
        (next) => {

            const target = next - 1;

            if (target < 0 || target > totalPages - 1 || target === currentPage) {
                return;
            }

            setLoading(true);
            setQuery((current) => ({ ...current, page: target }));
        },
        [totalPages, currentPage],
    );

    // Retry after a failure - shows the skeleton again
    const reload = useCallback(() => {
        setLoading(true);
        setError("");
        setReloadKey((key) => key + 1);
    }, []);

    /*
      Re-fetch without showing the loading state.

      Used after an action succeeds - a deletion, a promotion - where what
      is on screen is still valid and only needs to catch up. Raising the
      loading flag would unmount the whole table and throw away anything
      the reader had open.
    */
    const refresh = useCallback(() => {
        setReloadKey((key) => key + 1);
    }, []);

    const total = pageData.totalElements;

    // Human-readable bounds for the "Showing 11 to 20 of 47" line
    const rangeStart = total === 0 ? 0 : currentPage * pageSize + 1;
    const rangeEnd = Math.min((currentPage + 1) * pageSize, total);

    return {
        pageItems: pageData.content,

        // One-based, for the Pagination component
        page: currentPage + 1,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        pageSize,

        loading,
        error,
        goToPage,
        reload,
        refresh,
    };
}
