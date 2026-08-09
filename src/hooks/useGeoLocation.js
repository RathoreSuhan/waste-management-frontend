import { useCallback, useState } from "react";

/**
 * ============================================================================
 * Geolocation Hook
 * ============================================================================
 *
 * The backend requires latitude and longitude for every report
 * (duplicate detection works on distance between coordinates).
 *
 * This hook reads the device GPS through the browser API so the
 * citizen does not have to type coordinates manually.
 *
 * Phase 13 note: the reading also carries `accuracy` and `capturedAt`.
 * A position is only as meaningful as its accuracy radius - a desktop
 * browser locating by IP address reports coordinates that look precise but
 * are kilometres wide - so callers need the accuracy to decide whether a
 * reading can be trusted, and the timestamp to decide whether it is still
 * current.
 * ============================================================================
 */

export default function useGeoLocation() {

    // True while the browser is resolving the position
    const [detecting, setDetecting] = useState(false);

    // Error message when location cannot be read
    const [locationError, setLocationError] = useState("");

    /**
     * Ask the browser for the current position.
     *
     * @returns {Promise<{latitude: number, longitude: number,
     *                    accuracy: number, capturedAt: number} | null>}
     */
    const detectLocation = useCallback(() => {

        // Clear previous error before a new attempt
        setLocationError("");

        // Browser does not support the geolocation API
        if (!navigator.geolocation) {
            setLocationError(
                "Your browser does not support location detection. Please enter coordinates manually."
            );
            return Promise.resolve(null);
        }

        setDetecting(true);

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(

                // Success - coordinates received
                (position) => {
                    setDetecting(false);

                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,

                        /**
                         * Radius of uncertainty in metres, always supplied by
                         * the browser. Without it a vague fix is
                         * indistinguishable from a precise one.
                         */
                        accuracy: position.coords.accuracy,

                        // When the fix was taken, used to expire stale readings
                        capturedAt: Date.now(),
                    });
                },

                // Failure - permission denied, timeout, or unavailable
                (error) => {
                    setDetecting(false);

                    // Show a specific reason so the user knows what to fix
                    if (error.code === error.PERMISSION_DENIED) {
                        setLocationError(
                            "Location permission was denied. Please allow access or enter coordinates manually."
                        );
                    } else if (error.code === error.TIMEOUT) {
                        setLocationError(
                            "Location request timed out. Please try again."
                        );
                    } else {
                        setLocationError(
                            "Unable to detect your location. Please enter coordinates manually."
                        );
                    }

                    resolve(null);
                },

                {
                    // Request the most accurate position available
                    enableHighAccuracy: true,

                    // Give up after 15 seconds
                    timeout: 15000,

                    // Always read a fresh position
                    maximumAge: 0,
                }
            );
        });
    }, []);

    /**
     * Discard the current error.
     *
     * Needed when the user switches to entering coordinates by hand: the
     * failure has been dealt with, so leaving the message on screen would
     * just be noise.
     */
    const clearLocationError = useCallback(() => {
        setLocationError("");
    }, []);

    return {
        detecting,
        locationError,
        detectLocation,
        clearLocationError,
    };
}
