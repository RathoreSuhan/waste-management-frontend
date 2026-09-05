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
 *   GET    /api/municipal-corporations/city/{city}-> lookup by city
 *   PUT    /api/municipal-corporations/{id}       -> update
 *   DELETE /api/municipal-corporations/{id}       -> remove
 *
 * MunicipalCorporationResponse:
 *   { id, city, organizationName, phone, email }
 *
 * Access, as set in the backend SecurityConfig:
 *
 *   GET /city/{city}  - any signed-in user (citizen, cleaner or admin).
 *                       The report detail page shows this contact to the
 *                       citizen who filed the report.
 *   everything else   - ROLE_ADMIN only, so the remaining functions here
 *                       must only be called from an admin screen.
 *
 * Note the city lookup still requires a token: it is authenticated, not
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
