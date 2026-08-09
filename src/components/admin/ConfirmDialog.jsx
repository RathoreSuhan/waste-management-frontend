import { AlertTriangle, X } from "lucide-react";

import Alert from "@/components/ui/Alert";

/**
 * ==========================================================
 * ConfirmDialog
 * ----------------------------------------------------------
 * Confirmation step for irreversible administrative actions.
 *
 * Deleting a report also removes its image, votes, comments,
 * assignment and reward history, and deducts the cleaner's
 * points. None of that can be undone, so the consequences are
 * spelled out here rather than left to a bare "Are you sure?".
 *
 * `error` is rendered inside the dialog because the backend
 * refuses some deletions on business grounds - an admin
 * account, or a cleaner with cleanup history - and the reason
 * only arrives after the attempt.
 * ==========================================================
 */

export default function ConfirmDialog({
    open,
    title,
    description,
    // Extra consequences worth listing before the action is taken
    consequences = [],
    confirmLabel = "Confirm",
    // Refusal reason returned by the backend, shown in place
    error = "",
    busy = false,
    onConfirm,
    onCancel,
}) {

    if (!open) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div className="w-full max-w-md rounded-gov border border-rule bg-white shadow-lg">

                {/* Header - red rule marks this as a destructive action */}
                <div className="flex items-start justify-between gap-3 border-b border-rule border-l-4 border-l-red-700 bg-red-50 px-5 py-3">

                    <div className="flex items-start gap-2">
                        <AlertTriangle
                            size={18}
                            className="mt-0.5 shrink-0 text-red-700"
                            aria-hidden="true"
                        />

                        <h2
                            id="confirm-dialog-title"
                            className="font-serif text-base font-bold text-red-900"
                        >
                            {title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        aria-label="Close"
                        className="text-red-900 transition hover:text-red-700 disabled:opacity-50"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-3 p-5">

                    <p className="text-sm text-ink">
                        {description}
                    </p>

                    {/* What the action will take with it */}
                    {consequences.length > 0 && (
                        <div className="rounded-gov border border-rule bg-paper px-4 py-3">

                            <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                This will also remove
                            </p>

                            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-ink-muted">
                                {consequences.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className="text-xs font-semibold text-red-700">
                        This action cannot be undone.
                    </p>

                    {/* Business rule refusal from the backend */}
                    {error && (
                        <Alert type="error" title="Action refused">
                            {error}
                        </Alert>
                    )}
                </div>

                {/* Actions - cancel first, so the safe choice reads first */}
                <div className="flex justify-end gap-2 border-t border-rule bg-paper px-5 py-3">

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-gov border border-rule bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gov-blue hover:text-gov-blue disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="rounded-gov border border-red-700 bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
                    >
                        {busy ? "Working…" : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
