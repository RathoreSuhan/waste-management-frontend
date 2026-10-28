import { z } from "zod";

/**
 * ==========================================================
 * Municipal Corporation Validation Schema (Phase 5, refactored)
 * ----------------------------------------------------------
 * Mirrors the limits on MunicipalCorporationRequest, so the
 * admin is stopped at the same length the API rejects.
 *
 * Two location shapes exist since the directory refactor:
 *
 * - Directory cascade (preferred): the three LGD codes travel together,
 *   are validated against the same directory the backend uses, and store
 *   the workbook's canonical ULB name plus the code every code-backed
 *   report routes by. One corporation per ULB is enforced server-side.
 * - Legacy free text: the typed city, stored verbatim and matched
 *   case-insensitively - exactly what the old form did.
 *
 * On an EXISTING record the codes MAP the office to its ULB while the
 * stored city is preserved untouched: reports filed before the upgrade
 * still route through that legacy value, so the cascade must never
 * rewrite it.
 * ==========================================================
 */

/** Longest value each field accepts, shared with the form for maxLength. */
export const CORPORATION_MAX_LENGTHS = {
    city: 100,
    locationCode: 20,
    organizationName: 150,
    phone: 20,
    email: 150,
};

/** Fields both location shapes carry. */
const identityShape = {
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
};

const locationCodeField = (label) =>
    z
        .string()
        .trim()
        .min(1, `${label} is required`)
        .max(
            CORPORATION_MAX_LENGTHS.locationCode,
            `${label} is not valid`
        );

const directoryLocationShape = {
    stateCode: locationCodeField("State"),
    districtCode: locationCodeField("District"),
    ulbCode: locationCodeField("City or municipal area"),
};

const legacyCityShape = {
    // City this corporation is responsible for
    city: z
        .string()
        .trim()
        .min(2, "City is required")
        .max(
            CORPORATION_MAX_LENGTHS.city,
            `City cannot exceed ${CORPORATION_MAX_LENGTHS.city} characters`
        ),
};

/** CREATE through the directory cascade: codes required, no free text. */
export const municipalCorporationDirectorySchema = z.object({
    ...identityShape,
    ...directoryLocationShape,
});

/**
 * Legacy create shape, kept so an API client reproducing the old form still
 * behaves exactly as before. The admin UI's create path uses the cascade.
 */
export const municipalCorporationSchema = z.object({
    ...identityShape,
    ...legacyCityShape,
});

/**
 * EDIT shape: city is optional (round-tripped untouched when the admin does
 * not pick a ULB), and the codes are optional but all-or-none together -
 * mapping a ULB means choosing all three levels.
 */
export const buildMunicipalCorporationEditSchema = () =>
    z
        .object({
            ...identityShape,
            city: z
                .string()
                .trim()
                .max(
                    CORPORATION_MAX_LENGTHS.city,
                    `City cannot exceed ${CORPORATION_MAX_LENGTHS.city} characters`
                )
                .optional(),
            stateCode: z.string().trim().optional(),
            districtCode: z.string().trim().optional(),
            ulbCode: z.string().trim().optional(),
        })
        .superRefine((data, ctx) => {

            const sentCodes = [data.stateCode, data.districtCode, data.ulbCode]
                .filter((value) => value && value.length > 0);

            if (sentCodes.length > 0 && sentCodes.length < 3) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["ulbCode"],
                    message: "State, district and municipal area must be chosen together",
                });
                return;
            }

            if (sentCodes.length === 0 && (!data.city || data.city.trim().length === 0)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["ulbCode"],
                    message: "Choose the state, district and municipal area this office serves",
                });
            }
        });
