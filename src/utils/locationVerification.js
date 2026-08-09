import { haversineDistanceMetres } from "@/utils/geo";
import {
    SITE_PROXIMITY_RADIUS_METRES,
    MIN_ACCEPTABLE_ACCURACY_METRES,
    LOCATION_FRESHNESS_MS,
} from "@/constants/reportConstants";

/**
 * ============================================================================
 * Report Location Verification (Phase 13)
 * ============================================================================
 *
 * Phase 13 settled on the stricter of the two location designs: a citizen
 * should be at the site they are reporting. The backend deliberately left
 * this to the frontend, because only the browser can read the device GPS.
 *
 * The rule is enforced by comparing the coordinates on the form with a
 * position captured from the device. Coordinates stay editable, since the
 * waste is usually across the road rather than underfoot, but they can only
 * be nudged within the site radius before verification is lost.
 *
 * Verification can fail honestly - indoors, on a desktop, or with the sky
 * blocked - so a failed check never blocks the report outright. It withdraws
 * the verified status and asks for a declaration instead.
 * ============================================================================
 */

/**
 * Outcome of comparing the form coordinates with the captured position.
 */
export const LOCATION_STATUS = {

    // No position has been read from the device yet
    NOT_CAPTURED: "NOT_CAPTURED",

    // Reading was too vague to prove anything (IP-based desktop fix, indoors)
    LOW_ACCURACY: "LOW_ACCURACY",

    // Reading is old enough that the citizen may have moved on
    STALE: "STALE",

    // Coordinates sit outside the site radius around the captured position
    TOO_FAR: "TOO_FAR",

    // Citizen is demonstrably at the place being reported
    VERIFIED: "VERIFIED",
};

/**
 * Check the form coordinates against a captured device position.
 *
 * Ordering matters: an unusable reading is reported as such rather than as a
 * distance failure, because "your position could not be pinned down" and
 * "you are not at this place" call for completely different responses.
 *
 * @param {Object|null} position - reading from useGeoLocation
 * @param {string|number} latitude - latitude currently on the form
 * @param {string|number} longitude - longitude currently on the form
 * @returns {{status: string, distanceMetres: number|null}}
 */
export function evaluateLocation(position, latitude, longitude) {

    // Nothing to compare against yet
    if (!position) {
        return { status: LOCATION_STATUS.NOT_CAPTURED, distanceMetres: null };
    }

    // A fix wider than the site radius cannot confirm presence at the site
    if (position.accuracy > MIN_ACCEPTABLE_ACCURACY_METRES) {
        return { status: LOCATION_STATUS.LOW_ACCURACY, distanceMetres: null };
    }

    // Old readings are withdrawn rather than trusted
    if (Date.now() - position.capturedAt > LOCATION_FRESHNESS_MS) {
        return { status: LOCATION_STATUS.STALE, distanceMetres: null };
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    // Coordinates cleared or half-typed - treat as not yet confirmed
    if (
        latitude === "" ||
        longitude === "" ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
    ) {
        return { status: LOCATION_STATUS.NOT_CAPTURED, distanceMetres: null };
    }

    const distanceMetres = haversineDistanceMetres(
        position.latitude,
        position.longitude,
        lat,
        lon
    );

    return {
        status:
            distanceMetres <= SITE_PROXIMITY_RADIUS_METRES
                ? LOCATION_STATUS.VERIFIED
                : LOCATION_STATUS.TOO_FAR,
        distanceMetres,
    };
}

/**
 * Whether the report may be submitted with this outcome.
 *
 * Verified passes on its own. Everything else needs the citizen to declare
 * that the location is correct, which is what keeps an honest reporter with
 * a poor signal from being locked out.
 *
 * @param {string} status - a LOCATION_STATUS value
 * @param {boolean} declared - whether the declaration has been ticked
 * @returns {boolean}
 */
export function canSubmitLocation(status, declared) {
    return status === LOCATION_STATUS.VERIFIED || declared === true;
}
