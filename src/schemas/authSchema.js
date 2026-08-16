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
 * Change Password Validation Schema
 * ==========================================================
 */
export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "Current password is required"),

        newPassword: z
            .string()
            .min(6, "New password must contain at least 6 characters"),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your new password"),
    })
    .superRefine((data, context) => {
        if (data.newPassword !== data.confirmPassword) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["confirmPassword"],
                message: "New password and confirmation do not match",
            });
        }

        if (
            data.currentPassword &&
            data.newPassword &&
            data.currentPassword === data.newPassword
        ) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["newPassword"],
                message: "New password must be different from the current password",
            });
        }
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