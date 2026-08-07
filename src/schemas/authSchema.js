import { z } from "zod";

/**
 * ==========================================================
 * Login Validation Schema
 * ==========================================================
 */
export const loginSchema = z.object({

    // Email validation
    email: z
        .email("Please enter a valid email address"),

    // Password validation
    password: z
        .string()
        .min(1, "Password is required"),

});

/**
 * ==========================================================
 * Register Validation Schema
 * ==========================================================
 */
export const registerSchema = z
    .object({

        // Full Name
        name: z
            .string()
            .min(2, "Name must contain at least 2 characters"),

        // Email
        email: z
            .email("Please enter a valid email"),

        // Password
        password: z
            .string()
            .min(6, "Password must contain at least 6 characters"),

        // User Role
        role: z.enum([
            "ROLE_CITIZEN",
            "ROLE_CLEANER",
        ]),

        // Cleaner Type
        cleanerType: z
            .string()
            .optional(),

        // Organization
        organizationName: z
            .string()
            .optional(),

        // State
        state: z
            .string()
            .min(2, "State is required"),

        // City
        city: z
            .string()
            .min(2, "City is required"),

    })

    // Custom validation
    .superRefine((data, context) => {

        // Cleaner must choose cleaner type
        if (
            data.role === "ROLE_CLEANER" &&
            !data.cleanerType
        ) {

            context.addIssue({

                code: z.ZodIssueCode.custom,

                path: ["cleanerType"],

                message: "Cleaner Type is required",

            });

        }

    });