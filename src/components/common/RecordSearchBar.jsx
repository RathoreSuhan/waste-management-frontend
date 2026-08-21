import { useRef } from "react";
import { Search, X } from "lucide-react";

/**
 * ============================================================================
 * Record Search Bar
 * ============================================================================
 *
 * The search panel used by the Public Reports register, extracted so every
 * record list in the project searches the same way.
 *
 * The important behaviour is that it does NOT filter as you type. The box holds
 * `value`; the list is only narrowed when `onSearch` fires, which happens on
 * the Search button or on Enter (both are the same form submit). A register
 * that rearranges itself after every letter is unreadable while a place name is
 * being typed.
 *
 * Props:
 *   value        - current box contents (controlled by the page)
 *   onChange     - called with the new text on every keystroke
 *   onSearch     - called when the officer actually asks for the search
 *   onClear      - called by the X; must reset BOTH the box and the applied term
 *   title        - caption on the header strip
 *   placeholder  - hint inside the box
 *   ariaLabel    - accessible name of the field
 *   children     - optional extra controls (status filters, etc.) below the row
 * ============================================================================
 */

export default function RecordSearchBar({
    value,
    onChange,
    onSearch,
    onClear,
    title = "Search Records",
    placeholder = "Search records",
    ariaLabel = "Search records",
    children,
}) {

    // The box itself, so submitting can take focus off it
    const inputRef = useRef(null);

    /**
     * Run the search.
     *
     * The blur dismisses the on-screen keyboard on a phone, which would
     * otherwise cover the very results being asked for.
     */
    function handleSubmit(event) {
        event.preventDefault();

        onSearch?.();

        inputRef.current?.blur();
    }

    return (
        <div className="rounded-gov border border-rule bg-white">

            {/* Header strip, so the panel reads as a records search rather than a stray field */}
            <div className="border-b border-rule bg-paper px-4 py-2">
                <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                    {title}
                </h2>
            </div>

            <div className="p-4">

                {/* A form, so Enter and the button follow the same path.
                    role="search" marks it as the search landmark. */}
                <form
                    role="search"
                    onSubmit={handleSubmit}
                    className="flex items-center gap-2"
                >
                    <div className="relative flex-1">
                        <Search
                            size={15}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                            aria-hidden="true"
                        />

                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(event) => onChange?.(event.target.value)}
                            placeholder={placeholder}
                            aria-label={ariaLabel}
                            className="w-full rounded-gov border border-rule py-2 pr-9 pl-9 text-sm outline-none transition placeholder:text-ink-muted/60 focus:border-gov-blue"
                        />

                        {/* Offered as soon as there is anything to clear,
                            including text not yet searched for */}
                        {value.length > 0 && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-0.5 text-ink-muted transition hover:text-ink"
                                aria-label="Clear search"
                            >
                                <X size={15} aria-hidden="true" />
                            </button>
                        )}
                    </div>

                    {/* Left enabled on an empty box - pressing it then simply
                        re-runs the unfiltered register, and a control greyed
                        out for no visible reason reads as broken */}
                    <button
                        type="submit"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-gov border border-gov-blue bg-gov-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-gov-blue-dark"
                    >
                        <Search size={15} aria-hidden="true" />
                        Search
                    </button>
                </form>

                {/* Anything the page wants under the search row */}
                {children ? <div className="mt-3">{children}</div> : null}
            </div>
        </div>
    );
}