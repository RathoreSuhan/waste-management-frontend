import { z } from "zod";

/**
 * Validation for a cleanup proposal.
 *
 * Mirrors CreateProposalRequest on the backend so a cleaner is told about a
 * problem before the multipart request is sent. The inspection photo and the
 * captured GPS coordinates are handled outside this schema, because both come
 * from device state rather than typed input.
 */
export const proposalSchema = z.object({

    // What the cleaner actually saw at the site
    siteObservations: z
        .string()
        .trim()
        .min(20, "Describe the site in at least 20 characters")
        .max(1000, "Site observations cannot exceed 1000 characters"),

    // Working days needed, matching the backend @Min(1) @Max(30)
    estimatedDurationDays: z.coerce
        .number()
        .int("Enter the duration in whole days")
        .min(1, "Duration must be at least 1 day")
        .max(30, "Duration cannot exceed 30 days"),

    // Head count the cleaner will deploy, matching @Min(1) @Max(100)
    manpowerCount: z.coerce
        .number()
        .int("Enter the manpower as a whole number")
        .min(1, "At least 1 worker is required")
        .max(100, "Manpower cannot exceed 100 workers"),

    // Tools, vehicles and protective gear
    equipment: z
        .string()
        .trim()
        .min(1, "List the equipment you will bring")
        .max(500, "Equipment list cannot exceed 500 characters"),

    // How the site will be cleaned
    cleaningMethod: z
        .string()
        .trim()
        .min(1, "Describe the cleaning method")
        .max(500, "Cleaning method cannot exceed 500 characters"),

    // Where the collected waste will go - the municipal officer reviews this closely
    wasteHandlingPlan: z
        .string()
        .trim()
        .min(20, "Describe the waste handling plan in at least 20 characters")
        .max(1000, "Waste handling plan cannot exceed 1000 characters"),

    // Optional rough volume, e.g. "about 2 tractor loads"
    estimatedWasteVolume: z
        .string()
        .trim()
        .max(200, "Estimated waste volume cannot exceed 200 characters")
        .optional(),

    // Optional start date, never in the past (backend @FutureOrPresent)
    proposedStartDate: z
        .string()
        .trim()
        .optional()
        .refine(
            (value) => !value || value >= new Date().toISOString().slice(0, 10),
            { message: "The proposed start date cannot be in the past" }
        ),

    // Anything else the officer should know
    remarks: z
        .string()
        .trim()
        .max(1000, "Remarks cannot exceed 1000 characters")
        .optional(),
});
