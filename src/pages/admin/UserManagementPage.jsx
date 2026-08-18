import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, Users, ArrowUpCircle, Trash2, Eye } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import RoleBadge from "@/components/admin/RoleBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Pagination from "@/components/common/Pagination";
import usePagination from "@/hooks/usePagination";

import {
    getUsers,
    searchUsers,
    promoteToAdmin,
    deleteUser,
} from "@/services/adminService";
import {
    USER_ROLE_FILTERS,
    canPromote,
    canDelete,
} from "@/constants/adminConstants";
import { formatDateTime } from "@/utils/formatters";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * User Management (Phase 12)
 * ============================================================================
 *
 * Register of every account on the platform, with promotion and
 * deletion.
 *
 * Search and filter are two separate backend endpoints. When a keyword
 * is present the search endpoint is used (which accepts a role as well);
 * otherwise the plain list endpoint is used. Both are driven from the
 * same state so the two controls behave as one to the administrator.
 * ============================================================================
 */

export default function UserManagementPage() {

    // Register contents
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // What is currently typed into the search box
    const [keywordInput, setKeywordInput] = useState("");

    // The keyword actually applied - only updated on submit
    const [keyword, setKeyword] = useState("");

    // Role filter, "ALL" meaning no role parameter is sent
    const [role, setRole] = useState("ALL");

    // Bumped after a promotion or deletion to refresh the register
    const [reloadKey, setReloadKey] = useState(0);

    // Confirmation dialog state, shared by both destructive actions
    const [dialog, setDialog] = useState(null);
    const [dialogError, setDialogError] = useState("");
    const [busy, setBusy] = useState(false);

    // Outcome banner shown above the register after an action succeeds
    const [notice, setNotice] = useState("");

    /*
      The API returns accounts in insertion order, so the oldest one sat at
      the top. Sorted here rather than in the request because both the browse
      call and the search call land in this same array. Copied first, since
      sort() would otherwise reorder the state array in place.
    */
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {

            const bTime = Date.parse(b.createdAt ?? "") || 0;   // A missing or unreadable date sorts last
            const aTime = Date.parse(a.createdAt ?? "") || 0;

            // Several accounts share a registration day, so id breaks the tie
            return bTime - aTime || (b.id ?? 0) - (a.id ?? 0);
        });
    }, [users]);

    // Ten accounts to a page, paged over the sorted copy so page 1 is newest
    const {
        page,
        pageItems,
        totalPages,
        total,
        rangeStart,
        rangeEnd,
        goToPage,
    } = usePagination(sortedUsers);

    // Anchor for the jump back up when the page changes
    const tableTopRef = useRef(null);


    /**
     * Load the register whenever the applied filters change.
     */
    useEffect(() => {

        let ignore = false;

        // "ALL" is a UI value only - the backend has no such role
        const roleParam = role === "ALL" ? undefined : role;

        const request = keyword
            ? searchUsers(keyword, roleParam)
            : getUsers(roleParam);

        request
            .then((data) => {
                if (!ignore) {
                    setUsers(data);
                    setError("");
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(
                        getErrorMessage(err, "The user register could not be loaded.")
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
    }, [keyword, role, reloadKey]);

    /**
     * Applies the typed keyword.
     */
    const handleSearch = (event) => {
        event.preventDefault();

        setLoading(true);
        setKeyword(keywordInput.trim());
    };

    /**
     * Clears the keyword and returns to the full register.
     */
    const clearSearch = () => {
        setLoading(true);
        setKeywordInput("");
        setKeyword("");
    };

    /**
     * Changes the role filter.
     */
    const handleRoleChange = (event) => {
        setLoading(true);
        setRole(event.target.value);
    };

    /**
     * Opens the promotion confirmation.
     *
     * Promotion is confirmed rather than immediate because it cannot be
     * reversed through the application - there is no demote endpoint.
     */
    const askPromote = (user) => {
        setDialogError("");
        setDialog({
            type: "promote",
            user,
            title: "Promote to Administrator",
            description: `Grant ${user.name} full administrative rights over the platform?`,
            consequences: [
                "Access to every report and user record",
                "Authority to delete reports and accounts",
            ],
            confirmLabel: "Promote",
        });
    };

    /**
     * Opens the deletion confirmation.
     */
    const askDelete = (user) => {
        setDialogError("");
        setDialog({
            type: "delete",
            user,
            title: "Remove Account",
            description: `Permanently remove the account belonging to ${user.name} (${user.email})?`,
            consequences: [
                "All reports filed by this account",
                "Their comments and urgency ratings",
            ],
            confirmLabel: "Remove Account",
        });
    };

    /**
     * Closes the confirmation dialog.
     */
    const closeDialog = () => {
        if (!busy) {
            setDialog(null);
            setDialogError("");
        }
    };

    /**
     * Carries out whichever action the dialog was opened for.
     */
    const confirmDialog = () => {

        if (!dialog) {
            return;
        }

        setBusy(true);
        setDialogError("");

        const action =
            dialog.type === "promote"
                ? promoteToAdmin(dialog.user.id)
                : deleteUser(dialog.user.id);

        action
            .then((response) => {
                // Backend returns a SuccessResponse with a message
                setNotice(
                    response?.message ||
                    (dialog.type === "promote"
                        ? "The account has been promoted."
                        : "The account has been removed.")
                );

                setDialog(null);
                setReloadKey((key) => key + 1);
            })
            .catch((err) => {
                /*
                  Business rules are enforced by the backend and only
                  surface here - a cleaner with cleanup history cannot be
                  deleted, and that history is not part of this register.
                */
                setDialogError(
                    getErrorMessage(err, "The action could not be completed.")
                );
            })
            .finally(() => {
                setBusy(false);
            });
    };

    return (
        <div>
            <PageHeading
                title="User Administration"
                titleHi="उपयोगकर्ता प्रशासन"
                subtitle="Review registered accounts, grant administrative rights and remove users."
            />

            <div className="space-y-4">

                {/* Outcome of the last action */}
                {notice && (
                    <Alert type="success" title="Action completed">
                        {notice}
                    </Alert>
                )}

                {/* Search and role filter */}
                <div className="rounded-gov border border-rule bg-white p-4">

                    <div className="flex flex-wrap items-end gap-3">

                        <form
                            onSubmit={handleSearch}
                            className="flex min-w-[260px] flex-1 items-end gap-2"
                        >
                            <div className="flex-1">
                                <label
                                    htmlFor="user-search"
                                    className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-ink-muted uppercase"
                                >
                                    Search by name or email
                                </label>

                                <div className="relative">
                                    <Search
                                        size={15}
                                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                                        aria-hidden="true"
                                    />

                                    <input
                                        id="user-search"
                                        type="search"
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        placeholder="e.g. Ramesh, ramesh@example.com"
                                        className="w-full rounded-gov border border-rule bg-white py-2 pr-3 pl-9 text-sm text-ink outline-none transition focus:border-gov-blue"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                            >
                                Search
                            </button>
                        </form>

                        <div>
                            <label
                                htmlFor="role-filter"
                                className="mb-1 block text-[11px] font-semibold tracking-[0.1em] text-ink-muted uppercase"
                            >
                                Designation
                            </label>

                            <select
                                id="role-filter"
                                value={role}
                                onChange={handleRoleChange}
                                className="rounded-gov border border-rule bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gov-blue"
                            >
                                {USER_ROLE_FILTERS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Active keyword, with a way back to the full register */}
                    {keyword && (
                        <div className="mt-3 flex items-center gap-2 border-t border-rule pt-3 text-xs text-ink-muted">
                            <span>
                                Showing results for{" "}
                                <span className="font-semibold text-ink">
                                    “{keyword}”
                                </span>
                            </span>

                            <button
                                type="button"
                                onClick={clearSearch}
                                className="inline-flex items-center gap-1 font-semibold text-gov-blue hover:underline"
                            >
                                <X size={12} aria-hidden="true" />
                                Clear
                            </button>
                        </div>
                    )}
                </div>

                {/* Load failure */}
                {error && (
                    <Alert type="error" title="Register unavailable">
                        {error}
                    </Alert>
                )}

                {/* Loading */}
                {loading && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center text-sm text-ink-muted">
                        Loading user register…
                    </div>
                )}

                {/* Nothing matched */}
                {!loading && !error && users.length === 0 && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center">
                        <Users
                            size={32}
                            className="mx-auto text-ink-muted"
                            aria-hidden="true"
                        />
                        <p className="mt-3 font-semibold text-ink">
                            No matching accounts
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                            Adjust the search term or designation filter.
                        </p>
                    </div>
                )}

                {/* Register */}
                {!loading && users.length > 0 && (
                    <div ref={tableTopRef} className="rounded-gov border border-rule bg-white">

                        <div className="border-b border-rule bg-paper px-5 py-3">
                            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                Accounts ({total})
                            </h2>
                        </div>


                        <div className="overflow-x-auto">
                            <table className="w-full">
                                {/*
                                  Seven columns at px-5 spent 280px on padding
                                  alone, which pushed the Actions column past
                                  the panel edge. The inner columns drop to
                                  px-3; the first and last keep px-5 so the
                                  table still lines up with the panel heading.
                                */}
                                <thead className="border-b border-rule bg-paper text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Name</th>
                                        <th className="px-3 py-3">Email</th>
                                        <th className="px-3 py-3">Designation</th>
                                        <th className="px-3 py-3">Location</th>
                                        <th className="px-3 py-3">Points</th>
                                        <th className="px-3 py-3">Registered</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-rule text-sm">
                                    {pageItems.map((user) => (

                                        <tr key={user.id} className="transition hover:bg-paper">

                                            <td className="px-5 py-3 font-semibold text-gov-navy">
                                                {user.name}
                                            </td>

                                            <td className="px-3 py-3 text-ink-muted">
                                                {user.email}
                                            </td>

                                            <td className="px-3 py-3">
                                                <RoleBadge role={user.role} />
                                            </td>

                                            <td className="px-3 py-3 text-ink-muted">
                                                {user.city
                                                    ? `${user.city}${user.state ? `, ${user.state}` : ""}`
                                                    : "—"}
                                            </td>

                                            {/* Only cleaners accumulate points */}
                                            <td className="px-3 py-3 text-ink">
                                                {user.rewardPoints ?? 0}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-ink-muted">
                                                {formatDateTime(user.createdAt)}
                                            </td>

                                            <td className="px-5 py-3">
                                                <div className="flex justify-end gap-2">

                                                    <Link
                                                        to={`/admin/users/${user.id}`}
                                                        aria-label={`View ${user.name}`}
                                                        className="rounded border border-rule bg-white p-1.5 text-ink-muted transition hover:border-gov-blue hover:text-gov-blue"
                                                    >
                                                        <Eye size={14} aria-hidden="true" />
                                                    </Link>

                                                    {/* Citizens only - see canPromote */}
                                                    {canPromote(user.role) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => askPromote(user)}
                                                            aria-label={`Promote ${user.name}`}
                                                            className="rounded border border-india-green bg-green-50 p-1.5 text-india-green transition hover:bg-green-100"
                                                        >
                                                            <ArrowUpCircle size={14} aria-hidden="true" />
                                                        </button>
                                                    )}

                                                    {/* Administrators cannot be removed */}
                                                    {canDelete(user.role) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => askDelete(user)}
                                                            aria-label={`Remove ${user.name}`}
                                                            className="rounded border border-red-700 bg-red-50 p-1.5 text-red-700 transition hover:bg-red-100"
                                                        >
                                                            <Trash2 size={14} aria-hidden="true" />
                                                        </button>
                                                    )}
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
                                itemLabel="accounts"
                                scrollTargetRef={tableTopRef}
                            />
                        </div>
                    </div>
                )}
            </div>


            {/* Shared confirmation for promotion and deletion */}
            <ConfirmDialog
                open={!!dialog}
                title={dialog?.title}
                description={dialog?.description}
                consequences={dialog?.consequences}
                confirmLabel={dialog?.confirmLabel}
                error={dialogError}
                busy={busy}
                onConfirm={confirmDialog}
                onCancel={closeDialog}
            />
        </div>
    );
}
