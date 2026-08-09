import { useState } from "react";
import { Search } from "lucide-react";

import {
    LEADERBOARD_SCOPE,
    LEADERBOARD_SCOPES,
} from "@/constants/badgeConstants";

/**
 * ============================================================================
 * Scope Selector
 * ============================================================================
 *
 * Chooses between the national, state and city rankings.
 *
 * The location is submitted through a form rather than filtering as the
 * visitor types. Each keystroke would otherwise be a request to
 * /api/leaderboard/city/{partial}, and a half-typed "Pat" is a different
 * place from "Patna" as far as the backend is concerned.
 *
 * The pending value is held locally and only handed upwards on submit,
 * which is what keeps the request count to one per search.
 * ============================================================================
 */

export default function ScopeSelector({
    scope,
    location,
    onScopeChange,
    onLocationSubmit,
}) {

    // What the visitor has typed but not yet submitted
    const [draft, setDraft] = useState(location || "");

    // NATIONAL covers the whole country, so it takes no location
    const needsLocation = scope !== LEADERBOARD_SCOPE.NATIONAL;

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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-rule bg-white p-3">

            {/* Scope tabs */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Leaderboard area">
                {LEADERBOARD_SCOPES.map((option) => {

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

            {/* Location box, shown only for the state and city scopes */}
            {needsLocation && (
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
                        className="inline-flex items-center gap-1.5 border border-gov-navy bg-gov-navy px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gov-navy/90"
                    >
                        <Search size={14} aria-hidden="true" />
                        Show
                    </button>
                </form>
            )}
        </div>
    );
}
