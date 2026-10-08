import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, UserPlus } from "lucide-react";

import Alert from "@/components/ui/Alert";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import AuthShell from "@/components/auth/AuthShell";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import EmailCodeStep from "@/components/auth/EmailCodeStep";
import BackendWakeNotice from "@/components/common/BackendWakeNotice";
import BiText from "@/components/common/BiText";

import useAuth from "@/hooks/useAuth";

import {
    buildRegisterSchema,
    AUTH_MAX_LENGTHS,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
} from "@/schemas/authSchema";
import { getErrorMessage, getGoogleSignInError } from "@/utils/errorMessage";
import { resolvePostLoginPath } from "@/utils/roleRedirect";
import { UI } from "@/i18n/strings";

import background from "@/assets/background1.jpg";

/**
 * ============================================================================
 * Register Page
 * ============================================================================
 *
 * One form, two ways to prove the email address on it.
 *
 * Typed in      the usual way. Name, address, password, role and location, and
 *               then a six-digit code sent to that address, typed back. This is
 *               what lets somebody on Yahoo, Outlook, a college or a workplace
 *               domain open an account - Google can vouch for none of those.
 *
 * From Google   "Continue with Google" above the form. The address arrives
 *               inside a token Google signed, so the email field is replaced by
 *               the verified address and there is no password to choose. The
 *               role and location questions are the same either way, because
 *               Google cannot answer them.
 *
 * Neither route takes an address on trust. There is no API anywhere that will
 * say whether a typed Gmail, Yahoo or Outlook address exists - those lookups
 * were withdrawn because they let anyone enumerate accounts - so the only real
 * checks are a signed token or something delivered to the mailbox.
 *
 * Admin accounts are not self service: an existing admin promotes a citizen
 * from the admin portal.
 *
 * Municipal Corporations are not self service either. A corporation is created
 * by the admin under Municipal Bodies, and that registered official email is
 * the only account that can open the Municipal Dashboard for its city -
 * choosing the "Municipal Corporation" cleaner type below describes the kind of
 * crew you are, and grants no approval powers.
 * ============================================================================
 */

