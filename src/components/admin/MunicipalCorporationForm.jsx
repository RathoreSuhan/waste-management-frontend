import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import {
    municipalCorporationSchema,
    CORPORATION_MAX_LENGTHS,
} from "@/schemas/municipalCorporationSchema";

/**
 * ==========================================================
 * MunicipalCorporationForm
 * ----------------------------------------------------------
 * Entry form for a municipal corporation record, shared by
 * the create and edit screens.
 *
 * One form serves both because the backend update replaces
 * every field anyway - a separate edit form would only be the
 * same four inputs with a different heading.
 * ==========================================================
 */

export default function MunicipalCorporationForm({
    // Existing record when editing, undefined when creating
    defaultValues,
    onSubmit,
    submitLabel = "Save Record",
    // Failure message from the API call
    error = "",
}) {

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(municipalCorporationSchema),
        defaultValues: defaultValues || {
            city: "",
            organizationName: "",
            phone: "",
            email: "",
        },
    });

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-gov border border-rule bg-white"
        >
            <div className="border-b border-rule bg-paper px-5 py-3">
                <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                    Corporation Details
                </h2>
            </div>

            <div className="space-y-4 p-5">

                {/* API failure, e.g. the record was removed by someone else */}
                {error && (
                    <Alert type="error" title="Record not saved">
                        {error}
                    </Alert>
                )}

                <Input
                    label="City"
                    required
                    placeholder="e.g. Bhubaneswar"
                    // Reports are matched to a corporation by this value
                    hint="Reports filed in this city will be routed to this office."
                    maxLength={CORPORATION_MAX_LENGTHS.city}
                    error={errors.city}
                    {...register("city")}
                />

                <Input
                    label="Organisation Name"
                    required
                    placeholder="e.g. Bhubaneswar Municipal Corporation"
                    maxLength={CORPORATION_MAX_LENGTHS.organizationName}
                    error={errors.organizationName}
                    {...register("organizationName")}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                        label="Contact Number"
                        required
                        type="tel"
                        placeholder="e.g. 0674 2431299"
                        maxLength={CORPORATION_MAX_LENGTHS.phone}
                        error={errors.phone}
                        {...register("phone")}
                    />

                    <Input
                        label="Email Address"
                        required
                        type="email"
                        placeholder="e.g. commissioner@bmc.gov.in"
                        maxLength={CORPORATION_MAX_LENGTHS.email}
                        error={errors.email}
                        {...register("email")}
                    />
                </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-rule bg-paper px-5 py-3">

                <Link
                    to="/admin/municipal-corporations"
                    className="rounded-gov border border-rule bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-gov-blue hover:text-gov-blue"
                >
                    Cancel
                </Link>

                <Button
                    type="submit"
                    loading={isSubmitting}
                    fullWidth={false}
                >
                    {submitLabel}
                </Button>
            </div>
        </form>
    );
}
