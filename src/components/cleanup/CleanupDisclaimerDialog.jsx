import { MapPin, X } from "lucide-react";

import {
    CLEANUP_DISCLAIMER_ACCEPT,
    CLEANUP_DISCLAIMER_CANCEL,
    CLEANUP_DISCLAIMER_EN,
    CLEANUP_DISCLAIMER_HI,
    CLEANUP_DISCLAIMER_TITLE,
    CLEANUP_DISCLAIMER_TITLE_HI,
} from "@/constants/cleanupDisclaimer";
import useModalBehaviour from "@/hooks/useModalBehaviour";

/**
 * ==========================================================
 * CleanupDisclaimerDialog
 * ----------------------------------------------------------
 * The presence undertaking a cleaner acknowledges before
 * proposing for a site or starting work awarded to them.
 *
 * Cleanup proof is geofenced: the photograph is only accepted
 * from inside a fixed radius of the citizen's reported
 * location. A cleaner who learns that at upload time has
 * already travelled and photographed for nothing, so the
 * obligation is stated up front at both decision points.
 *
 * English first, formal Hindi directly below - the same order
 * used for notices on Indian government forms - and the copy
 * itself lives in constants/cleanupDisclaimer so both screens
 * issue identical wording.
 *
 * Escape, the scroll lock and the focus trap come from
 * useModalBehaviour, matching every other dialog in the app.
 * ==========================================================
 */

export default function CleanupDisclaimerDialog({
    open,
    // Title of the report being taken on, echoed back for confirmation
    reportTitle = "",
    // True while the propose/start request is in flight
    busy = false,
    onAccept,
    onCancel,
}) {

    /*
      Escape is ignored once the acknowledged action has been sent, so the
      dialog cannot be dismissed out from under an in-flight request.
    */
    const panelRef = useModalBehaviour(open, onCancel, {
        closeOnEscape: !busy,
    });

    if (!open) {
        return null;
    }

    return (
        /*
          items-start with a scroll: two full paragraphs on a short phone
          viewport would otherwise centre the box and push its buttons off
          both edges with no way to reach them.
        */
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="cleanup-disclaimer-title"
                className="my-auto w-full max-w-lg rounded-gov border border-rule bg-white shadow-lg outline-none"
            >

                {/* Header - navy rule, an advisory notice rather than a warning */}
                <div className="flex items-start justify-between gap-3 border-b border-rule border-l-4 border-l-gov-navy bg-paper px-5 py-3">

                    <div className="flex items-start gap-2">
                        <MapPin
                            size={18}
                            className="mt-0.5 shrink-0 text-gov-blue"
                            aria-hidden="true"
                        />

                        <div>
                            <h2
                                id="cleanup-disclaimer-title"
                                className="font-serif text-base font-bold text-gov-navy"
                            >
                                {CLEANUP_DISCLAIMER_TITLE}
                            </h2>

                            {/* Hindi heading sits under the English one, not beside it */}
                            <p className="mt-0.5 text-sm text-ink-muted">
                                {CLEANUP_DISCLAIMER_TITLE_HI}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        aria-label="Close"
                        // Padded out to a usable touch target on a phone
                        className="-m-2 shrink-0 p-2 text-ink-muted transition hover:text-gov-blue disabled:opacity-50"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-3 p-5">

                    {/* Which task the undertaking applies to */}
                    {reportTitle && (
                        <div className="rounded-gov border border-rule bg-paper px-4 py-3">

                            <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                Task
                            </p>

                            <p className="mt-1 text-sm font-semibold text-ink">
                                {reportTitle}
                            </p>
                        </div>
                    )}

                    <p className="text-sm leading-relaxed text-ink">
                        {CLEANUP_DISCLAIMER_EN}
                    </p>

                    {/* Hindi translation, separated by a rule so neither reads as a continuation */}
                    <p className="border-t border-rule pt-3 text-sm leading-relaxed text-ink">
                        {CLEANUP_DISCLAIMER_HI}
                    </p>
                </div>

                {/* Actions - cancel first, so backing out reads before committing */}
                <div className="flex flex-col-reverse gap-2 border-t border-rule bg-paper px-5 py-3 sm:flex-row sm:justify-end">

                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-gov border border-rule bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gov-blue hover:text-gov-blue disabled:opacity-50"
                    >
                        {CLEANUP_DISCLAIMER_CANCEL}
                    </button>

                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={busy}
                        className="rounded-gov border border-gov-navy bg-gov-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue disabled:opacity-60"
                    >
                        {busy ? "Working…" : CLEANUP_DISCLAIMER_ACCEPT}
                    </button>
                </div>
            </div>
        </div>
    );
}