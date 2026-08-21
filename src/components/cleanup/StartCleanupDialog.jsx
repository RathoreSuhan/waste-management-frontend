import { useMemo, useState } from "react";
import { X, PlayCircle, ShieldCheck } from "lucide-react";

import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import CleanupLocationCapture from "@/components/cleanup/CleanupLocationCapture";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import useGeoLocation from "@/hooks/useGeoLocation";
import { startCleanup } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import { CLEANUP_PROOF_RADIUS_METRES } from "@/constants/assignmentConstants";
import {
    canSubmitLocation,
    evaluateCleanupLocation,
} from "@/utils/locationVerification";

/**
 * ============================================================================
 * Start Cleanup Dialog (Task 4)
 * ============================================================================
 *
 * The gate between "the Municipal Corporation approved my proposal" and
 * "I am now working on site".
 *
 * Pressing START CLEANUP is no longer a bare button on the task card. The
 * backend now stores start coordinates on the assignment, so the cleaner has
 * to prove presence at the reported site first - exactly the same 50 m rule
 * the proof upload already applies. Capturing here means the recorded
 * startedAt and the recorded position describe the same moment.
 *
 * The backend re-measures the distance and re-checks that a municipal
 * PROPOSAL approval exists, so this dialog only saves the cleaner a doomed
 * request; it is not the security boundary.
 *
 * The activity log is deliberately not touched here: logging is optional, so
 * starting a cleanup must never require a diary entry.
 * ============================================================================
 */

export default function StartCleanupDialog({ assignment, onClose, onStarted }) {

    // Device reading proving the cleaner is standing at the reported site
    const [position, setPosition] = useState(null);

    // True while the start request is with the server
    const [submitting, setSubmitting] = useState(false);

    // Request-level failure (network, 400 from an unapproved task, 403)
    const [error, setError] = useState("");

    // Browser geolocation plumbing, shared with the proof upload dialog
    const {
        detecting,
        locationError,
        detectLocation,
        clearLocationError,
    } = useGeoLocation();

    /*
      Measured against the coordinates the citizen filed on the report.

      Recomputed on every reading so the panel and the start button always
      agree about whether the cleaner is close enough.
    */
    const { status: locationStatus, distanceMetres } = useMemo(
        () =>
            evaluateCleanupLocation(
                position,
                assignment.reportLatitude,
                assignment.reportLongitude
            ),
        [position, assignment.reportLatitude, assignment.reportLongitude]
    );

    // The cleanup may not begin until presence at the site is established
    const locationVerified = canSubmitLocation(locationStatus);

    /*
      Mounted only while open - the parent renders it conditionally - so
      `open` is always true here. Escape is ignored mid-request so a stray
      keypress cannot hide the outcome of a state change already in flight.
    */
    const panelRef = useModalBehaviour(true, onClose, {
        closeOnEscape: !submitting,
    });

    /**
     * Read the cleaner's position from the device.
     *
     * The only way coordinates enter this dialog - there is deliberately no
     * manual entry, since a typed position would prove nothing.
     */
    async function handleCapturePosition() {
        clearLocationError();

        const captured = await detectLocation();

        // A failed read leaves the previous reading alone rather than wiping it
        if (captured) {
            setPosition(captured);
            setError("");
        }
    }

    /**
     * Move the assignment to IN_PROGRESS, recording where the work began.
     */
    async function handleStart() {

        // Presence at the site is a hard requirement, not a warning
        if (!locationVerified) {
            setError(
                `Capture your position at the site first. A cleanup can be started only within ${CLEANUP_PROOF_RADIUS_METRES} m of the reported location.`
            );
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            // The backend re-verifies cleaner identity, approval and distance
            await startCleanup(assignment.assignmentId, position);

            // Refresh the task lists so the card moves to the In Progress group
            onStarted?.();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    "The cleanup could not be started. Please try again."
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            // Dim the page so this state change has full attention
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
        >
            {/*
              role="dialog" belongs on the box, not on the backdrop above:
              the backdrop is the dimming layer, not the dialog itself.
            */}
            <div
                ref={panelRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="start-cleanup-title"
                // my-4 on a phone: my-8 wastes screen a small viewport needs
                className="my-4 w-full max-w-lg rounded-gov border border-rule bg-white shadow-lg outline-none sm:my-8"
            >

                {/* ---------------- Header ---------------- */}
                <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">

                    <div className="min-w-0">
                        <h2
                            id="start-cleanup-title"
                            className="font-serif text-lg font-bold text-gov-navy"
                        >
                            Start Cleanup
                        </h2>

                        {/* Which task this belongs to, so the wrong one is not started */}
                        <p className="mt-0.5 truncate text-sm text-ink-muted">
                            {assignment.reportTitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        /*
                          Closed off during the request: the state change is
                          already with the server, and dismissing here would
                          hide whether it succeeded.
                        */
                        disabled={submitting}
                        // p-2 rather than p-1: a 16px hit area is not usable on a phone
                        className="shrink-0 rounded-gov p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-5">

                    {/* Confirms the authorisation the municipality has granted */}
                    <div className="flex gap-3 rounded-gov border border-rule bg-paper px-4 py-3">
                        <ShieldCheck
                            size={18}
                            className="mt-0.5 shrink-0 text-india-green"
                            aria-hidden="true"
                        />

                        <p className="text-sm leading-relaxed text-ink">
                            This cleanup has been{" "}
                            <span className="font-semibold">
                                authorised by the Municipal Corporation
                            </span>
                            . Starting it records the time and place your work
                            began, which the municipality reviews alongside your
                            final proof.
                        </p>
                    </div>

                    {/* Proof of presence, required before the status can change */}
                    <CleanupLocationCapture
                        status={locationStatus}
                        position={position}
                        distanceMetres={distanceMetres}
                        detecting={detecting}
                        locationError={locationError}
                        onCapture={handleCapturePosition}
                        disabled={submitting}
                    />

                    {/*
                      Sets expectations for what happens next, and makes the
                      optional nature of the work diary explicit up front.
                    */}
                    <Alert type="info" title="After you start">
                        You can optionally record activity entries while the work
                        is under way - useful for cleanups spanning several days.
                        A work diary is never required; small cleanups can go
                        straight to the final proof photograph.
                    </Alert>

                    {/* Request failure, e.g. an approval that no longer stands */}
                    {error && <Alert type="error">{error}</Alert>}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            onClick={handleStart}
                            loading={submitting}
                            disabled={!locationVerified}   // Presence first
                        >
                            <PlayCircle size={15} aria-hidden="true" />
                            Start Cleanup
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}