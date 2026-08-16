import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import PageHeading from "@/components/common/PageHeading";
import PageContainer from "@/components/layout/PageContainer";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { changePasswordSchema } from "@/schemas/authSchema";
import { changePassword } from "@/services/accountService";
import { getErrorMessage } from "@/utils/errorMessage";

export default function ChangePasswordPage() {
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values) => {
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await changePassword(values);
            setSuccessMessage(
                response?.message || "Password changed successfully"
            );
            reset();
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Unable to change your password.")
            );
        }
    };

    return (
        <PageContainer maxWidth="max-w-2xl" className="px-0 py-0">
            <PageHeading
                title="Change Password"
                titleHi="पासवर्ड बदलें"
                subtitle="Use your current password to set a new password for your account."
            />

            <form
                className="space-y-5"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
            >
                {errorMessage && (
                    <Alert type="error">{errorMessage}</Alert>
                )}

                {successMessage && (
                    <Alert type="success">{successMessage}</Alert>
                )}

                <Input
                    label="Current Password"
                    type="password"
                    autoComplete="current-password"
                    required
                    error={errors.currentPassword}
                    {...register("currentPassword")}
                />

                <Input
                    label="New Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    hint="Use at least 6 characters."
                    error={errors.newPassword}
                    {...register("newPassword")}
                />

                <Input
                    label="Confirm New Password"
                    type="password"
                    autoComplete="new-password"
                    required
                    error={errors.confirmPassword}
                    {...register("confirmPassword")}
                />

                <Button type="submit" loading={isSubmitting}>
                    Change Password
                </Button>
            </form>
        </PageContainer>
    );
}