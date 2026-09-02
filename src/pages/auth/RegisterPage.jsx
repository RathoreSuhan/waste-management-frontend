import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";

import Alert from "@/components/ui/Alert";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import AuthShell from "@/components/auth/AuthShell";
import BackendWakeNotice from "@/components/common/BackendWakeNotice";

import {
    registerSchema,
    AUTH_MAX_LENGTHS,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
} from "@/schemas/authSchema";
import * as authService from "@/services/authService";
import { getErrorMessage } from "@/utils/errorMessage";

import background from "@/assets/background1.jpg";

/**
 * ============================================================================
 * Register Page
 * ============================================================================
 *
 * Account creation, framed by AuthShell over background1.
 *
 * Calls POST /api/auth/register, then sends the new user to the sign-in
 * page - the backend issues a token on login, not on registration.
 *
 * Citizens and cleaners register here. Admin accounts are not self
 * service: an existing admin promotes a citizen from the admin portal.
 *
 * Municipal Corporations are not self service either. A corporation is
 * created by the admin under Municipal Bodies, and that registered official
 * email is the only account that can open the Municipal Dashboard for its
 * city - choosing the "Municipal Corporation" cleaner type below describes
 * the kind of crew you are, and grants no approval powers.
 * ============================================================================
 */

export default function RegisterPage() {

    const navigate = useNavigate();

    const [serverError, setServerError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const {

        register,

        handleSubmit,

        watch,

        formState: {
            errors,
            isSubmitting,
        },

    } = useForm({

        resolver: zodResolver(registerSchema),

        defaultValues: {

            name: "",

            email: "",

            password: "",

            role: "ROLE_CITIZEN",

            cleanerType: "",

            organizationName: "",

            state: "",

            city: "",

        },

    });

    const selectedRole = watch("role");

    async function onSubmit(data) {

        setServerError("");
        setSuccessMessage("");

        try {

            // Clean data before sending to backend
            // Remove cleaner-specific fields for Citizens
            const cleanData = { ...data };

            if (cleanData.role === "ROLE_CITIZEN") {
                // Citizens don't need cleaner type or organization name
                delete cleanData.cleanerType;
                delete cleanData.organizationName;
            }

            const response = await authService.register(cleanData);

            setSuccessMessage(response);

            setTimeout(() => {

                navigate("/login");

            }, 1500);

        } catch (error) {

            // Shared wording, so a cold-start timeout is named rather than
            // reported as "Something went wrong" - see LoginPage
            setServerError(getErrorMessage(error));

        }

    }

    return (

        <AuthShell
            image={background}
            titleHindi="नया पंजीकरण"
            title="Create Account"
            subtitle="Register with the Clean Bharat platform"
            // The form runs long, so it is given more room than sign-in
            width="max-w-xl"
            footer={
                <>
                    Already have an account?
                    <Link
                        to="/login"
                        className="ml-1 font-semibold text-gov-blue hover:underline"
                    >
                        Sign in here
                    </Link>
                </>
            }
        >

            {successMessage && (

                <div className="mb-5">

                    <Alert type="success">

                        {successMessage}

                    </Alert>

                </div>

            )}

            {serverError && (

                <div className="mb-5">

                    <Alert>

                        {serverError}

                    </Alert>

                </div>

            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
            >

                {/* ---------------- Account details ---------------- */}
                <FieldGroup title="Account Details">

                    <Input
                        label="Full Name"
                        placeholder="Enter your name"
                        autoComplete="name"
                        maxLength={AUTH_MAX_LENGTHS.name}
                        {...register("name")}
                        error={errors.name}
                    />

                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter email"
                        autoComplete="email"
                        maxLength={AUTH_MAX_LENGTHS.email}
                        {...register("email")}
                        error={errors.email}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder={`${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`}
                        autoComplete="new-password"
                        // 72 is all BCrypt reads, so a longer password is not stored in full
                        maxLength={PASSWORD_MAX_LENGTH}
                        {...register("password")}
                        error={errors.password}
                    />
                </FieldGroup>

                {/* ---------------- Role ---------------- */}
                <FieldGroup title="Role">

                    <Select
                        label="Register As"
                        {...register("role")}
                        error={errors.role}
                        options={[
                            {
                                label: "Citizen",
                                value: "ROLE_CITIZEN",
                            },
                            {
                                label: "Cleaner",
                                value: "ROLE_CLEANER",
                            },
                        ]}
                    />

                    {/*
                      What the choice actually means, said before it is
                      made rather than discovered afterwards. The two
                      roles see entirely different portals.
                    */}
                    <p className="rounded-gov border border-rule border-l-4 border-l-saffron bg-paper px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
                        {selectedRole === "ROLE_CLEANER"
                            ? "Cleaners claim reported sites, upload proof of the cleanup and earn reward points once the work is verified."
                            : "Citizens file reports of uncollected waste, track them to closure and take part in the discussion on each report."}
                    </p>

                    {selectedRole === "ROLE_CLEANER" && (
                        <>
                            <Select
                                label="Cleaner Type"
                                {...register("cleanerType")}
                                error={errors.cleanerType}
                                options={[
                                    {
                                        label: "Select Cleaner Type",
                                        value: "",
                                    },
                                    {
                                        label: "Individual",
                                        value: "INDIVIDUAL",
                                    },
                                    {
                                        label: "NGO",
                                        value: "NGO",
                                    },
                                    {
                                        label: "Private Company",
                                        value: "PRIVATE",
                                    },
                                    {
                                        label: "Municipal Corporation",
                                        value: "MUNICIPAL",
                                    },
                                ]}
                            />

                            {/* Prevents the obvious misreading: MUNICIPAL is a crew
                                type, not a route into the Municipal Dashboard. */}
                            <p className="rounded-gov border border-rule border-l-4 border-l-gov-blue bg-paper px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
                                "Municipal Corporation" here only records that your crew
                                belongs to a civic body. Approval powers for a city stay
                                with the corporation account the administrator registers
                                under Municipal Bodies.
                            </p>

                            <Input
                                label="Organization Name"
                                placeholder="Optional"
                                maxLength={AUTH_MAX_LENGTHS.organizationName}
                                {...register("organizationName")}
                                error={errors.organizationName}
                            />
                        </>
                    )}
                </FieldGroup>

                {/* ---------------- Location ---------------- */}
                <FieldGroup title="Location">

                    {/*
                      Two to a row: state and city are a single thought,
                      and pairing them keeps a long form from feeling
                      longer than it is.
                    */}
                    <div className="grid gap-5 sm:grid-cols-2">

                        <Input
                            label="State"
                            placeholder="Enter state"
                            maxLength={AUTH_MAX_LENGTHS.state}
                            {...register("state")}
                            error={errors.state}
                        />

                        <Input
                            label="City"
                            placeholder="Enter city"
                            maxLength={AUTH_MAX_LENGTHS.city}
                            {...register("city")}
                            error={errors.city}
                        />
                    </div>

                    {/* Explains why a form asks for a location at all */}
                    <p className="text-xs leading-relaxed text-ink-muted">
                        Used to place you on the state and city leaderboards, and to
                        route reports to the right municipal corporation.
                    </p>
                </FieldGroup>

                <Button
                    type="submit"
                    loading={isSubmitting}
                >
                    <UserPlus size={15} aria-hidden="true" />
                    Create Account
                </Button>

                {/* Same cold-start explanation as sign-in, in the same place */}
                <BackendWakeNotice />

            </form>

        </AuthShell>

    );

}

/**
 * A titled block of fields.
 *
 * Nine inputs in one unbroken column is a wall. Grouping them under
 * quiet headings turns the form into three short tasks, and matches the
 * sectioned layout used on the report record.
 */
function FieldGroup({ title, children }) {

    return (
        <fieldset className="space-y-4">

            <legend className="mb-3 w-full border-b border-rule pb-1.5 text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                {title}
            </legend>

            {children}
        </fieldset>
    );
}
