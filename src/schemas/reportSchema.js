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
 * Longest description the API accepts. Kept here so the form and the schema
 * cannot drift apart: the backend column and CreateReportRequest both stop at
 * this many characters.
 */
export const DESCRIPTION_MAX_LENGTH = 500;

export const createReportSchema = z.object({

    // Short heading of the report
    title: z
        .string()
        .min(5, "Title must contain at least 5 characters")
        .max(100, "Title cannot exceed 100 characters"),

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
        .max(255, "Address cannot exceed 255 characters"),

    // Optional nearby landmark
    landmark: z
        .string()
        .max(100, "Landmark cannot exceed 100 characters")
        .optional(),

    // City name
    city: z
        .string()
        .min(2, "City is required")
        .max(100, "City cannot exceed 100 characters"),

    // State name
    state: z
        .string()
        .min(2, "State is required")
        .max(100, "State cannot exceed 100 characters"),

    // Indian postal code
    pincode: z
        .string()
        .regex(/^[1-9][0-9]{5}$/, "Pincode must be a valid 6 digit number"),
});
