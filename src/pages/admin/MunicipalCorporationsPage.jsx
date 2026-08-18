import { useEffect, useMemo, useRef, useState } from "react";

import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus, Pencil, Search, Trash2, X } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import usePagination from "@/hooks/usePagination";


import {
    getMunicipalCorporations,
    deleteMunicipalCorporation,
} from "@/services/municipalCorporationService";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Municipal Corporations Management (Phase 5)
 * ============================================================================
 *
 * List of municipal corporation records for administrators.
 *
 * This replaces the previously planned hardcoded city mapping, so
 * administrators can add new cities and update contact details without
 * changing code.
 * ============================================================================
 */

export default function MunicipalCorporationsPage() {

    const navigate = useNavigate();

    const [corporations, setCorporations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Reload counter, incremented after every successful deletion
    const [reloadKey, setReloadKey] = useState(0);

    // Deletion confirmation dialog state
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);

    // What the administrator has typed into the search box
    const [query, setQuery] = useState("");

    /*
      What the table is actually filtered by.

      Kept apart from `query` on purpose. The box updates on every
      keystroke; this only moves when the search is submitted, so the rows
      hold still while a city name is being typed instead of reshuffling
      under the reader after every letter.
    */
    const [appliedQuery, setAppliedQuery] = useState("");

    const trimmedQuery = appliedQuery.trim();

    const isSearching = trimmedQuery.length > 0;


    /*
      Filtering happens here rather than over the network.

      The whole register is already in memory from the load above, and it
      is a list of cities - tens of rows, not thousands. Matching them
      locally answers on the keystroke, with no debounce and no spinner.

      The backend's /city/{city} route is deliberately not used for this:
      it matches a city name exactly, so it would find nothing until the
      name were typed in full and correctly - useless while typing.

      All four visible columns are searched, because an administrator
      chasing a wrong phone number or a bounced email should be able to
      paste that value in rather than first recalling which city it
      belonged to.
    */
    const filtered = useMemo(() => {

        /*
          Newest first. The API returns these in insertion order, so the
          first body ever registered sat at the top. Sorted by id
          descending because the response carries no date field - id is
          auto-increment, so a higher id is the more recent record. Copied
          before sorting, as sort() works in place.
        */
        const newestFirst = [...corporations].sort(
            (a, b) => (b.id ?? 0) - (a.id ?? 0)
        );

        // Sorted before filtering, so search results are newest first too
        if (!isSearching) {
            return newestFirst;
        }

        const needle = trimmedQuery.toLowerCase();

        return newestFirst.filter((corp) =>
            [corp.city, corp.organizationName, corp.phone, corp.email]
                // A record missing an optional field must not break the search
                .filter(Boolean)
                .some((field) => String(field).toLowerCase().includes(needle))
        );
    }, [corporations, isSearching, trimmedQuery]);

    /*
      Ten corporations to a page, over the filtered list.

      usePagination resets to page 1 whenever the count changes, so
      narrowing the search while on page 3 cannot strand the reader on a
      page that no longer exists.
    */
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(filtered);

    // Anchor for the jump back up when the page changes
    const tableTopRef = useRef(null);

    // The search box itself, so submitting can take focus off it
    const searchInputRef = useRef(null);

    /**
     * Run the search.
     *
     * This is the only place the filter moves. Promoting what is in the box
     * to `appliedQuery` is what narrows the table, so nothing happens until
     * the administrator asks for it - by pressing the button or hitting
     * Enter, since this is a submit inside a form.
     *
     * The blur afterwards closes the on-screen keyboard on a phone, which
     * would otherwise cover the rows just asked for.
     */
    function handleSearchSubmit(event) {
        event.preventDefault();

        setAppliedQuery(query);

        searchInputRef.current?.blur();

        tableTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }

    /**
     * Empty the box and restore the full register in one press.
     *
     * Both pieces of state have to go: clearing only the box would leave
     * the old results on screen under an empty search field.
     */
    function clearSearch() {
        setQuery("");
        setAppliedQuery("");
    }




    /**
     * Load all corporations on mount and after every deletion.
     */
    useEffect(() => {

        let ignore = false;

        getMunicipalCorporations()

            .then((data) => {
                if (!ignore) {
                    setCorporations(data);
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(
                        getErrorMessage(err, "Municipal corporations could not be loaded.")
                    );
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
    }, [reloadKey]);

    /**
     * Opens the confirmation dialog for a corporation.
     */
    const confirmDelete = (corp) => {
        setDeleteTarget(corp);
        setDeleteError("");
    };

    /**
     * Closes the confirmation dialog.
     */
    const cancelDelete = () => {
        if (!deleting) {
            setDeleteTarget(null);
            setDeleteError("");
        }
    };

    /**
     * Executes the deletion after confirmation.
     */
    const executeDelete = () => {

        if (!deleteTarget) {
            return;
        }

        setDeleting(true);
        setDeleteError("");

        deleteMunicipalCorporation(deleteTarget.id)
            .then(() => {
                // Close the dialog and reload the list
                setDeleteTarget(null);
                setReloadKey((key) => key + 1);
            })
            .catch((err) => {
                // Error is shown inside the dialog so the user can retry
                setDeleteError(
                    getErrorMessage(err, "This record could not be removed.")
                );
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    return (
        <div>
            <PageHeading
                title="Municipal Corporations"
                titleHi="नगर निगम"
                subtitle="Manage city-wise municipal corporation contact details."
                action={
                    /*
                      A link rather than a Button, since this navigates.
                      Button renders a real <button>, which would need an
                      onClick handler to move anywhere.
                    */
                    <Link
                        to="/admin/municipal-corporations/new"
                        className="inline-flex items-center gap-1.5 rounded-gov border border-gov-blue bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                    >
                        <Plus size={16} aria-hidden="true" />
                        Add Corporation
                    </Link>
                }

            />

            <div>

                {/* Load failure */}
                {error && (
                    <Alert type="error" title="Could not load records">
                        {error}
                    </Alert>
                )}

                {/* Loading */}
                {loading && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center text-sm text-ink-muted">
                        Loading municipal corporations…
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && corporations.length === 0 && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center">
                        <Building2
                            size={32}
                            className="mx-auto text-ink-muted"
                            aria-hidden="true"
                        />
                        <p className="mt-3 font-semibold text-ink">
                            No municipal corporations registered yet
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                            Add a corporation to establish contact routing for a city.
                        </p>
                        <Link
                            to="/admin/municipal-corporations/new"
                            className="mt-4 inline-flex items-center gap-1.5 rounded-gov border border-gov-blue bg-gov-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                        >
                            <Plus size={16} aria-hidden="true" />
                            Add First Corporation
                        </Link>

                    </div>
                )}

                {/* Corporation list */}
                {!loading && corporations.length > 0 && (
                    <div className="rounded-gov border border-rule bg-white">

                        <div className="border-b border-rule bg-paper px-5 py-3">
                            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                {isSearching
                                    ? `Showing ${total} of ${corporations.length} corporation${corporations.length !== 1 ? "s" : ""}`
                                    : `Registered Corporations (${total})`}

                            </h2>
                        </div>

                        {/* Search bar */}
                        <div className="border-b border-rule bg-paper px-5 py-3">

                            {/*
                              A form, so Enter and the button follow the same
                              path. role="search" marks the whole thing as the
                              search landmark for a screen reader.
                            */}
                            <form
                                role="search"
                                onSubmit={handleSearchSubmit}
                                className="flex items-center gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search
                                        size={15}
                                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                                        aria-hidden="true"
                                    />

                                    {/*
                                      type="text", not "search". Chrome draws
                                      its own clear button inside a search
                                      field, which sat on top of ours and
                                      showed two crosses. Plain text leaves
                                      just the one below, styled to match
                                      the page.
                                    */}
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search by city, organisation, email or phone…"
                                        aria-label="Search municipal corporations"
                                        className="w-full rounded-gov border border-rule bg-white py-2 pr-9 pl-9 text-sm text-ink outline-none transition focus:border-gov-blue"
                                    />

                                    {/*
                                      Offered as soon as there is anything to
                                      clear - including text not yet searched
                                      for, which is exactly when someone
                                      changes their mind mid-word.
                                    */}
                                    {query.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearSearch}
                                            className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-ink-muted transition hover:text-ink"
                                            aria-label="Clear search"
                                        >
                                            <X size={15} aria-hidden="true" />
                                        </button>
                                    )}

                                </div>

                                {/*
                                  The button stays enabled on an empty box.
                                  Pressing it then is harmless - it re-runs
                                  the unfiltered list - and a control that
                                  greys out for no visible reason reads as
                                  broken.
                                */}
                                <button
                                    type="submit"
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                                >
                                    <Search size={15} aria-hidden="true" />
                                    Search
                                </button>
                            </form>
                        </div>


                        {/*
                          A search that matches nothing gets its own message.
                          This is not the same as an empty register, so it
                          must not offer "Add First Corporation" - the record
                          being looked for may well already exist.
                        */}
                        {total === 0 ? (
                            <div className="p-8 text-center">
                                <Search
                                    size={28}
                                    className="mx-auto text-ink-muted"
                                    aria-hidden="true"
                                />
                                <p className="mt-3 font-semibold text-ink">
                                    No corporations match &ldquo;{trimmedQuery}&rdquo;
                                </p>
                                <p className="mt-1 text-sm text-ink-muted">
                                    Check the spelling, or clear the search to see all{" "}
                                    {corporations.length} registered corporations.
                                </p>

                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="mt-4 inline-flex items-center gap-1.5 rounded-gov border border-gov-blue bg-white px-4 py-2 text-sm font-semibold text-gov-blue transition hover:bg-gov-blue/5"
                                >
                                    <X size={14} aria-hidden="true" />
                                    Clear Search
                                </button>

                            </div>
                        ) : (
                          <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                {/*
                                  Interior columns at px-3, as in the other two
                                  registers, so the Actions column stays inside
                                  the panel. First and last cells keep px-5 to
                                  line up with the panel heading above.
                                */}
                                <thead className="border-b border-rule bg-paper text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                    <tr>
                                        <th className="px-5 py-3">City</th>
                                        <th className="px-3 py-3">Organisation</th>
                                        <th className="px-3 py-3">Contact Number</th>
                                        <th className="px-3 py-3">Email</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-rule text-sm">
                                    {pageItems.map((corp) => (

                                        <tr
                                            key={corp.id}
                                            className="transition hover:bg-paper"
                                        >
                                            <td className="px-5 py-3 font-semibold text-gov-navy">
                                                {corp.city}
                                            </td>
                                            <td className="px-3 py-3 text-ink">
                                                {corp.organizationName}
                                            </td>
                                            <td className="px-3 py-3 text-ink-muted">
                                                {corp.phone}
                                            </td>
                                            <td className="px-3 py-3 text-ink-muted">
                                                {corp.email}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/admin/municipal-corporations/edit/${corp.id}`
                                                            )
                                                        }
                                                        className="rounded border border-gov-blue bg-gov-blue/5 p-1.5 text-gov-blue transition hover:bg-gov-blue/10"
                                                        aria-label={`Edit ${corp.city}`}
                                                    >
                                                        <Pencil size={14} aria-hidden="true" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => confirmDelete(corp)}
                                                        className="rounded border border-red-700 bg-red-50 p-1.5 text-red-700 transition hover:bg-red-100"
                                                        aria-label={`Remove ${corp.city}`}
                                                    >
                                                        <Trash2 size={14} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Inset so the pager sits inside the panel */}
                        <div className="px-5 pb-4">
                            <Pagination
                                page={page}
                                totalPages={totalPages}
                                total={total}
                                rangeStart={rangeStart}
                                rangeEnd={rangeEnd}
                                onPageChange={goToPage}
                                itemLabel="corporations"
                                scrollTargetRef={tableTopRef}
                            />
                        </div>
                          </>
                        )}
                    </div>
                )}
            </div>


            {/* Deletion confirmation */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Municipal Corporation"
                description={`Remove the record for ${deleteTarget?.city}? Reports filed in this city will no longer have municipal contact details attached.`}
                confirmLabel="Remove"
                error={deleteError}
                busy={deleting}
                onConfirm={executeDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
}
