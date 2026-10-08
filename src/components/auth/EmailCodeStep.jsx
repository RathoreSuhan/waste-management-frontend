import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BiText from "@/components/common/BiText";
import BackendWakeNotice from "@/components/common/BackendWakeNotice";

import { verificationCodeSchema } from "@/schemas/authSchema";
import { UI } from "@/i18n/strings";

/**
 * ============================================================================
 * Email Code Step
 * ============================================================================
 *
 * The second half of signing up: the six-digit code that proves the person can
 * read mail at the address they gave.
 *
 * There is no way to ask Google, Yahoo or Microsoft whether an address exists -
 * those lookups were withdrawn because they let anyone enumerate accounts - so
 * delivering something to the mailbox is the only check that works for every
 * provider. This screen is that check.
 *
 * Nothing has been created when this renders. The account is written only once
 * the code comes back correct, which is also why leaving this screen loses
 * nothing: RegisterPage still holds the form.
 *
 * Props
 *   email          where the code went, shown so a typo is obvious
 *   onVerify       called with the six digits
 *   onResend       called to ask for a fresh code
 *   onChangeEmail  back to the form
 * ============================================================================
 */

// Matches the backend's own cooldown in EmailVerificationService
const RESEND_COOLDOWN_SECONDS = 60;

export default function EmailCodeStep({
    email,
    onVerify,
    onResend,
    onChangeEmail,
}) {

    /*
      Counts down from the moment a code was sent, which is the moment this
      mounts. Only an affordance - the backend refuses an early resend on its
      own and says how long is left, so this cannot be bypassed by editing it.
    */
    const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(verificationCodeSchema),
        defaultValues: { verificationCode: "" },
    });

    useEffect(() => {

        if (secondsLeft <= 0) {
            return;
        }

        const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);

        // Cleared on unmount so a timer cannot fire into a gone component
        return () => clearTimeout(timer);
    }, [secondsLeft]);

    async function onSubmit(data) {
        await onVerify(data.verificationCode);
    }

    function resend() {
        setSecondsLeft(RESEND_COOLDOWN_SECONDS);
        onResend();
    }

    return (
        <div className="space-y-5">

            <div className="space-y-1.5">
                <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-ink">
                    <MailCheck size={18} className="text-india-green" aria-hidden="true" />
                    <BiText {...UI.auth.checkYourEmail} />
                </h2>

                <p className="text-sm leading-relaxed text-ink-muted">
                    <BiText {...UI.auth.codeSentTo} />{" "}
                    {/* The address itself, so a mistyped one is caught here */}
                    <strong className="break-all text-ink">{email}</strong>
                </p>

                <p className="text-xs leading-relaxed text-ink-muted">
                    <BiText {...UI.auth.codeExpiryNote} />
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                <Input
                    label={<BiText {...UI.auth.verificationCodeLabel} />}
                    // numeric keypad on a phone, where most people will read the mail
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    {...register("verificationCode")}
                    error={errors.verificationCode}
                />

                {/*
                  isSubmitting is this form's own, so the button shows the wait
                  while onVerify is in flight - the account is created by that
                  call, which on a cold start can take most of a minute.
                */}
                <Button type="submit" loading={isSubmitting}>
                    <MailCheck size={15} aria-hidden="true" />
                    <BiText {...UI.auth.verifyAndCreate} primaryOnly />
                </Button>

                {secondsLeft > 0 ? (
                    <p className="text-center text-xs text-ink-muted">
                        {/* The pair is interpolated, so both languages carry the number */}
                        <BiText
                            en={UI.auth.resendIn.en.replace("{seconds}", secondsLeft)}
                            hi={UI.auth.resendIn.hi.replace("{seconds}", secondsLeft)}
                        />
                    </p>
                ) : (
                    <button
                        type="button"
                        onClick={resend}
                        className="block w-full text-center text-xs font-semibold text-gov-blue hover:underline"
                    >
                        <BiText {...UI.auth.resendCode} />
                    </button>
                )}

                <button
                    type="button"
                    onClick={onChangeEmail}
                    className="block w-full text-center text-xs font-semibold text-gov-blue hover:underline"
                >
                    <BiText {...UI.auth.useAnotherEmail} />
                </button>

                {/* Same cold-start explanation as everywhere else a request waits */}
                <BackendWakeNotice />
            </form>
        </div>
    );
}
