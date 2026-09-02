import { z } from "zod";

/**
 * Longest value each typed field accepts, matching the @Size limits on
 * CreateProposalRequest.
 *
 * Exported so the form can stop the cleaner at the same number the schema
 * rejects, instead of letting a 1,500 character plan be typed and then refused.
 */
export const PROPOSAL_MAX_LENGTHS = {
    siteObservations: 1000,
    equipment: 500,
    cleaningMethod: 500,
    wasteHandlingPlan: 1000,
    estimatedWasteVolume: 200,
    remarks: 1000,
};

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
        .max(
            PROPOSAL_MAX_LENGTHS.siteObservations,
            `Site observations cannot exceed ${PROPOSAL_MAX_LENGTHS.siteObservations} characters`
        ),

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
        .max(
            PROPOSAL_MAX_LENGTHS.equipment,
            `Equipment list cannot exceed ${PROPOSAL_MAX_LENGTHS.equipment} characters`
        ),

    // How the site will be cleaned
    cleaningMethod: z
        .string()
        .trim()
        .min(1, "Describe the cleaning method")
        .max(
            PROPOSAL_MAX_LENGTHS.cleaningMethod,
            `Cleaning method cannot exceed ${PROPOSAL_MAX_LENGTHS.cleaningMethod} characters`
        ),

    // Where the collected waste will go - the municipal officer reviews this closely
    wasteHandlingPlan: z
        .string()
        .trim()
        .min(20, "Describe the waste handling plan in at least 20 characters")
        .max(
            PROPOSAL_MAX_LENGTHS.wasteHandlingPlan,
            `Waste handling plan cannot exceed ${PROPOSAL_MAX_LENGTHS.wasteHandlingPlan} characters`
        ),

    // Optional rough volume, e.g. "about 2 tractor loads"
    estimatedWasteVolume: z
        .string()
        .trim()
        .max(
            PROPOSAL_MAX_LENGTHS.estimatedWasteVolume,
            `Estimated waste volume cannot exceed ${PROPOSAL_MAX_LENGTHS.estimatedWasteVolume} characters`
        )
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
        .max(
            PROPOSAL_MAX_LENGTHS.remarks,
            `Remarks cannot exceed ${PROPOSAL_MAX_LENGTHS.remarks} characters`
        )
        .optional(),
});
