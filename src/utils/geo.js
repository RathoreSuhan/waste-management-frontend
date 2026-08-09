/**
 * ============================================================================
 * Geolocation Helpers (Phase 13)
 * ============================================================================
 *
 * The backend's duplicate detection compares report coordinates with the
 * Haversine distance, so the frontend uses the same formula to tell a
 * citizen how far the site they entered is from where they are standing.
 *
 * A user-friendly distance is easier to react to than a bare metre count:
 * under one kilometre the site reads as a number of metres away, beyond
 * that as kilometres.
 * ============================================================================
 */

/**
 * Mean Earth radius in metres, used by the Haversine formula.
 */
const EARTH_RADIUS_METRES = 6371000;

/**
 * Convert degrees to radians (Haversine works in radians).
 *
 * @param {number} degrees
 * @returns {number} radians
 */
function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two coordinates.
 *
 * Same formula family as the backend duplicate check, so "about 18 m"
 * shown here matches the radius the backend applies.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in metres
 */
export function haversineDistanceMetres(lat1, lon1, lat2, lon2) {
    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(deltaLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METRES * c;
}

/**
 * Distance formatted for a human, e.g. "18 m" or "1.4 km".
 *
 * Whole metres below one kilometre (no false precision), one decimal
 * place at one kilometre and beyond.
 *
 * @param {number} metres
 * @returns {string} formatted distance
 */
export function formatDistance(metres) {
    if (typeof metres !== "number" || !Number.isFinite(metres)) {
        return "";
    }

    if (metres < 1000) {
        return `${Math.round(metres)} m`;
    }

    return `${(metres / 1000).toFixed(1)} km`;
}
