import { useMemo, useState } from "react";
import { X, ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";

import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import ImageUploadField from "@/components/reports/ImageUploadField";
import CleanupLocationCapture from "@/components/cleanup/CleanupLocationCapture";
import useModalBehaviour from "@/hooks/useModalBehaviour";
import useGeoLocation from "@/hooks/useGeoLocation";
import { uploadCleanupImage } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import {
    formatConfidence,
    CLEANUP_PROOF_RADIUS_METRES,
} from "@/constants/assignmentConstants";
import {
    canSubmitLocation,
    evaluateCleanupLocation,
} from "@/utils/locationVerification";
import {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    MAX_IMAGE_SIZE_LABEL,
} from "@/constants/reportConstants";

/**
 * ============================================================================
 * Cleanup Upload Dialog (Phase 8)
 * ============================================================================
 *
 * Where a cleaner submits proof that a site has been cleaned.
 *
 * The backend sends both the citizen's original photograph and this one to
 * Gemini, which checks they show the same place and that the waste is
 * actually gone. That comparison is slow, so the dialog makes the wait
 * explicit rather than leaving the cleaner staring at a dead button.
 *
 * The important subtlety: a REJECTED cleanup still returns HTTP 200, with
 * aiVerified set to false. Branching on the status code would tell a cleaner
 * their failed upload succeeded, so the verdict is read from aiVerified.
 *
 * Escape, the scroll lock and the focus trap come from useModalBehaviour -
 * except while the upload is in flight, where Escape is ignored so a stray
 * keypress cannot discard a verification the cleaner is waiting on.
 *
 * Phase 15 adds proof of presence: the cleaner captures a device position,
 * which must fall inside CLEANUP_PROOF_RADIUS_METRES of the coordinates the
 * citizen filed before the photograph can be sent. The backend measures the
 * same distance again, so this only saves the cleaner a wasted upload.
 * ============================================================================
 */

export default function CleanupUploadDialog({ assignment, onClose, onVerified }) {

    // Chosen photograph
    const [file, setFile] = useState(null);

    // Client-side validation message for the file itself
    const [fileError, setFileError] = useState("");

    // True while Gemini is comparing the two images
    const [submitting, setSubmitting] = useState(false);

    // Request-level failure (network, 4xx, timeout)
    const [error, setError] = useState("");

    // Backend CleanupValidationResponse once it arrives
    const [result, setResult] = useState(null);

    // Device reading proving the cleaner is standing at the reported site
    const [position, setPosition] = useState(null);

    // Browser geolocation plumbing, shared with the citizen report form
    const {
        detecting,
        locationError,
        detectLocation,
        clearLocationError,
    } = useGeoLocation();

    /*
      Measured against the report coordinates the assignment carries.

      Recomputed on every reading so the panel and the submit button always
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

    // Nothing may be uploaded until presence at the site is established
    const locationVerified = canSubmitLocation(locationStatus);

    /*
      This dialog is mounted only when it is open - the parent renders it
      conditionally - so `open` is always true here.
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
     * Validate the photograph before spending an AI call on it.
     * Mirrors the limits the backend enforces.
     */
    function validateFile(selected) {

        if (!selected) {
            return "A photograph of the cleaned site is required.";
        }

        if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
            return "Only JPG, PNG or WEBP photographs are accepted.";
        }

        if (selected.size > MAX_IMAGE_SIZE_BYTES) {
            return `The photograph must be smaller than ${MAX_IMAGE_SIZE_LABEL}.`;
        }

        return "";
    }

    /**
     * Store the selection and clear any stale validation message.
     */
    function handleFileChange(selected) {
        setFile(selected);

        // The previous complaint no longer applies to a new file
        setFileError("");
        setError("");
    }

    /**
     * Send the photograph for AI verification.
     */
    async function handleSubmit(event) {
        event.preventDefault();

        // Stop obviously invalid files before the slow round trip
        const validationMessage = validateFile(file);

        if (validationMessage) {
            setFileError(validationMessage);
            return;
        }

        // Presence at the site is a hard requirement, not a warning
        if (!locationVerified) {
            setError(
                `Capture your position at the site first. Cleanup proof is accepted only within ${CLEANUP_PROOF_RADIUS_METRES} m of the reported location.`
            );
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const response = await uploadCleanupImage(
                assignment.assignmentId,
                file,
                position          // Re-checked by the backend before any upload
            );

            // Verdict lives in the body, not the status code
            setResult(response);

            /**
             * Only refresh the task lists when the cleanup actually passed.
             * On rejection the assignment stays IN_PROGRESS, so the cleaner
             * can simply retake the photograph without losing this dialog.
             */
            if (response?.aiVerified) {
                onVerified?.();
            }
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    "The photograph could not be verified. Please try again."
                )
            );
        } finally {
            setSubmitting(false);
        }
    }

    /**
     * Allow another attempt after a rejection, keeping the dialog open.
     */
    function handleRetry() {
        setResult(null);
        setFile(null);
        setFileError("");
        setError("");

        // The old reading may be stale by now, so presence is proven again
        setPosition(null);
    }

    // AI accepted the cleanup
    const verified = result?.aiVerified === true;

    // AI responded but refused to accept the cleanup
    const rejected = result !== null && result?.aiVerified !== true;

    return (
        <div
            // Dim the page so the verification result has full attention
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
                aria-labelledby="cleanup-upload-title"
                // my-4 on a phone: my-8 wasted screen a small viewport needs
                className="my-4 w-full max-w-xl rounded-gov border border-rule bg-white shadow-lg outline-none sm:my-8"
            >

                {/* ---------------- Header ---------------- */}
                <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4">

                    <div className="min-w-0">
                        <h2
                            id="cleanup-upload-title"
                            className="font-serif text-lg font-bold text-gov-navy"
                        >
                            Submit Cleanup Proof
                        </h2>

                        {/* Which task this belongs to, so the wrong one is not closed */}
                        <p className="mt-0.5 truncate text-sm text-ink-muted">
                            {assignment.reportTitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        /*
                          Closed off during the upload. The request is
                          already with the server, and dismissing here
                          would hide the verdict it is about to return.
                        */
                        disabled={submitting}
                        // p-2 rather than p-1: a 16px hit area is not usable on a phone
                        className="shrink-0 rounded-gov p-2 text-ink-muted transition hover:bg-slate-100 hover:text-ink disabled:opacity-50"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                <div className="space-y-4 px-5 py-5">

                    {/* ---------------- Verified ---------------- */}
                    {verified && (
                        <>
                            <div className="flex flex-col items-center py-2 text-center">
                                <ShieldCheck
                                    size={40}
                                    className="text-india-green"
                                    aria-hidden="true"
                                />

                                <p className="mt-3 font-serif text-lg font-bold text-gov-navy">
                                    Cleanup Verified
                                </p>

                                {/* Backend supplies a friendly sentence for this case */}
                                <p className="mt-1 text-sm text-ink-muted">
                                    {result.message ||
                                        "The cleanup was confirmed and the report has been resolved."}
                                </p>
                            </div>

                            <AIVerdictDetails result={result} />

                            <Button type="button" variant="success" onClick={onClose}>
                                Done
                            </Button>
                        </>
                    )}

                    {/* ---------------- Rejected ---------------- */}
                    {rejected && (
                        <>
                            <div className="flex flex-col items-center py-2 text-center">
                                <ShieldAlert
                                    size={40}
                                    className="text-red-700"
                                    aria-hidden="true"
                                />

                                <p className="mt-3 font-serif text-lg font-bold text-gov-navy">
                                    Cleanup Not Verified
                                </p>

                                <p className="mt-1 text-sm text-ink-muted">
                                    {result.message ||
                                        "The photograph did not confirm that this site has been cleaned."}
                                </p>
                            </div>

                            <AIVerdictDetails result={result} />

                            {/* The task stays open, so retrying is the natural next step */}
                            <Alert type="info" title="What to do next">
                                Photograph the same spot from the angle used in the
                                original report, making sure the cleared area is
                                clearly visible. The task remains open until a
                                photograph is accepted.
                            </Alert>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button type="button" onClick={handleRetry}>
                                    Try Another Photograph
                                </Button>

                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onClose}
                                >
                                    Close
                                </Button>
                            </div>
                        </>
                    )}

                    {/* ---------------- Upload form ---------------- */}
                    {!result && (
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Sets expectations before a slow, checked submission */}
                            <Alert type="info" title="Verified by AI">
                                Your photograph is compared with the original report
                                to confirm the same location has genuinely been
                                cleaned. Checking usually takes up to a minute.
                            </Alert>

                            {/* Original photograph, so the angle can be matched */}
                            {assignment.beforeImageUrl && (
                                <div>
                                    <p className="mb-1.5 text-sm font-semibold text-ink">
                                        Original Report Photograph
                                    </p>

                                    <img
                                        src={assignment.beforeImageUrl}
                                        alt="Waste as originally reported by the citizen"
                                        className="h-40 w-full rounded-gov border border-rule object-cover"
                                    />

                                    <p className="mt-1 text-xs text-ink-muted">
                                        Match this angle as closely as you can.
                                    </p>
                                </div>
                            )}

                            {/* Proof of presence, required before the file is sent */}
                            <CleanupLocationCapture
                                status={locationStatus}
                                position={position}
                                distanceMetres={distanceMetres}
                                detecting={detecting}
                                locationError={locationError}
                                onCapture={handleCapturePosition}
                                disabled={submitting}
                            />

                            <ImageUploadField
                                file={file}
                                onFileChange={handleFileChange}
                                error={fileError}
                            />

                            {/* Request failure, distinct from an AI rejection */}
                            {error && <Alert type="error">{error}</Alert>}

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    type="submit"
                                    loading={submitting}
                                    disabled={!locationVerified}   // Presence first
                                >
                                    <Sparkles size={15} aria-hidden="true" />
                                    Submit for Verification
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

                            {/* Reassurance during the long AI wait */}
                            {submitting && (
                                <p
                                    role="status"
                                    className="text-center text-xs text-ink-muted"
                                >
                                    Comparing your photograph with the original
                                    report. Please keep this window open.
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * ----------------------------------------------------------
 * AI Verdict Details
 * ----------------------------------------------------------
 * The confidence score and Gemini's remarks.
 *
 * Shown for both outcomes: on a rejection it explains what went wrong, and
 * on success it records why the cleanup was accepted.
 * ----------------------------------------------------------
 */
function AIVerdictDetails({ result }) {

    // Confidence is absent on some responses, so it is rendered conditionally
    const confidence = formatConfidence(result?.confidence);

    return (
        <dl className="divide-y divide-rule rounded-gov border border-rule bg-paper text-sm">

            {confidence && (
                <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-ink-muted">AI Confidence</dt>
                    <dd className="font-semibold text-ink">{confidence}</dd>
                </div>
            )}

            {result?.remarks && (
                <div className="px-4 py-2.5">
                    <dt className="text-ink-muted">AI Remarks</dt>
                    <dd className="mt-1 leading-relaxed text-ink">
                        {result.remarks}
                    </dd>
                </div>
            )}

            {result?.reportStatus && (
                <div className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-ink-muted">Report Status</dt>
                    <dd className="font-semibold text-ink">
                        {result.reportStatus}
                    </dd>
                </div>
            )}
        </dl>
    );
}
