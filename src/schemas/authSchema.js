import { z } from "zod";

/**
 * Longest value each account field accepts, matching the @Size limits on
 * RegisterRequest so the form stops where the API stops.
 *
 * The location entries are codes, not names - Punjab is "3" - so their limit
 * is the backend's 20-character @Size rather than room for a spelled-out
 * name.
 */
export const AUTH_MAX_LENGTHS = {
    name: 100,
    email: 150,
    organizationName: 150,
    stateCode: 20,
    districtCode: 20,
    ulbCode: 20,
};

/**
 * Password bounds.
 *
 * BCrypt only reads the first 72 bytes, so anything longer is silently ignored
 * when the password is checked at sign-in. Sign-in itself stays uncapped so an
 * older account is never locked out of its own longer password.
 *
 * Registration no longer uses these - a Google account has no password to set -
 * but changing one does, and so does the sign-in form for existing accounts.
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
 *
 * One sign-up form serves two routes, which differ only in how the address is
 * proved:
 *
 *   email code   the person types an address and a password, and a six-digit
 *                code sent to that address proves they can read it
 *   Google       the address arrives inside a token Google signed, so it is not
 *                typed at all - and there is no password to choose
 *
 * Hence the factory: the role and location rules are identical either way, and
 * only the credential fields come and go. Omitting them from the object also
 * means Zod strips them from the submitted data, so a stale password left in
 * form state cannot be sent along with a Google sign-up.
 *
 * @param {Object} [options]
 * @param {boolean} [options.requireCredentials] false for the Google route
 */
export function buildRegisterSchema({ requireCredentials = true } = {}) {

    const fields = {

        // Full Name - typed, or prefilled from Google and still editable
        name: z
            .string()
            .min(2, "Name must contain at least 2 characters")
            .max(
                AUTH_MAX_LENGTHS.name,
                `Name cannot exceed ${AUTH_MAX_LENGTHS.name} characters`
            ),

        // User Role - only the two the backend lets anybody sign up for
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

        /*
          Where you live, as three codes from the location directory rather
          than typed names. Codes are what the backend validates against its
          bundled LGD directory - a typed "Punjab + Gaya" passed free text,
          which is exactly what this replaces. min(1), not min(2): a code is
          one character long.
        */
        stateCode: z
            .string()
            .min(1, "State is required")
            .max(
                AUTH_MAX_LENGTHS.stateCode,
                `State is not valid`
            ),

        districtCode: z
            .string()
            .max(
                AUTH_MAX_LENGTHS.districtCode,
                "District is not valid"
            ),

        ulbCode: z
            .string()
            .max(
                AUTH_MAX_LENGTHS.ulbCode,
                "City or municipal area is not valid"
            ),
    };

    if (requireCredentials) {

        // Email
        fields.email = z
            .email("Please enter a valid email")
            .max(
                AUTH_MAX_LENGTHS.email,
                `Email cannot exceed ${AUTH_MAX_LENGTHS.email} characters`
            );

        // Password
        fields.password = z
            .string()
            .min(
                PASSWORD_MIN_LENGTH,
                `Password must contain at least ${PASSWORD_MIN_LENGTH} characters`
            )
            .max(
                PASSWORD_MAX_LENGTH,
                `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`
            );
    }

    return z
        .object(fields)

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

            /*
              The cascade's dependency rules, so a child is flagged for the
              parent it is actually waiting on rather than a generic "required"
              that reads as if it were broken on its own.
            */
            if (!data.stateCode) {

                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["districtCode"],
                    message: "Choose a state first",
                });

            } else if (!data.districtCode) {

                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["districtCode"],
                    message: "District is required",
                });

            }

            if (!data.stateCode || !data.districtCode) {

                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["ulbCode"],
                    message: "Choose a state and district first",
                });

            } else if (!data.ulbCode) {

                context.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["ulbCode"],
                    message: "City or municipal area is required",
                });

            }

        });
}

/** The ordinary form: address and password typed in. */
export const registerSchema = buildRegisterSchema();

/**
 * ==========================================================
 * Verification Code Schema
 * ==========================================================
 *
 * Mirrors the @Pattern on RegisterRequest.verificationCode, so a mistyped code
 * is caught on the page instead of spending one of the five attempts the
 * backend allows before the code is burnt.
 */
export const verificationCodeSchema = z.object({

    verificationCode: z
        .string()
        .regex(/^\d{6}$/, "Enter the six-digit code from the email"),

});
