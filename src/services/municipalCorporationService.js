import axiosClient from "@/api/axiosClient";
import { MUNICIPAL_CORPORATIONS_API } from "@/constants/apiConstants";

/**
 * ============================================================================
 * Municipal Corporation Service (Phase 5)
 * ============================================================================
 *
 * City-wise municipal contact details, maintained by administrators.
 *
 * Backend endpoints:
 *   POST   /api/municipal-corporations            -> create
 *   GET    /api/municipal-corporations            -> list
 *   GET    /api/municipal-corporations/{id}       -> one record
 *   GET    /api/municipal-corporations/city/{city}-> legacy lookup by city
 *   GET    /api/municipal-corporations/ulb/{code} -> location-V2 lookup by exact ULB code
 *   GET    /api/municipal-corporations/me         -> signed-in officer's record
 *   PUT    /api/municipal-corporations/{id}       -> update
 *   PUT    /api/municipal-corporations/me         -> update signed-in officer's record
 *   DELETE /api/municipal-corporations/{id}       -> remove
 *
 * MunicipalCorporationResponse:
 *   { id, city, ulbCode, organizationName, phone, email }
 *
 * Access, as set in the backend SecurityConfig:
 *
 *   GET /city/{city} and /ulb/{code}
 *                     - any signed-in user (citizen, cleaner or admin).
 *                       The report detail page uses ULB code whenever the
 *                       report has one; legacy reports keep the city lookup.
 *   everything else   - ROLE_ADMIN only, so the remaining functions here
 *                       must only be called from an admin screen.
 *
 * Note both contact lookups still require a token: they are authenticated,
 * public. Anonymous callers get 401, so callers on publicly reachable pages
 * must check for a token before calling it. That 401 is not mistaken for a
 * lapsed session - the interceptor only ends a session when the request
 * actually carried a stored token - but the call still fails, and an empty
 * contact panel is a poor way to find out.
 * ============================================================================
 */
export async function createMunicipalCorporation(corporation) {
    const response = await axiosClient.post(
        MUNICIPAL_CORPORATIONS_API,
        corporation
    );

    return response.data;
}

/**
 * Every registered municipal corporation.
 *
 * @returns Array of MunicipalCorporationResponse
 */
export async function getMunicipalCorporations() {
    const response = await axiosClient.get(MUNICIPAL_CORPORATIONS_API);

    return response.data;
}

/**
 * A single record, used by the edit form.
 *
 * @param {number|string} id - municipal corporation id
 * @returns MunicipalCorporationResponse
 */
export async function getMunicipalCorporation(id) {
    const response = await axiosClient.get(
        `${MUNICIPAL_CORPORATIONS_API}/${id}`
    );

    return response.data;
}

/** The municipal corporation represented by the authenticated officer. */
export async function getOwnMunicipalCorporation() {
    const response = await axiosClient.get(`${MUNICIPAL_CORPORATIONS_API}/me`);
    return response.data;
}

/**
 * Lookup by city name.
 *
 * Case is ignored by the backend (findByCityIgnoreCase), but a city
 * with no record returns 404 rather than an empty body, so callers
 * must be prepared for a rejected promise.
 *
 * @param {string} city - city name
 * @returns MunicipalCorporationResponse
 */
export async function getMunicipalCorporationByCity(city) {
    const response = await axiosClient.get(
        `${MUNICIPAL_CORPORATIONS_API}/city/${encodeURIComponent(city.trim())}`
    );

    return response.data;
}

/**
 * Location-V2 lookup by exact LGD ULB code.
 *
 * The backend deliberately does not fall back to city-name matching: mapped
 * corporations preserve their legacy city value (for legacy reports), which
 * can differ from the canonical ULB name a code-backed report carries.
 * No exact code match therefore rejects with 404 rather than guessing.
 *
 * @param {string} ulbCode - LGD ULB code stored on the report
 * @returns MunicipalCorporationResponse
 */
export async function getMunicipalCorporationByUlbCode(ulbCode) {
    const response = await axiosClient.get(
        `${MUNICIPAL_CORPORATIONS_API}/ulb/${encodeURIComponent(ulbCode.trim())}`
    );

    return response.data;
}

/**
 * Replace the details of an existing record.
 *
 * The backend overwrites all four fields, so a partial payload would
 * blank whatever it omitted. The form always submits the full set.
 *
 * @param {number|string} id - municipal corporation id
 * @param {Object} corporation - { city, organizationName, phone, email }
 * @returns MunicipalCorporationResponse
 */
export async function updateMunicipalCorporation(id, corporation) {
    const response = await axiosClient.put(
        `${MUNICIPAL_CORPORATIONS_API}/${id}`,
        corporation
    );

    return response.data;
}

/** Updates only the municipal corporation represented by the authenticated officer. */
export async function updateOwnMunicipalCorporation(corporation) {
    const response = await axiosClient.put(`${MUNICIPAL_CORPORATIONS_API}/me`, corporation);
    return response.data;
}

/**
 * Remove a record.
 *
 * This endpoint replies with a bare string rather than the JSON
 * envelope used elsewhere, so the body is returned as-is and callers
 * should not look for a `message` field on it.
 *
 * @param {number|string} id - municipal corporation id
 * @returns {Promise<string>} confirmation text from the backend
 */
export async function deleteMunicipalCorporation(id) {
    const response = await axiosClient.delete(
        `${MUNICIPAL_CORPORATIONS_API}/${id}`
    );

    return response.data;
}
