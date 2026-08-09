import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Mail,
    MapPin,
    Calendar,
    Building2,
    ArrowUpCircle,
    Trash2,
    FileText,
    MessageSquare,
    ThumbsUp,
    Sparkles,
    Award,
} from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import RoleBadge from "@/components/admin/RoleBadge";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import {
    getUserDetails,
    promoteToAdmin,
    deleteUser,
} from "@/services/adminService";
import {
    ROLES,
    canPromote,
    canDelete,
    getCleanerTypeLabel,
} from "@/constants/adminConstants";
import { formatDateTime } from "@/utils/formatters";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * User Details (Phase 12)
 * ============================================================================
 *
 * Full record for one account, including activity counts, with the same
 * promotion and deletion actions offered on the register.
 *
 * After a deletion there is no record left to display, so the page
 * returns to the register rather than showing an empty shell.
 * ============================================================================
 */

export default function UserDetailsPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Refreshed after a promotion, so the role badge reflects the change
    const [reloadKey, setReloadKey] = useState(0);

    // Confirmation dialog, shared by promotion and deletion
    const [dialog, setDialog] = useState(null);
    const [dialogError, setDialogError] = useState("");
    const [busy, setBusy] = useState(false);

    // Outcome of the last successful action
    const [notice, setNotice] = useState("");

    /**
     * Load the account record.
     */
    useEffect(() => {

        let ignore = false;

        getUserDetails(id)
            .then((data) => {
                if (!ignore) {
                    setUser(data);
                    setError("");
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setError(
                        getErrorMessage(err, "This account could not be loaded.")
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
    }, [id, reloadKey]);

    /**
     * Opens the promotion confirmation.
     */
    const askPromote = () => {
        setDialogError("");
        setDialog({
            type: "promote",
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
    const askDelete = () => {
        setDialogError("");
        setDialog({
            type: "delete",
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
     * Closes the dialog.
     */
    const closeDialog = () => {
        if (!busy) {
            setDialog(null);
            setDialogError("");
        }
    };

    /**
     * Carries out the confirmed action.
     */
    const confirmDialog = () => {

        if (!dialog) {
            return;
        }

        setBusy(true);
        setDialogError("");

        const promoting = dialog.type === "promote";

        const action = promoting ? promoteToAdmin(id) : deleteUser(id);

        action
            .then((response) => {
                setDialog(null);

                if (promoting) {
                    // Reload so the role badge and available actions update
                    setNotice(
                        response?.message || "The account has been promoted."
                    );
                    setReloadKey((key) => key + 1);
                } else {
                    // Nothing left to show - back to the register
                    navigate("/admin/users");
                }
            })
            .catch((err) => {
                setDialogError(
                    getErrorMessage(err, "The action could not be completed.")
                );
            })
            .finally(() => {
                setBusy(false);
            });
    };

    // Cleaner-only figures - citizens have neither points nor cleanups
    const isCleaner = user?.role === ROLES.CLEANER;

    return (
        <div>
            <PageHeading
                title="Account Record"
                titleHi="खाता विवरण"
                subtitle="Complete details and platform activity for a single account."
            />

            <div className="space-y-4">

                <Link
                    to="/admin/users"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Back to user register
                </Link>

                {/* Outcome of the last action */}
                {notice && (
                    <Alert type="success" title="Action completed">
                        {notice}
                    </Alert>
                )}

                {/* Load failure */}
                {error && (
                    <Alert type="error" title="Record unavailable">
                        {error}
                    </Alert>
                )}

                {/* Loading */}
                {loading && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center text-sm text-ink-muted">
                        Loading account record…
                    </div>
                )}

                {!loading && user && (
                    <>
                        {/* Identity */}
                        <div className="rounded-gov border border-rule bg-white">

                            <div className="border-b border-rule bg-paper px-5 py-3">
                                <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                    Identity
                                </h2>
                            </div>

                            <div className="p-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">

                                    <div>
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <h3 className="text-lg font-bold text-gov-navy">
                                                {user.name}
                                            </h3>
                                            <RoleBadge role={user.role} />
                                        </div>

                                        <dl className="mt-3 space-y-1.5 text-sm">

                                            <div className="flex items-center gap-2 text-ink-muted">
                                                <Mail size={13} aria-hidden="true" />
                                                <dt className="sr-only">Email</dt>
                                                <dd>{user.email}</dd>
                                            </div>

                                            <div className="flex items-center gap-2 text-ink-muted">
                                                <MapPin size={13} aria-hidden="true" />
                                                <dt className="sr-only">Location</dt>
                                                <dd>
                                                    {user.city
                                                        ? `${user.city}${user.state ? `, ${user.state}` : ""}`
                                                        : "Not recorded"}
                                                </dd>
                                            </div>

                                            <div className="flex items-center gap-2 text-ink-muted">
                                                <Calendar size={13} aria-hidden="true" />
                                                <dt className="sr-only">Registered on</dt>
                                                <dd>
                                                    Registered {formatDateTime(user.createdAt)}
                                                </dd>
                                            </div>

                                            {/* Only present for cleaner accounts */}
                                            {isCleaner && (
                                                <div className="flex items-center gap-2 text-ink-muted">
                                                    <Building2 size={13} aria-hidden="true" />
                                                    <dt className="sr-only">Organisation</dt>
                                                    <dd>
                                                        {getCleanerTypeLabel(user.cleanerType)}
                                                        {user.organizationName
                                                            ? ` — ${user.organizationName}`
                                                            : ""}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    </div>

                                    {/* Actions available for this account */}
                                    <div className="flex flex-wrap gap-2">

                                        {canPromote(user.role) && (
                                            <button
                                                type="button"
                                                onClick={askPromote}
                                                className="inline-flex items-center gap-1.5 rounded-gov border border-india-green bg-green-50 px-4 py-2 text-sm font-semibold text-india-green transition hover:bg-green-100"
                                            >
                                                <ArrowUpCircle size={15} aria-hidden="true" />
                                                Promote to Admin
                                            </button>
                                        )}

                                        {canDelete(user.role) && (
                                            <button
                                                type="button"
                                                onClick={askDelete}
                                                className="inline-flex items-center gap-1.5 rounded-gov border border-red-700 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                                            >
                                                <Trash2 size={15} aria-hidden="true" />
                                                Remove Account
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Explains the absence of actions on admin records */}
                                {user.role === ROLES.ADMIN && (
                                    <p className="mt-4 border-t border-rule pt-3 text-xs text-ink-muted">
                                        Administrator accounts cannot be removed through the
                                        portal. This is enforced by the platform to prevent the
                                        last administrator being locked out.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Activity counts */}
                        <div className="rounded-gov border border-rule bg-white">

                            <div className="border-b border-rule bg-paper px-5 py-3">
                                <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                    Platform Activity
                                </h2>
                            </div>

                            <div className="grid grid-cols-2 divide-x divide-y divide-rule sm:grid-cols-4 sm:divide-y-0">

                                <ActivityFigure
                                    icon={FileText}
                                    label="Reports Filed"
                                    value={user.reportsCreated ?? 0}
                                />

                                <ActivityFigure
                                    icon={MessageSquare}
                                    label="Comments"
                                    value={user.comments ?? 0}
                                />

                                <ActivityFigure
                                    icon={ThumbsUp}
                                    label="Urgency Ratings"
                                    value={user.votes ?? 0}
                                />

                                {/* Cleanups and points only apply to cleaners */}
                                {isCleaner ? (
                                    <ActivityFigure
                                        icon={Sparkles}
                                        label="Cleanups Completed"
                                        value={user.completedCleanups ?? 0}
                                    />
                                ) : (
                                    <ActivityFigure
                                        icon={Award}
                                        label="Reward Points"
                                        value={user.rewardPoints ?? 0}
                                    />
                                )}
                            </div>

                            {/* Points shown separately for cleaners, alongside cleanups */}
                            {isCleaner && (
                                <div className="flex items-center justify-between border-t border-rule bg-paper px-5 py-3">
                                    <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                                        <Award size={15} className="text-saffron" aria-hidden="true" />
                                        Reward Points Earned
                                    </span>
                                    <span className="text-lg font-bold text-gov-navy">
                                        {user.rewardPoints ?? 0}
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
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

/**
 * One activity figure in the grid.
 *
 * Local to this page since the layout is specific to the four-column
 * strip below the identity panel.
 */
function ActivityFigure({ icon: Icon, label, value }) {

    return (
        <div className="p-4 text-center">
            <Icon
                size={16}
                className="mx-auto text-ink-muted"
                aria-hidden="true"
            />
            <p className="mt-1.5 text-xl font-bold text-gov-navy">
                {value}
            </p>
            <p className="text-[11px] tracking-wide text-ink-muted uppercase">
                {label}
            </p>
        </div>
    );
}
