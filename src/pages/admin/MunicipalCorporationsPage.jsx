import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

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
                                Registered Corporations ({corporations.length})
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b border-rule bg-paper text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                    <tr>
                                        <th className="px-5 py-3">City</th>
                                        <th className="px-5 py-3">Organisation</th>
                                        <th className="px-5 py-3">Contact Number</th>
                                        <th className="px-5 py-3">Email</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-rule text-sm">
                                    {corporations.map((corp) => (
                                        <tr
                                            key={corp.id}
                                            className="transition hover:bg-paper"
                                        >
                                            <td className="px-5 py-3 font-semibold text-gov-navy">
                                                {corp.city}
                                            </td>
                                            <td className="px-5 py-3 text-ink">
                                                {corp.organizationName}
                                            </td>
                                            <td className="px-5 py-3 text-ink-muted">
                                                {corp.phone}
                                            </td>
                                            <td className="px-5 py-3 text-ink-muted">
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
