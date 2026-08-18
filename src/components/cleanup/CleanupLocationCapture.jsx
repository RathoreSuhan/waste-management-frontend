import {
    Crosshair,
    MapPinCheck,
    MapPinOff,
    TriangleAlert,
    Clock,
} from "lucide-react";

import Button from "@/components/ui/Button";
import { LOCATION_STATUS } from "@/utils/locationVerification";
import { CLEANUP_PROOF_RADIUS_METRES } from "@/constants/assignmentConstants";
import { MIN_ACCEPTABLE_ACCURACY_METRES } from "@/constants/reportConstants";
import { formatDistance } from "@/utils/geo";

/**
 * ============================================================================
 * Cleanup Location Capture (Phase 15)
 * ============================================================================
 *
 * Proof-of-presence step inside the cleanup upload dialog.
 *
 * A cleaner claims work on a specific citizen report, so the photograph must
 * be taken at that report's location - not merely somewhere in the same city.
 * This panel reads the device position and measures it against the coordinates
 * the citizen filed, refusing to enable the upload until the cleaner is inside
 * the permitted radius.
 *
 * As on the citizen form, there are no coordinate inputs: a typed position
 * would defeat the entire check. The only control here is "Capture".
 *
 * The measurement is repeated by the backend on upload, so this panel is about
 * telling the cleaner what to do before a large file is sent - it is not the
 * safeguard itself.
 * ============================================================================
 */

/**
 * Heading, explanation and tone for each capture state.
 *
 * TOO_FAR is intentionally absent: its message quotes the measured distance,
 * so it is built in the component where that number is known.
 */
const STATUS_META = {
    [LOCATION_STATUS.NOT_CAPTURED]: {
        title: "Location Not Yet Captured",
        description: `Stand at the cleaned site and capture your position. Proof is accepted only within ${CLEANUP_PROOF_RADIUS_METRES} m of the location the citizen reported.`,
        tone: "neutral",
        Icon: MapPinOff,
    },

    [LOCATION_STATUS.LOW_ACCURACY]: {
        title: "Position Too Imprecise",
        description: `Your device could not fix your position closely enough to prove you are at the site. Step into the open and capture again. A reading vaguer than ${MIN_ACCEPTABLE_ACCURACY_METRES} m cannot be accepted.`,
        tone: "warning",
        Icon: TriangleAlert,
    },

    [LOCATION_STATUS.STALE]: {
        title: "Position No Longer Current",
        description:
            "This reading is old enough that you may have left the site since. Capture your position again before submitting the photograph.",
        tone: "warning",
        Icon: Clock,
    },

    [LOCATION_STATUS.VERIFIED]: {
        title: "Presence At Site Confirmed",
        description:
            "Your position matches the reported location and will be submitted with the photograph.",
        tone: "success",
        Icon: MapPinCheck,
    },
};

/**
 * Panel background and border per tone (same language as the citizen panel).
 */
const TONE_CLASSES = {
    neutral: "border-rule bg-paper",
    warning: "border-orange-300 bg-orange-50",
    success: "border-green-300 bg-green-50",
};

/**
 * Icon colour per tone.
 */
const TONE_ICON_CLASSES = {
    neutral: "text-ink-muted",
    warning: "text-orange-700",
    success: "text-india-green",
};

export default function CleanupLocationCapture({
    status,
    position,
    distanceMetres,
    detecting,
    locationError,
    onCapture,
    disabled = false,
}) {

    // Too-far copy carries the measured distance, so it cannot live in a table
    const meta =
        status === LOCATION_STATUS.TOO_FAR
            ? {
                title: "You Are Away From The Reported Site",
                description: `Your position is ${formatDistance(distanceMetres)} from the location the citizen reported. Move to within ${CLEANUP_PROOF_RADIUS_METRES} m of the waste and capture again.`,
                tone: "warning",
                Icon: TriangleAlert,
            }
            : STATUS_META[status] || STATUS_META[LOCATION_STATUS.NOT_CAPTURED];

    const { title, description, tone, Icon } = meta;

    return (
        <div className={`rounded-gov border p-4 ${TONE_CLASSES[tone]}`}>

            <div className="flex items-start gap-3">

                <Icon
                    size={18}
                    className={`mt-0.5 shrink-0 ${TONE_ICON_CLASSES[tone]}`}
                    aria-hidden="true"
                />

                <div className="min-w-0 flex-1">

                    <p className="text-sm font-semibold text-gov-navy">
                        {title}
                    </p>

                    <p className="mt-1 text-sm text-ink-muted">
                        {description}
                    </p>

                    {/* ---------------- What was actually captured ---------------- */}
                    {position && (
                        /* Read-only: a typed coordinate would defeat the check */
                        <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-ink sm:grid-cols-2">

                            <div className="flex gap-1.5">
                                <dt className="font-semibold text-ink-muted">
                                    Latitude
                                </dt>
                                <dd className="font-mono">
                                    {position.latitude.toFixed(6)}
                                </dd>
                            </div>

                            <div className="flex gap-1.5">
                                <dt className="font-semibold text-ink-muted">
                                    Longitude
                                </dt>
                                <dd className="font-mono">
                                    {position.longitude.toFixed(6)}
                                </dd>
                            </div>

                            {/* Accuracy explains a rejected reading better than any message */}
                            {Number.isFinite(position.accuracy) && (
                                <div className="flex gap-1.5">
                                    <dt className="font-semibold text-ink-muted">
                                        Accuracy
                                    </dt>
                                    <dd>
                                        &plusmn; {Math.round(position.accuracy)} m
                                    </dd>
                                </div>
                            )}

                            {/* Distance is the number the decision rests on, so it is shown */}
                            {Number.isFinite(distanceMetres) && (
                                <div className="flex gap-1.5">
                                    <dt className="font-semibold text-ink-muted">
                                        From Report
                                    </dt>
                                    <dd>{formatDistance(distanceMetres)}</dd>
                                </div>
                            )}
                        </dl>
                    )}

                    {/* ---------------- Device or permission failure ---------------- */}
                    {locationError && (
                        <p
                            role="alert"
                            className="mt-3 text-sm font-semibold text-red-700"
                        >
                            {locationError}
                        </p>
                    )}

                    {/* ---------------- Capture ---------------- */}
                    <div className="mt-3">
                        <Button
                            type="button"
                            variant="secondary"
                            fullWidth={false}
                            loading={detecting}
                            disabled={disabled}
                            onClick={onCapture}
                        >
                            <Crosshair size={14} aria-hidden="true" />

                            {/* Wording changes once a reading exists, so a retry is obvious */}
                            {position ? "Capture Position Again" : "Capture My Position"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}