export default function RegisterPage() {

    const navigate = useNavigate();

    const location = useLocation();

    /*
      A verified Google identity, when this sign-up came from Google.

      Seeded from router state when the sign-in page sent the visitor here, so
      they are not asked to press Google a second time. Held in React state
      only: it is a live credential, so it never reaches the URL, where proxies
      and browser history would keep it, nor localStorage, where it would
      outlive the tab.
    */
    const [googleIdentity, setGoogleIdentity] = useState(() => {

        const { googleCredential, googleEmail, googleName } = location.state || {};

        return googleCredential
            ? { credential: googleCredential, email: googleEmail, name: googleName }
            : null;
    });

    // Set once a code has been sent; this is what shows the code step
    const [pendingEmail, setPendingEmail] = useState(null);

    const [serverError, setServerError] = useState("");
    const [googleBusy, setGoogleBusy] = useState(false);

    // Where the visitor was before being asked to sign in, if anywhere
    const redirectTo = location.state?.from;

    const { loginWithGoogle, registerWithGoogle, registerWithEmail } = useAuth();

    /*
      A Google sign-up has no address to type and no password to choose, so
      those two rules are dropped from the schema - which also makes Zod strip
      the fields, so a password left in form state cannot be sent with it.

      Memoised on the one thing it depends on; react-hook-form reads the
      resolver fresh on each validation, so swapping it mid-form is supported.
    */
    const resolver = useMemo(
        () => zodResolver(buildRegisterSchema({ requireCredentials: !googleIdentity })),
        [googleIdentity]
    );

    const {

        register,

        handleSubmit,

        getValues,

        setValue,

        watch,

        formState: {
            errors,
            isSubmitting,
        },

    } = useForm({

        resolver,

        defaultValues: {

            // Prefilled from Google when the sign-in page sent one through;
            // somebody who pressed Google on this page gets it from setValue below
            name: googleIdentity?.name || "",

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

    /** Strips the cleaner-only fields a citizen never filled in. */
    function toPayload(data) {

        const payload = { ...data };

        if (payload.role === "ROLE_CITIZEN") {
            delete payload.cleanerType;
            delete payload.organizationName;
        }

        return payload;
    }

    /**
     * A Google credential has arrived.
     *
     * Sent to the backend first rather than straight into the form, because
     * this person may already have an account - somebody who pressed Register
     * when they meant Sign In, or an account whose address matches. Either way
     * they are signed in and sent on, and no second account is made.
     */
    const onGoogleCredential = useCallback(async (credential) => {

        setServerError("");

        // Set only now, not when the button was pressed: a visitor who closes
        // Google's window never reaches here, so nothing is left spinning
        setGoogleBusy(true);

        try {

            const response = await loginWithGoogle(credential);

            // Already has an account: signed in, nothing more to fill in
            if (!response.registrationRequired) {

                navigate(resolvePostLoginPath(redirectTo, response.role), {
                    replace: true,
                });

                return;
            }

            // New here: the form stays, with the verified address in place of
            // the email and password fields
            setGoogleIdentity({
                credential,
                email: response.email,
                name: response.name,
            });

            /*
              defaultValues was fixed on the first render, when there was no
              identity yet, so the name has to be written in now. Guarded,
              because Google does not always send one and an empty value would
              wipe anything already typed.
            */
            if (response.name) {
                setValue("name", response.name, { shouldValidate: false });
            }

        } catch (error) {

            setServerError(getErrorMessage(error));

        } finally {

            setGoogleBusy(false);

        }

    }, [loginWithGoogle, navigate, redirectTo, setValue]);

    const onGoogleError = useCallback((error) => {

        const message = getGoogleSignInError(error);

        if (message) {
            setServerError(message);
        }

        setGoogleBusy(false);

    }, []);

    /**
     * Create Account pressed.
     *
     * The Google route creates the account outright - the address is already
     * proved. The typed route cannot be, so this only asks for a code to be
     * sent; the account is created in onVerify below.
     */
    async function onSubmit(data) {

        setServerError("");

        try {

            if (googleIdentity) {

                const response = await registerWithGoogle({
                    ...toPayload(data),

                    // Re-verified by the backend; the address is read from it there
                    credential: googleIdentity.credential,
                });

                navigate(resolvePostLoginPath(redirectTo, response.role), {
                    replace: true,
                });

                return;
            }

            const response = await registerWithEmail(toPayload(data));

            // Nothing has been created yet - the code decides that
            setPendingEmail(response.email);

        } catch (error) {

            // Shared wording, so a cold-start timeout is named rather than
            // reported as "Something went wrong" - see LoginPage
            setServerError(getErrorMessage(error));

        }

    }

    /** The code came back: this is the call that actually creates the account. */
    async function onVerify(verificationCode) {

        setServerError("");

        try {

            // getValues, because the form is still mounted behind this step
            const response = await registerWithEmail({
                ...toPayload(getValues()),
                verificationCode,
            });

            navigate(resolvePostLoginPath(redirectTo, response.role), {
                replace: true,
            });

        } catch (error) {

            setServerError(getErrorMessage(error));

        }

    }

    /** Asks for a fresh code; the backend refuses one sent too soon. */
    async function onResendCode() {

        setServerError("");

        try {
            await registerWithEmail(toPayload(getValues()));
        } catch (error) {
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

            {serverError && (

                <div className="mb-5">

                    <Alert>

                        {serverError}

                    </Alert>

                </div>

            )}

            {pendingEmail ? (

                <EmailCodeStep
                    email={pendingEmail}
                    onVerify={onVerify}
                    onResend={onResendCode}
                    // Back to the form; nothing was created, so nothing is lost
                    onChangeEmail={() => setPendingEmail(null)}
                />

            ) : (

                <>
                    {/*
                      Renders nothing at all when Google sign-in is not
                      configured for this deployment - divider included - so the
                      page is simply the form, as it always was.
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

                            {googleIdentity ? (

                                /*
                                  The verified address, shown rather than asked
                                  for. Not a disabled input: a greyed-out field
                                  still reads as something that was filled in,
                                  when in fact nothing here could change it -
                                  the backend reads the address out of the
                                  signed Google token and ignores the body.
                                */
                                <div className="space-y-1.5">
                                    <p className="block text-sm font-semibold text-ink">
                                        Email
                                    </p>

                                    <p className="flex items-center gap-2 rounded-gov border border-rule bg-paper px-3 py-2 text-sm text-ink">
                                        <ShieldCheck
                                            size={15}
                                            className="shrink-0 text-india-green"
                                            aria-hidden="true"
                                        />

                                        <span className="truncate">{googleIdentity.email}</span>

                                        <span className="ml-auto shrink-0 text-[11px] font-semibold tracking-wide text-india-green uppercase">
                                            <BiText {...UI.auth.verifiedWithGoogle} primaryOnly />
                                        </span>
                                    </p>

                                    <p className="text-xs text-ink-muted">
                                        <BiText {...UI.auth.emailNotEditable} />
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => setGoogleIdentity(null)}
                                        className="text-xs font-semibold text-gov-blue hover:underline"
                                    >
                                        <BiText {...UI.auth.useAnotherGoogleAccount} />
                                    </button>
                                </div>

                            ) : (

                                <>
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
                                </>

                            )}
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
                </>
            )}

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
