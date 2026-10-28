import { z } from "zod";

/**
 * ==========================================================
 * Create Report Validation Schema
 * ----------------------------------------------------------
 * Mirrors the backend CreateReportRequest validation so the
 * user gets instant feedback before the API call is made.
 * ==========================================================
 */

/**
 * Coordinates are kept as strings because HTML inputs always
 * return strings. They are validated here and converted to
 * numbers only when the form is submitted.
 */
const latitudeField = z
    .string()
    .min(1, "Latitude is required")

    // Must be a real number
    .refine((value) => !Number.isNaN(Number(value)), {
        message: "Latitude must be a valid number",
    })

    // Valid earth latitude range
    .refine(
        (value) => Number(value) >= -90 && Number(value) <= 90,
        { message: "Latitude must be between -90 and 90" }
    );

const longitudeField = z
    .string()
    .min(1, "Longitude is required")

    // Must be a real number
    .refine((value) => !Number.isNaN(Number(value)), {
        message: "Longitude must be a valid number",
    })

    // Valid earth longitude range
    .refine(
        (value) => Number(value) >= -180 && Number(value) <= 180,
        { message: "Longitude must be between -180 and 180" }
    );

/**
 * Longest value each typed field accepts, matching the @Size limits on
 * CreateReportRequest and the widths of the columns behind them.
 *
 * Kept here so the form and the schema cannot drift apart: the page reads these
 * for maxLength, the rules below read them for .max().
 */
export const REPORT_MAX_LENGTHS = {
    title: 100,
    description: 500,
    address: 255,
    landmark: 100,
    city: 100,
    state: 100,
    locationCode: 20,
};

/** Kept as a named export because the report page already imports it. */
export const DESCRIPTION_MAX_LENGTH = REPORT_MAX_LENGTHS.description;

/*
  The three LGD codes the directory cascade sends. All three travel together
  and are resolved server-side into the canonical state/city names plus the
  district and ULB code, so the stored location can never be a hand-typed
  "Punjab + Gaya" mix.
*/
const locationCodeField = (label) =>
    z
        .string()
        .min(1, `${label} is required`)
        .max(
            REPORT_MAX_LENGTHS.locationCode,
            `${label} is not valid`
        );

const directoryLocationShape = {
    stateCode: locationCodeField("State"),
    districtCode: locationCodeField("District"),
    ulbCode: locationCodeField("City or municipal area"),
};

const legacyLocationShape = {
    // City name (legacy free-text path)
    city: z
        .string()
        .min(2, "City is required")
        .max(
            REPORT_MAX_LENGTHS.city,
            `City cannot exceed ${REPORT_MAX_LENGTHS.city} characters`
        ),

    // State name (legacy free-text path)
    state: z
        .string()
        .min(2, "State is required")
        .max(
            REPORT_MAX_LENGTHS.state,
            `State cannot exceed ${REPORT_MAX_LENGTHS.state} characters`
        ),
};

/*
  The report fields both location shapes share; only the place itself differs.
*/
const reportBaseShape = {
    // Short heading of the report
    title: z
        .string()
        .min(5, "Title must contain at least 5 characters")
        .max(
            REPORT_MAX_LENGTHS.title,
            `Title cannot exceed ${REPORT_MAX_LENGTHS.title} characters`
        ),

    // Details about the garbage
    description: z
        .string()
        .min(10, "Please describe the issue in at least 10 characters")
        .max(
            DESCRIPTION_MAX_LENGTH,
            `Description cannot exceed ${DESCRIPTION_MAX_LENGTH} characters`
        ),

    // GPS coordinates of the garbage location
    latitude: latitudeField,
    longitude: longitudeField,

    // Full address of the location
    address: z
        .string()
        .min(5, "Address must contain at least 5 characters")
        .max(
            REPORT_MAX_LENGTHS.address,
            `Address cannot exceed ${REPORT_MAX_LENGTHS.address} characters`
        ),

    // Optional nearby landmark
    landmark: z
        .string()
        .max(
            REPORT_MAX_LENGTHS.landmark,
            `Landmark cannot exceed ${REPORT_MAX_LENGTHS.landmark} characters`
        )
        .optional(),

    // Indian postal code
    pincode: z
        .string()
        .regex(/^[1-9][0-9]{5}$/, "Pincode must be a valid 6 digit number"),
};

/*
  Two shapes, chosen by the page at build time:

  - createReportSchema            today's free-text city/state form (the
                                  default while VITE_LOCATION_V2_ENABLED is off)
  - createDirectoryReportSchema   the directory cascade: the three LGD codes
                                  are required together, replacing the typed
                                  city/state fields entirely
*/
export const createReportSchema = z.object({
    ...reportBaseShape,
    ...legacyLocationShape,
});

export const createDirectoryReportSchema = z.object({
    ...reportBaseShape,
    ...directoryLocationShape,
});
