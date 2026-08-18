import {
    MIN_ACCEPTABLE_ACCURACY_METRES,
    LOCATION_FRESHNESS_MS,
} from "@/constants/reportConstants";
import { CLEANUP_PROOF_RADIUS_METRES } from "@/constants/assignmentConstants";
import { haversineDistanceMetres } from "@/utils/geo";

/**
 * ============================================================================
 * Report Location Verification (Phase 13, tightened in Phase 15)
 * ============================================================================
 *
 * A citizen must be standing at the site they are reporting.
 *
 * Phase 13 enforced that by comparing typed coordinates against a device
 * reading, which meant coordinates had to stay editable and a declaration
 * checkbox had to exist as a fallback for a poor signal.
 *
 * Phase 15 removes both. The coordinates on the form are now written only by
 * "Capture My Position", so there is nothing to compare them against - they
 * *are* the device reading. That closes the two ways a fabricated report could
 * be filed: typing coordinates for a place never visited, and ticking the
 * declaration to bypass verification altogether.
 *
 * What remains is a quality check on the reading itself: is it precise enough
 * to mean anything, and is it recent enough to still describe where the
 * citizen is now.
 * ============================================================================
 */

/**
 * Outcome of inspecting a captured device position.
 */
export const LOCATION_STATUS = {

    // No position has been read from the device yet
    NOT_CAPTURED: "NOT_CAPTURED",

    // Reading was too vague to prove anything (IP-based desktop fix, indoors)
    LOW_ACCURACY: "LOW_ACCURACY",

    // Reading is old enough that the citizen may have moved on
    STALE: "STALE",

    /*
     * Reading is good, but sits outside the radius allowed around a fixed
     * reference point.
     *
     * Unreachable while filing a report, since the report's coordinates come
     * from this very reading. Kept because the cleaner's cleanup proof does
     * compare a fresh reading against the original report location, and it
     * uses this same status vocabulary.
     */
    TOO_FAR: "TOO_FAR",

    // Reading is precise and recent, so it stands as proof of presence
    VERIFIED: "VERIFIED",
};

/**
 * Inspect a captured device position.
 *
 * Ordering matters: an unusable reading is reported as such rather than as a
 * distance failure, because "your position could not be pinned down" and
 * "you are not at this place" call for completely different responses.
 *
 * @param {Object|null} position - reading from useGeoLocation
 * @returns {{status: string, distanceMetres: number|null}}
 */
export function evaluateLocation(position) {

    // Nothing captured yet
    if (!position) {
        return { status: LOCATION_STATUS.NOT_CAPTURED, distanceMetres: null };
    }

    // A vague fix could "verify" an entire city, so it proves nothing
    if (position.accuracy > MIN_ACCEPTABLE_ACCURACY_METRES) {
        return { status: LOCATION_STATUS.LOW_ACCURACY, distanceMetres: null };
    }

    // Old readings are withdrawn rather than trusted
    if (Date.now() - position.capturedAt > LOCATION_FRESHNESS_MS) {
        return { status: LOCATION_STATUS.STALE, distanceMetres: null };
    }

    /*
     * The reading is trustworthy, and the form coordinates were written from
     * it, so the citizen is by definition at the location being filed. No
     * distance is measured here - there is nothing to measure against.
     */
    return { status: LOCATION_STATUS.VERIFIED, distanceMetres: null };
}

/**
 * Whether the report may be submitted with this outcome.
 *
 * Only a verified reading passes. There is deliberately no declaration
 * override any more: an unverified report is exactly the kind this platform
 * should refuse, and the honest cases (indoors, desktop, blocked sky) are all
 * fixed by capturing again at the waste itself.
 *
 * @param {string} status - a LOCATION_STATUS value
 * @returns {boolean}
 */
export function canSubmitLocation(status) {
    return status === LOCATION_STATUS.VERIFIED; // GPS proof is the only route
}

/**
 * Inspect a cleaner's captured position against the location of the report
 * being cleaned.
 *
 * The quality checks are identical to filing a report - a vague or old reading
 * proves nothing either way - but here there *is* a fixed point to measure
 * against, so a good reading can still fail on distance. That is the case the
 * TOO_FAR status exists for.
 *
 * Purely advisory: CleanupAssignmentServiceImpl repeats this measurement on
 * upload, so a tampered client only sees its own upload refused.
 *
 * @param {Object|null} position - reading from useGeoLocation
 * @param {number|null|undefined} reportLatitude - coordinates filed by the citizen
 * @param {number|null|undefined} reportLongitude
 * @param {number} [radiusMetres] - permitted distance from the reported site
 * @returns {{status: string, distanceMetres: number|null}}
 */
export function evaluateCleanupLocation(
    position,
    reportLatitude,
    reportLongitude,
    radiusMetres = CLEANUP_PROOF_RADIUS_METRES
) {

    // Reuse the reading-quality checks so both flows reject the same readings
    const quality = evaluateLocation(position);

    if (quality.status !== LOCATION_STATUS.VERIFIED) {
        return quality;
    }

    // Older reports may predate coordinate capture, so there is nothing to compare
    if (!Number.isFinite(reportLatitude) || !Number.isFinite(reportLongitude)) {
        return { status: LOCATION_STATUS.VERIFIED, distanceMetres: null };
    }

    const distanceMetres = haversineDistanceMetres(
        position.latitude,
        position.longitude,
        reportLatitude,
        reportLongitude
    );

    // Distance is returned either way, so the cleaner can see how far to walk
    if (distanceMetres > radiusMetres) {
        return { status: LOCATION_STATUS.TOO_FAR, distanceMetres };
    }

    return { status: LOCATION_STATUS.VERIFIED, distanceMetres };
}
