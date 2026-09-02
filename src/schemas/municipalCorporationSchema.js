import { z } from "zod";

/**
 * ==========================================================
 * Municipal Corporation Validation Schema (Phase 5)
 * ----------------------------------------------------------
 * Mirrors the @Size limits on MunicipalCorporationRequest, so
 * the admin is stopped at the same length the API rejects.
 *
 * Getting these right matters more than usual here: reports are
 * matched to a corporation by city name, so a blank or misspelt
 * city makes the record unreachable rather than merely untidy.
 * ==========================================================
 */

/** Longest value each field accepts, shared with the form for maxLength. */
export const CORPORATION_MAX_LENGTHS = {
    city: 100,
    organizationName: 150,
    phone: 20,
    email: 150,
};

export const municipalCorporationSchema = z.object({

    // City this corporation is responsible for
    city: z
        .string()
        .trim()
        .min(2, "City is required")
        .max(
            CORPORATION_MAX_LENGTHS.city,
            `City cannot exceed ${CORPORATION_MAX_LENGTHS.city} characters`
        ),

    // Official name of the corporation
    organizationName: z
        .string()
        .trim()
        .min(3, "Organisation name must contain at least 3 characters")
        .max(
            CORPORATION_MAX_LENGTHS.organizationName,
            `Organisation name cannot exceed ${CORPORATION_MAX_LENGTHS.organizationName} characters`
        ),

    /*
      Contact number.

      Indian landline and mobile numbers are accepted, with optional
      spaces, hyphens and a country code, since municipal offices are
      commonly published in any of those forms.
    */
    phone: z
        .string()
        .trim()
        .min(1, "Contact number is required")
        .max(
            CORPORATION_MAX_LENGTHS.phone,
            `Contact number cannot exceed ${CORPORATION_MAX_LENGTHS.phone} characters`
        )
        .regex(
            /^(\+?91[\s-]?)?[0-9][0-9\s-]{7,14}$/,
            "Enter a valid contact number"
        ),

    // Official email address
    email: z
        .string()
        .trim()
        .min(1, "Email address is required")
        .email("Enter a valid email address")
        .max(
            CORPORATION_MAX_LENGTHS.email,
            `Email cannot exceed ${CORPORATION_MAX_LENGTHS.email} characters`
        ),
});
