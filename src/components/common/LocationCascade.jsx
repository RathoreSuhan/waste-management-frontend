import { useMemo } from "react";
import { Controller } from "react-hook-form";
import SearchableSelect from "@/components/ui/SearchableSelect";
import BiText from "@/components/common/BiText";
import { UI } from "@/i18n/strings";

/*
  Location names are English source data, so one collator gives State,
  District and City/ULB the same predictable A–Z order. Numeric comparison
  handles names containing numbers naturally; punctuation is ignored so
  abbreviations such as S.A.S are placed by their letters. Shared with the
  sign-up form, which established the ordering.
*/
const LOCATION_NAME_COLLATOR = new Intl.Collator("en", {
    sensitivity: "base",
    numeric: true,
    ignorePunctuation: true,
});

function compareLocationNames(first, second) {
    return LOCATION_NAME_COLLATOR.compare(first.name, second.name);
}

/**
 * ============================================================================
 * Location Cascade
 * ============================================================================
 *
 * The state → district → city-or-ULB picker every directory-backed form
 * shares, extracted from the sign-up form's implementation so the report
 * form and the municipal-body form offer exactly the same places in exactly
 * the same order.
 *
 * Codes, never names: the backend resolves every submission against the same
 * bundled LGD directory, so a "Punjab + Gaya" mistake is impossible rather
 * than corrected. Choosing a parent clears everything chosen beneath it.
 *
 * Props:
 * - control / errors            react-hook-form plumbing for the three fields
 * - directory, directoryStatus  the fetched directory tree and its load state
 * - onRetry                     re-fetch, offered when the directory failed
 * - values                      { stateCode, districtCode, ulbCode } watched values
 * - onChangePlace               called with the whole next triple on any change
 * - showUlb                     false for pickers that stop at the district
 * - idPrefix                    unique id prefix per mounted form
 * - layout                      "grid" (default) stacks the fields in the
 *                               form grid, labels visible; "toolbar" lines
 *                               them up inline with hidden labels and the
 *                               compact height the small search inputs use,
 *                               for toolbars that hold the picker beside
 *                               other controls
 * ============================================================================
 */

