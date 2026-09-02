import { z } from "zod";

/**
 * Longest value each account field accepts, matching the @Size limits on
 * RegisterRequest so the form stops where the API stops.
 */
export const AUTH_MAX_LENGTHS = {
    name: 100,
    email: 150,
    organizationName: 150,
    state: 100,
    city: 100,
};

/**
 * Password bounds.
 *
 * BCrypt only reads the first 72 bytes, so anything longer is silently ignored
 * when the password is checked at sign-in. The backend caps new passwords at the
 * same number; sign-in itself stays uncapped so an older account is never locked
 * out of its own longer password.
 */
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 72;

/**
 * ==========================================================
 * Login Validation Schema
 * ==========================================================
 */
export const loginSchema = z.object({

    // Email validation
    email: z
        .email("Please enter a valid email address"),

    // Password validation - no maximum, an existing password may be longer
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
            .min(
                PASSWORD_MIN_LENGTH,
                `New password must contain at least ${PASSWORD_MIN_LENGTH} characters`
            )
            .max(
                PASSWORD_MAX_LENGTH,
                `New password cannot exceed ${PASSWORD_MAX_LENGTH} characters`
            ),

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
            .min(2, "Name must contain at least 2 characters")
            .max(
                AUTH_MAX_LENGTHS.name,
                `Name cannot exceed ${AUTH_MAX_LENGTHS.name} characters`
            ),

        // Email
        email: z
            .email("Please enter a valid email")
            .max(
                AUTH_MAX_LENGTHS.email,
                `Email cannot exceed ${AUTH_MAX_LENGTHS.email} characters`
            ),

        // Password
        password: z
            .string()
            .min(
                PASSWORD_MIN_LENGTH,
                `Password must contain at least ${PASSWORD_MIN_LENGTH} characters`
            )
            .max(
                PASSWORD_MAX_LENGTH,
                `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`
            ),

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
            .max(
                AUTH_MAX_LENGTHS.organizationName,
                `Organization name cannot exceed ${AUTH_MAX_LENGTHS.organizationName} characters`
            )
            .optional(),

        // State
        state: z
            .string()
            .min(2, "State is required")
            .max(
                AUTH_MAX_LENGTHS.state,
                `State cannot exceed ${AUTH_MAX_LENGTHS.state} characters`
            ),

        // City
        city: z
            .string()
            .min(2, "City is required")
            .max(
                AUTH_MAX_LENGTHS.city,
                `City cannot exceed ${AUTH_MAX_LENGTHS.city} characters`
            ),

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
