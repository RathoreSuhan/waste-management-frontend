import { z } from "zod";

/**
 * ==========================================================
 * Municipal Corporation Validation Schema (Phase 5)
 * ----------------------------------------------------------
 * The backend DTO carries no bean validation of its own, so
 * these rules are the only thing standing between a mistyped
 * entry and the database.
 *
 * That matters more than usual here: reports are matched to a
 * corporation by city name, so a blank or misspelt city makes
 * the record unreachable rather than merely untidy.
 * ==========================================================
 */

export const municipalCorporationSchema = z.object({

    // City this corporation is responsible for
    city: z
        .string()
        .trim()
        .min(2, "City is required")
        .max(100, "City cannot exceed 100 characters"),

    // Official name of the corporation
    organizationName: z
        .string()
        .trim()
        .min(3, "Organisation name must contain at least 3 characters")
        .max(150, "Organisation name cannot exceed 150 characters"),

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
        .max(150, "Email cannot exceed 150 characters"),
});