export default function LocationCascade({
    control,
    errors,
    directory,
    directoryStatus,
    onRetry,
    values,
    onChangePlace,
    showUlb = true,
    idPrefix = "location",
    layout = "grid",
}) {

    const isToolbar = layout === "toolbar";

    /*
      The toolbar variant only changes presentation: labels stay associated
      for screen readers (hidden), the inputs match the compact search-field
      height, and the parent sizes each field. Selection behavior is identical.
    */
    const toolbarFieldProps = isToolbar
        ? { dense: true, hideLabel: true, className: "w-40 sm:w-48 min-w-0" }
        : {};

    const states = useMemo(() => directory?.states ?? [], [directory]);

    const districts = useMemo(
        () => states.find((state) => state.code === values.stateCode)?.districts ?? [],
        [states, values.stateCode]
    );

    const ulbs = useMemo(
        () => districts.find((district) => district.code === values.districtCode)?.ulbs ?? [],
        [districts, values.districtCode]
    );

    const stateOptions = useMemo(
        () => [...states]
            .sort(compareLocationNames)
            .map((state) => ({ value: state.code, label: state.name })),
        [states]
    );

    const districtOptions = useMemo(
        () => [...districts]
            .sort(compareLocationNames)
            .map((district) => ({ value: district.code, label: district.name })),
        [districts]
    );

    /*
      The type is shown because it is the honest difference between entries:
      "Ludhiana — Municipal Corporation" and a "Nagar Panchayat" are not the
      same kind of place.
    */
    const ulbOptions = useMemo(
        () => [...ulbs]
            .sort(compareLocationNames)
            .map((ulb) => ({
                value: ulb.code,
                label: `${ulb.name} — ${ulb.type}`,
            })),
        [ulbs]
    );

    return (
        <>
            {directoryStatus === "failed" && (
                <div
                    className={
                        isToolbar
                            ? "w-full text-sm text-red-600"
                            : "text-sm text-red-600"
                    }
                >
                    <BiText {...UI.auth.locationUnavailable} />
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-1 block font-semibold text-gov-blue hover:underline"
                    >
                        <BiText {...UI.backend.retry} />
                    </button>
                </div>
            )}

            <div
                className={
                    isToolbar
                        ? "flex flex-wrap items-center gap-2"
                        : "grid gap-5 sm:grid-cols-2"
                }
            >

                <Controller
                    name="stateCode"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelect
                            label={<BiText {...UI.auth.locationState} />}
                            options={stateOptions}
                            value={field.value}
                            name={field.name}
                            inputId={`${idPrefix}-state`}
                            inputRef={field.ref}
                            onBlur={field.onBlur}
                            onChange={(value) => {
                                const changed = value !== field.value;
                                field.onChange(value);

                                if (changed) {
                                    // A different state invalidates everything chosen beneath it
                                    onChangePlace({ stateCode: value, districtCode: "", ulbCode: "" });
                                }
                            }}
                            required
                            error={errors.stateCode}
                            disabled={directoryStatus === "failed"}
                            loading={directoryStatus === "loading"}
                            placeholderElement={<BiText {...UI.auth.locationChooseState} />}
                            loadingText={<BiText {...UI.auth.locationListLoading} />}
                            noMatchesText={<BiText {...UI.auth.locationNoMatches} />}
                            {...toolbarFieldProps}
                        />
                    )}
                />

                <Controller
                    name="districtCode"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelect
                            label={<BiText {...UI.auth.locationDistrict} />}
                            options={districtOptions}
                            value={field.value}
                            name={field.name}
                            inputId={`${idPrefix}-district`}
                            inputRef={field.ref}
                            onBlur={field.onBlur}
                            onChange={(value) => {
                                const changed = value !== field.value;
                                field.onChange(value);

                                if (changed) {
                                    onChangePlace({
                                        stateCode: values.stateCode,
                                        districtCode: value,
                                        ulbCode: "",
                                    });
                                }
                            }}
                            required
                            error={errors.districtCode}
                            disabled={directoryStatus !== "ready" || !values.stateCode}
                            noMatchesText={
                                districts.length === 0
                                    ? <BiText {...UI.auth.locationNoAreas} />
                                    : <BiText {...UI.auth.locationNoMatches} />
                            }
                            placeholderElement={<BiText {...UI.auth.locationChooseDistrict} />}
                            loadingText={<BiText {...UI.auth.locationListLoading} />}
                            {...toolbarFieldProps}
                        />
                    )}
                />

            </div>

            {showUlb && (
                <Controller
                    name="ulbCode"
                    control={control}
                    render={({ field }) => (
                        <SearchableSelect
                            label={<BiText {...UI.auth.locationCity} />}
                            options={ulbOptions}
                            value={field.value}
                            name={field.name}
                            inputId={`${idPrefix}-ulb`}
                            inputRef={field.ref}
                            onBlur={field.onBlur}
                            onChange={(value) => {
                                field.onChange(value);
                                onChangePlace({
                                    stateCode: values.stateCode,
                                    districtCode: values.districtCode,
                                    ulbCode: value,
                                });
                            }}
                            required
                            error={errors.ulbCode}
                            disabled={directoryStatus !== "ready" || !values.districtCode}
                            noMatchesText={
                                ulbs.length === 0
                                    ? <BiText {...UI.auth.locationNoAreas} />
                                    : <BiText {...UI.auth.locationNoMatches} />
                            }
                            placeholderElement={<BiText {...UI.auth.locationChooseCity} />}
                            loadingText={<BiText {...UI.auth.locationListLoading} />}
                        />
                    )}
                />
            )}
        </>
    );
}
