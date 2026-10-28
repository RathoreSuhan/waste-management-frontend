import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import LocationCascade from "@/components/common/LocationCascade";
import { getLocationDirectory } from "@/services/locationService";
import {
    buildMunicipalCorporationEditSchema,
    municipalCorporationDirectorySchema,
    CORPORATION_MAX_LENGTHS,
} from "@/schemas/municipalCorporationSchema";

/**
 * ==========================================================
 * MunicipalCorporationForm
 * ----------------------------------------------------------
 * Entry form for a municipal corporation record, shared by
 * the create and edit screens.
 *
 * The service area is chosen from the LGD directory cascade:
 * create always sends the three codes, and the stored city is the
 * workbook's canonical ULB name. On an existing record the codes
 * MAP the office to its ULB while the stored city is preserved
 * untouched - reports filed before the upgrade still route through
 * that legacy value - so the edit form shows the current routing
 * city as read-only text instead of an editable field.
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

    const isEdit = Boolean(defaultValues);

    // The existing ULB code, when the record has already been mapped
    const existingUlbCode = defaultValues?.ulbCode || "";

    /*
      The state/district/ULB directory this form's cascade is built from,
      the same source registration uses.
    */
    const [directory, setDirectory] = useState(null);
    const [directoryStatus, setDirectoryStatus] = useState("loading");

    const loadDirectory = useCallback(async () => {

        setDirectoryStatus("loading");

        try {
            const data = await getLocationDirectory();
            setDirectory(data);
            setDirectoryStatus("ready");
        } catch {
            setDirectoryStatus("failed");
        }

    }, []);

    useEffect(() => {
        loadDirectory();
    }, [loadDirectory]);

    /*
      An already-mapped record preselects its cascade levels: the directory
      carries every ULB, so the stored code finds its state and district.
    */
    const preselected = useMemo(() => {

        if (!existingUlbCode || directoryStatus !== "ready") {
            return { stateCode: "", districtCode: "" };
        }

        for (const state of directory?.states ?? []) {
            for (const district of state.districts ?? []) {
                if ((district.ulbs ?? []).some((ulb) => ulb.code === existingUlbCode)) {
                    return { stateCode: state.code, districtCode: district.code };
                }
            }
        }

        return { stateCode: "", districtCode: "" };
    }, [existingUlbCode, directory, directoryStatus]);

    const {
        register,
        control,
        handleSubmit,
        setValue,
        clearErrors,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(
            isEdit
                ? buildMunicipalCorporationEditSchema()
                : municipalCorporationDirectorySchema
        ),
        defaultValues: defaultValues
            ? {
                city: defaultValues.city || "",
                stateCode: "",
                districtCode: "",
                ulbCode: existingUlbCode,
                organizationName: defaultValues.organizationName || "",
                phone: defaultValues.phone || "",
                email: defaultValues.email || "",
            }
            : {
                stateCode: "",
                districtCode: "",
                ulbCode: "",
                organizationName: "",
                phone: "",
                email: "",
            },
    });

    const values = {
        stateCode: watch("stateCode"),
        districtCode: watch("districtCode"),
        ulbCode: watch("ulbCode"),
    };

    // Cascade levels reseed once the directory (and any preselection) arrives
    useEffect(() => {
        if (isEdit && preselected.stateCode && !values.stateCode) {
            setValue("stateCode", preselected.stateCode, { shouldValidate: false });
            setValue("districtCode", preselected.districtCode, { shouldValidate: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, preselected.stateCode, preselected.districtCode]);

    /** Writes the whole triple, clearing stale child selections in the form. */
    function handlePlaceChange(next) {
        setValue("stateCode", next.stateCode, { shouldValidate: false });
        setValue("districtCode", next.districtCode, { shouldValidate: false });
        setValue("ulbCode", next.ulbCode, { shouldValidate: false });
        clearErrors("ulbCode");
    }

    /**
     * Shapes the payload for the backend's two accepted forms:
     *
     * Create   codes only - the city is stored as the canonical ULB name.
     * Edit     codes only when a ULB is chosen (the stored city is then
     *          preserved server-side); otherwise the legacy city is sent
     *          back unchanged, exactly as the old form round-tripped it.
     */
    function assemblePayload(data) {

        const payload = {
            organizationName: data.organizationName,
            phone: data.phone,
            email: data.email,
        };

        const choseCodes = Boolean(
            data.stateCode && data.districtCode && data.ulbCode
        );

        if (choseCodes || !isEdit) {
            payload.stateCode = data.stateCode;
            payload.districtCode = data.districtCode;
            payload.ulbCode = data.ulbCode;
        } else {
            payload.city = data.city; // legacy round-trip, unchanged
        }

        return payload;
    }

    return (
        <form
            onSubmit={handleSubmit((data) => onSubmit(assemblePayload(data)))}
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

                {isEdit && defaultValues.city && (
                    <p className="rounded-gov border border-rule bg-paper px-3 py-2 text-xs text-ink-muted">
                        Current routing city:{" "}
                        <span className="font-semibold text-ink">{defaultValues.city}</span>
                        {" "}— preserved as-is for reports filed before the upgrade.
                        {existingUlbCode && " This office is mapped to a directory ULB; reports route to it by code."}
                    </p>
                )}

                <LocationCascade
                    control={control}
                    errors={errors}
                    directory={directory}
                    directoryStatus={directoryStatus}
                    onRetry={loadDirectory}
                    values={values}
                    onChangePlace={handlePlaceChange}
                    idPrefix="corporation"
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
