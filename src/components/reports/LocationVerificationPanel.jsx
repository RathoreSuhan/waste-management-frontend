import { Crosshair, MapPin, ShieldCheck, TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDistance } from "@/utils/geo";
import { LOCATION_STATUS } from "@/utils/locationVerification";
import { SITE_PROXIMITY_RADIUS_METRES } from "@/constants/reportConstants";

/**
 * ============================================================================
 * Location Verification Panel
 * ============================================================================
 *
 * Confirms that the citizen is at the site they are reporting, which is the
 * frontend half of the Phase 13 anti-abuse work.
 *
 * The panel is presentational: the page owns the captured position and the
 * declaration, and `evaluateLocation` decides the outcome. Everything here is
 * about explaining that outcome and offering the one action that resolves it.
 *
 * Each state names what happened and what to do about it, because "location
 * not verified" on its own leaves the citizen with no way forward.
 * ============================================================================
 */

/**
 * Wording for each outcome.
 *
 * Kept out of the markup so the copy for a state can be read and revised in
 * one place, and the JSX stays a single layout rather than five variants.
 */
const STATUS_META = {
    [LOCATION_STATUS.NOT_CAPTURED]: {
        tone: "neutral",
        icon: MapPin,
        title: "Location Not Yet Confirmed",
        body: "Capture your current position to confirm you are at the site being reported.",
    },
    [LOCATION_STATUS.LOW_ACCURACY]: {
        tone: "warning",
        icon: TriangleAlert,
        title: "Position Too Imprecise",
        body: "Your device could not pin down where you are. This is common indoors and on desktop computers. Step outside and try again, or confirm the location yourself below.",
    },
    [LOCATION_STATUS.STALE]: {
        tone: "warning",
        icon: TriangleAlert,
        title: "Position No Longer Current",
        body: "Some time has passed since your position was captured. Capture it again so the report is filed against where you are now.",
    },
    [LOCATION_STATUS.TOO_FAR]: {
        tone: "warning",
        icon: TriangleAlert,
        title: "You Appear To Be Away From This Site",
        body: "Reports are meant to be filed at the site so cleaning staff are sent to the right place. Capture your position again at the site, or confirm the location yourself below.",
    },
    [LOCATION_STATUS.VERIFIED]: {
        tone: "success",
        icon: ShieldCheck,
        title: "Location Confirmed",
        body: "Your device confirms you are at the site being reported.",
    },
};

/**
 * Border and background per tone, so the panel reads at a glance.
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

export default function LocationVerificationPanel({
    status,
    distanceMetres,
    position,
    detecting,
    locationError,
    declared,
    onDeclaredChange,
    onCapture,
}) {

    // Fall back to the neutral state for any unrecognised status
    const meta = STATUS_META[status] || STATUS_META[LOCATION_STATUS.NOT_CAPTURED];

    const Icon = meta.icon;

    // Verified reports need no declaration, so the tickbox stays hidden
    const showDeclaration = status !== LOCATION_STATUS.VERIFIED;

    return (
        <div
            className={`
                space-y-3
                rounded-gov
                border
                p-4
                ${TONE_CLASSES[meta.tone]}
            `}
        >

            {/* Current outcome */}
            <div className="flex gap-3">
                <Icon
                    size={18}
                    className={`mt-0.5 shrink-0 ${TONE_ICON_CLASSES[meta.tone]}`}
                    aria-hidden="true"
                />

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                        {meta.title}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                        {meta.body}
                    </p>

                    {/*
                        Distance is only meaningful once the site has been
                        placed too far from the captured position - showing
                        it while verified would invite pointless nudging.
                    */}
                    {status === LOCATION_STATUS.TOO_FAR &&
                        distanceMetres !== null && (
                            <p className="mt-2 text-xs font-semibold text-orange-800">
                                The location entered is {formatDistance(distanceMetres)} away
                                &mdash; reports may be filed within{" "}
                                {formatDistance(SITE_PROXIMITY_RADIUS_METRES)} of your position.
                            </p>
                        )}

                    {/*
                        Accuracy is quoted once a usable fix exists, so the
                        citizen can judge the reading rather than take it
                        on trust.
                    */}
                    {position && status === LOCATION_STATUS.VERIFIED && (
                        <p className="mt-2 text-xs text-ink-muted">
                            Located to within {formatDistance(position.accuracy)}.
                        </p>
                    )}
                </div>
            </div>

            {/* Failures reported by the browser itself */}
            {locationError && (
                <p role="alert" className="text-xs font-medium text-red-700">
                    {locationError}
                </p>
            )}

            {/* Capture, or capture again after moving */}
            <Button
                type="button"
                variant="secondary"
                onClick={onCapture}
                loading={detecting}
                className="w-full sm:w-auto"
            >
                <Crosshair size={14} aria-hidden="true" />
                {position ? "Capture Position Again" : "Capture My Position"}
            </Button>

            {/*
                The declared override.

                Location detection fails for honest reasons every day, so a
                citizen who cannot verify is asked to take responsibility for
                the coordinates instead of being turned away. The wording is
                deliberately a declaration rather than a dismissal, so the
                choice is a considered one.
            */}
            {showDeclaration && (
                <label className="flex cursor-pointer gap-2 border-t border-rule pt-3">
                    <input
                        type="checkbox"
                        checked={declared}
                        onChange={(event) => onDeclaredChange(event.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-gov-blue"
                    />

                    <span className="text-xs leading-relaxed text-ink">
                        I confirm the location entered above is correct and that this
                        report describes waste I have seen myself.
                    </span>
                </label>
            )}
        </div>
    );
}
