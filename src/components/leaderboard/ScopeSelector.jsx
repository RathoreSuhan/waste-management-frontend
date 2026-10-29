import { useCallback, useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useForm } from "react-hook-form";

import {
    LEADERBOARD_SCOPE,
    LEADERBOARD_SCOPES,
} from "@/constants/badgeConstants";
import LocationCascade from "@/components/common/LocationCascade";
import { getLocationDirectory } from "@/services/locationService";

/**
 * The district picker's own form scope, mounted only while the DISTRICT tab
 * is active. Reuses the shared LocationCascade (without the ULB level) and
 * submits the resolved state and district NAMES - the backend identifies a
 * district board by the (state, district) name pair, normalising both the
 * way registration stores them.
 *
 * The directory is fetched here, scoped to this tab's lifetime: it is a
 * public reference file cached for a day at the browser, so reopening the
 * tab within a session costs nothing.
 */
function DistrictPicker({ onSubmitPlace }) {

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

    const {
        control,
        handleSubmit,
        setValue,
        clearErrors,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues: { stateCode: "", districtCode: "" },
    });

    const values = {
        stateCode: watch("stateCode"),
        districtCode: watch("districtCode"),
    };

    function handlePlaceChange(next) {
        setValue("stateCode", next.stateCode, { shouldValidate: false });
        setValue("districtCode", next.districtCode, { shouldValidate: false });
        clearErrors("districtCode");
    }

    function submitPlace() {

        const state = directory?.states?.find(
            (candidate) => candidate.code === values.stateCode
        );
        const district = state?.districts?.find(
            (candidate) => candidate.code === values.districtCode
        );

        if (!state || !district) {
            return; // the cascade's required rules have already shown why
        }

        onSubmitPlace({ state: state.name, district: district.name });
    }

    // Show means something only once a full state + district pair is chosen
    const pickReady = Boolean(values.stateCode && values.districtCode);

    return (
        <form onSubmit={handleSubmit(submitPlace)} className="flex flex-wrap items-start gap-2">
            <LocationCascade
                control={control}
                errors={errors}
                directory={directory}
                directoryStatus={directoryStatus}
                onRetry={loadDirectory}
                values={values}
                onChangePlace={handlePlaceChange}
                showUlb={false}
                idPrefix="leaderboard-district"
            />
            <button
                type="submit"
                disabled={!pickReady}
                className="inline-flex items-center gap-1.5 border border-gov-navy bg-gov-navy px-3 py-2 text-sm font-medium text-white transition hover:bg-gov-navy/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gov-navy"
            >
                <Search size={14} aria-hidden="true" />
                Show
            </button>
        </form>
    );
}

/**
 * ============================================================================
 * Scope Selector
 * ============================================================================
 *
 * Chooses between the national, state, district and city rankings.
 *
 * The location is submitted through a form rather than filtering as the
 * visitor types. Each keystroke would otherwise be a request to
 * /api/leaderboard/city/{partial}, and a half-typed "Pat" is a different
 * place from "Patna" as far as the backend is concerned.
 *
 * The pending value is held locally and only handed upwards on submit,
 * which is what keeps the request count to one per search.
 *
 * The DISTRICT tab (shown only when the directory cascade is switched on)
 * picks the place from the LGD directory instead of free text, because a
 * district board is identified by the (state, district) pair - two states
 * can name a district the same way.
 * ============================================================================
 */

export default function ScopeSelector({
    scope,
    location,
    onScopeChange,
    onLocationSubmit,
    showDistrict = false,
    onDistrictSubmit,
}) {

    // What the visitor has typed but not yet submitted
    const [draft, setDraft] = useState(location || "");

    // NATIONAL covers the whole country, so it takes no location
    const needsLocation = scope !== LEADERBOARD_SCOPE.NATIONAL;

    const isDistrict = scope === LEADERBOARD_SCOPE.DISTRICT;

    const placeholder =
        scope === LEADERBOARD_SCOPE.STATE
            ? "Enter a state, e.g. Bihar"
            : "Enter a city, e.g. Patna";

    /**
     * Hand the typed location upwards.
     */
    function handleSubmit(event) {

        // Keep the page from reloading on submit
        event.preventDefault();

        onLocationSubmit(draft);
    }

    /**
     * Switch scope, clearing any half-typed location.
     *
     * A city left in the box while the state tab is active would be
     * misleading, so the draft is reset with the scope.
     */
    function handleScopeChange(nextScope) {
        setDraft("");

        onScopeChange(nextScope);
    }

    return (
        <div className="mb-5 border border-rule bg-white p-3">

            <div className="flex flex-wrap items-center justify-between gap-3">

                {/* Scope tabs */}
                <div className="flex flex-wrap gap-2" role="group" aria-label="Leaderboard area">
                    {LEADERBOARD_SCOPES.map((option) => {

                        // The district tab is offered only with the directory cascade on
                        if (option.value === LEADERBOARD_SCOPE.DISTRICT && !showDistrict) {
                            return null;
                        }

                        const isActive = option.value === scope;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleScopeChange(option.value)}
                                aria-pressed={isActive}
                                className={`border px-3 py-1.5 text-sm font-medium transition ${isActive
                                    ? "border-gov-navy bg-gov-navy text-white"
                                    : "border-rule bg-white text-ink hover:border-gov-navy hover:text-gov-navy"
                                    }`}
                            >
                                {option.label}

                                {/* Hindi gloss, secondary to the English label */}
                                <span
                                    className={`ml-1.5 text-[11px] ${isActive ? "text-white/60" : "text-ink-muted"
                                        }`}
                                >
                                    {option.labelHi}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Free-text location box, shown only for the state and city scopes */}
                {needsLocation && !isDistrict && (
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">

                        <label htmlFor="leaderboard-location" className="sr-only">
                            {scope === LEADERBOARD_SCOPE.STATE ? "State name" : "City name"}
                        </label>

                        <input
                            id="leaderboard-location"
                            type="text"
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            placeholder={placeholder}
                            className="w-56 border border-rule px-3 py-1.5 text-sm text-ink outline-none focus:border-gov-navy"
                        />

                        <button
                            type="submit"
                            disabled={!draft.trim()}
                            className="inline-flex items-center gap-1.5 border border-gov-navy bg-gov-navy px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gov-navy/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gov-navy"
                        >
                            <Search size={14} aria-hidden="true" />
                            Show
                        </button>
                    </form>
                )}
            </div>

            {/* District scope picks its place from the directory */}
            {needsLocation && isDistrict && (
                <div className="mt-3 border-t border-rule pt-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-muted">
                        <MapPin size={12} aria-hidden="true" />
                        Choose a state and district — the ranking covers every municipal area inside the district.
                    </p>

                    <DistrictPicker onSubmitPlace={onDistrictSubmit} />
                </div>
            )}
        </div>
    );
}

