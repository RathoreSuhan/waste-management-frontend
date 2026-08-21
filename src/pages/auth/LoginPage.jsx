import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AuthShell from "@/components/auth/AuthShell";

import useAuth from "@/hooks/useAuth";

import { loginSchema } from "@/schemas/authSchema";
import { getDashboardPath } from "@/utils/roleRedirect";

import background from "@/assets/background2.jpg";

/**
 * ============================================================================
 * Login Page
 * ============================================================================
 *
 * Sign-in form, framed by AuthShell over background2.
 *
 * Calls POST /api/auth/login through the auth context, which stores the
 * token and role for the rest of the session.
 *
 * One form serves everybody: the backend decides which kind of session an
 * email is entitled to, so this page states no role-specific sign-in rules.
 * ============================================================================
 */

export default function LoginPage() {

    // Navigation
    const navigate = useNavigate();

    /*
      Where the visitor was before being asked to sign in.

      LoginRequiredDialog sets this when an anonymous reader tries to
      comment, reply or rate urgency on a public report. Sending them to
      their dashboard afterwards would lose the report they were reading,
      and with it whatever they were about to write.
    */
    const location = useLocation();

    const redirectTo = location.state?.from;


    // Authentication
    const { login } = useAuth();

    // Backend error message
    const [serverError, setServerError] = useState("");

    /**
     * React Hook Form
     */
    const {

        register,

        handleSubmit,

        formState: {

            errors,

            isSubmitting,

        },

    } = useForm({

        resolver: zodResolver(loginSchema),

        defaultValues: {

            email: "",

            password: "",

        },

    });

    /**
     * Login Form Submit
     */
    async function onSubmit(data) {

        // Clear previous backend error
        setServerError("");

        try {

            // Login API
            const response = await login(data);

            /*
              Return to the page they were on, falling back to the
              dashboard for a normal login that started at /login.

              replace: true keeps /login out of the history stack, so
              Back from the report does not bounce through the form.
            */
            navigate(redirectTo || getDashboardPath(response.role), {
                replace: true,
            });


        } catch (error) {

            // Backend error message
            setServerError(

                error?.response?.data?.message ||

                "Something went wrong. Please try again."

            );

        }

    }

    return (

        <AuthShell
            image={background}
            titleHindi="पोर्टल में प्रवेश"
            title="Sign In"
            subtitle="Access your Clean Bharat account"
            footer={
                <>
                    Don't have an account?
                    <Link
                        to="/register"
                        className="ml-1 font-semibold text-gov-blue hover:underline"
                    >
                        Register here
                    </Link>
                </>
            }
        >

            {/*
              Explains why the form appeared, for a reader who was pushed
              here mid-task by LoginRequiredDialog rather than choosing
              to sign in.
            */}
            {redirectTo && !serverError && (
                <div className="mb-5">
                    <Alert type="info" title="Sign In to Continue">
                        You will be returned to the page you were reading once you
                        have signed in.
                    </Alert>
                </div>
            )}

            {/* Backend Error */}

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

                <Input

                    label="Email"

                    type="email"

                    placeholder="Enter your email"

                    autoComplete="email"

                    {...register("email")}

                    error={errors.email}

                />

                <Input

                    label="Password"

                    type="password"

                    placeholder="Enter your password"

                    autoComplete="current-password"

                    {...register("password")}

                    error={errors.password}

                />

                <Button

                    type="submit"

                    loading={isSubmitting}

                    className="w-full"

                >

                    <LogIn size={15} aria-hidden="true" />

                    Sign In

                </Button>

            </form>

            {/* Reading needs no account, so say so instead of implying it does */}
            <p className="mt-5 border-t border-rule pt-4 text-center text-xs leading-relaxed text-ink-muted">
                Reports, cleanups and rankings can be read without an account.
                An account is needed to file a report or join a discussion.
            </p>

        </AuthShell>

    );

}
