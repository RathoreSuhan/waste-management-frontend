import { useCallback, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import BackendWakeNotice from "@/components/common/BackendWakeNotice";

import useAuth from "@/hooks/useAuth";

import {
    getSessionExpiryNotice,
    subscribeSessionExpiryNotice,
} from "@/api/sessionExpiry";

import { loginSchema } from "@/schemas/authSchema";
import { getErrorMessage, getGoogleSignInError } from "@/utils/errorMessage";
import { resolvePostLoginPath } from "@/utils/roleRedirect";

import background from "@/assets/background2.jpg";

/**
 * ============================================================================
 * Login Page
 * ============================================================================
 *
 * Sign-in form, framed by AuthShell over background2.
 *
 * Two ways in, both ending in the same Clean Bharat session.
 *
 * Google, when it is configured for the deployment, posts the credential to
 * POST /api/auth/google; the backend verifies it with Google, finds or links the
 * account, and answers with this application's own JWT. A Google account with no
 * Clean Bharat account yet is sent on to /register to finish - carrying the
 * credential in router state, never in the URL and never in storage.
 *
 * Email and password serves everyone else: accounts created through the
 * ordinary sign-up form, and a city's Municipal Corporation, which signs in with
 * the password its administrator issued.
 *
 * One form still serves everybody: the backend decides which kind of session an
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

    /*
      Set when the visitor did not come here by choice: their session was
      refused mid-task and they were sent back to sign in. Worth saying,
      because from their side the application signed them out on its own.

      Read from the module rather than from router state - see
      recordSessionExpiryNotice for why the state does not always survive the
      trip. It carries `from` too, so the return journey works either way.

      Subscribed rather than copied on mount, so a session refused while this
      form is already open explains itself as well.
    */
    const sessionNotice = useSyncExternalStore(
        subscribeSessionExpiryNotice,
        getSessionExpiryNotice
    );

    // Router state for a reader stopped mid-task, the note for a lapsed session
    const redirectTo = location.state?.from || sessionNotice?.from;


    // Authentication
    const { login, loginWithGoogle } = useAuth();

    // Backend error message
    const [serverError, setServerError] = useState("");

    // True only while a Google credential is being exchanged with the backend
    const [googleBusy, setGoogleBusy] = useState(false);

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
     * A Google credential has arrived.
     *
     * Wrapped in useCallback because useGoogleSignIn holds it in a ref: a new
     * function identity on every render is harmless, but a stable one keeps the
     * intent clear - Google's button is drawn once and not re-created.
     */
    const onGoogleCredential = useCallback(async (credential) => {

        setServerError("");

        // Set only now, not when the button was pressed: a visitor who closes
        // Google's window never reaches here, so nothing is left spinning
        setGoogleBusy(true);

        try {

            const response = await loginWithGoogle(credential);

            /*
              Verified by Google, but new to Clean Bharat. The role and location
              this application requires cannot come from Google, so registration
              is finished on the next page.

              The credential travels in router state: in memory, not in the URL
              where it would be logged by proxies and kept in history, and not in
              localStorage where it would outlive the tab. It is re-verified by
              the backend before anything is created.
            */
            if (response.registrationRequired) {

                navigate("/register", {
                    state: {
                        googleCredential: credential,
                        googleEmail: response.email,
                        googleName: response.name,
                        from: redirectTo,
                    },
                });

                return;
            }

            // Same destination logic as the password form below
            navigate(resolvePostLoginPath(redirectTo, response.role), {
                replace: true,
            });

        } catch (error) {

            setServerError(getErrorMessage(error));

        } finally {

            setGoogleBusy(false);

        }

    }, [loginWithGoogle, navigate, redirectTo]);

    /**
     * Google itself could not complete the sign-in.
     *
     * A closed window returns null from the helper and is passed over in
     * silence - someone who changed their mind has not made a mistake.
     */
    const onGoogleError = useCallback((error) => {

        const message = getGoogleSignInError(error);

        if (message) {
            setServerError(message);
        }

        setGoogleBusy(false);

    }, []);

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

              The destination comes from resolvePostLoginPath because
              PublicRoute redirects on the new session as well - both have to
              choose the same page, or whichever renders last decides.

              replace: true keeps /login out of the history stack, so
              Back from the report does not bounce through the form.
            */
            navigate(resolvePostLoginPath(redirectTo, response.role), {
                replace: true,
            });


        } catch (error) {

            /*
              getErrorMessage rather than reading response.data.message here: a
              cold-start timeout has no response body at all, and the old
              fallback answered it with "Something went wrong", which is both
              untrue and useless. The shared helper knows a timeout from a
              rejection and says so.
            */
            setServerError(getErrorMessage(error));

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
              Explains why the form appeared, for a reader who did not ask
              for it - either stopped mid-task by LoginRequiredDialog, or
              returned here because their session was refused.

              Both know where the visitor was, so the expired case is checked
              first and gets the stronger wording: one is an invitation, the
              other is an interruption. Hidden once the form has its own
              error, which is the more immediate thing to read.
            */}
            {sessionNotice && !serverError && (
                <div className="mb-5">
                    <Alert type="warning" title="Your Session Has Ended">
                        You were signed out because your session expired. Sign in
                        again to continue where you left off.
                    </Alert>
                </div>
            )}

            {redirectTo && !sessionNotice && !serverError && (
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

            {/*
              Google first where it is set up at all. Renders nothing - divider
              included - when it is not, so the page is simply the form.
            */}
            <GoogleSignInButton
                onCredential={onGoogleCredential}
                onError={onGoogleError}
                busy={googleBusy}
                divider
            />

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

                {/*
                  Sits under the button, where someone waiting on it is already
                  looking. Shows itself only while the backend is starting.
                */}
                <BackendWakeNotice />

            </form>

            {/* Reading needs no account, so say so instead of implying it does */}
            <p className="mt-5 border-t border-rule pt-4 text-center text-xs leading-relaxed text-ink-muted">
                Reports, cleanups and rankings can be read without an account.
                An account is needed to file a report or join a discussion.
            </p>

        </AuthShell>

    );

}
