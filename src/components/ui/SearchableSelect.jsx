import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";

function filterOptions(options, query, selectedLabel = "") {
    const needle = query.trim().toLowerCase();

    // Opening an already-selected field keeps its label in the textbox but
    // still exposes the full list, so ArrowDown can move beyond that one row.
    if (!needle || needle === selectedLabel.toLowerCase()) {
        return options;
    }

    return options.filter((option) =>
        option.label.toLowerCase().includes(needle)
    );
}

/**
 * ============================================================================
 * Searchable Select
 * ============================================================================
 *
 * A type-to-filter combobox built on a plain text input plus a listbox, with
 * no dependency beyond lucide icons. Built for the registration form's
 * State → District → City cascade, where a state list of 35 is fine in a
 * native <select> but a city list of hundreds is not.
 *
 * The committed value is the only thing that matters. Typing filters; it does
 * not choose. Until an option is picked - by Enter or by click - the form
 * field still holds whatever it held, and losing focus snaps the text back to
 * the committed selection's label. That revert is not an onBlur handler
 * writing state: the input simply renders the committed label whenever the
 * list is closed, so there is no code path where a half-typed fragment
 * becomes a value.
 *
 * Accessibility follows the WAI-ARIA combobox pattern: the input is
 * role="combobox" and drives a role="listbox" of role="option" rows through
 * aria-activedescendant, so focus never has to leave the text field for a
 * screen reader to follow the highlighted choice.
 * ============================================================================
 */

export default function SearchableSelect({
    label,
    hint,
    error,
    required = false,
    disabled = false,
    loading = false,
    loadingText = "Loading…",
    noMatchesText = "No matches found",
    placeholder = "",
    // [{ value, label }] - value is what the form field receives
    options = [],
    // The committed value; "" or undefined when nothing is chosen yet
    value,
    // Receives the chosen option's value, not an event
    onChange,
    // RHF uses this to mark the field touched; still optional for plain use
    onBlur,
    // RHF's ref keeps focus-on-error and field registration working
    inputRef,
    // Lets an external label target the input and RHF retain its field name
    inputId,
    name,
    /*
      Shown while nothing is chosen. A separate prop from the native
      placeholder because a bilingual label arrives as an element, and the
      placeholder attribute can only ever be a string.
    */
    placeholderElement = null,
}) {

    const generatedId = useId();
    const id = inputId || generatedId;
    const listboxId = `${id}-listbox`;
    const errorId = `${id}-error`;

    const [open, setOpen] = useState(false);

    // What the text box shows while the list is open; ignored when closed
    const [query, setQuery] = useState("");

    // Highlighted row, an index into the filtered matches
    const [activeIndex, setActiveIndex] = useState(-1);

    const listRef = useRef(null);

    const selected = options.find((option) => option.value === value) || null;

    const matches = useMemo(
        () => filterOptions(options, query, selected?.label),
        [options, query, selected?.label]
    );

    // Keep the highlight inside the viewport as it moves with the arrow keys
    useEffect(() => {

        if (!open || activeIndex < 0 || !listRef.current) {
            return;
        }

        const active = listRef.current.querySelector('[data-active="true"]');

        if (active) {
            active.scrollIntoView({ block: "nearest" });
        }

    }, [open, activeIndex]);

    /** Opens the list, seeded so editing feels like editing the current choice. */
    function openList() {

        if (disabled || open) {
            return;
        }

        const nextQuery = selected ? selected.label : "";
        const nextMatches = filterOptions(options, nextQuery, selected?.label);

        setQuery(nextQuery);
        setOpen(true);
        setActiveIndex(
            selected
                ? nextMatches.findIndex((option) => option.value === selected.value)
                : nextMatches.length
                    ? 0
                    : -1
        );

    }

    function commit(option) {

        onChange(option.value);
        setOpen(false);
        setActiveIndex(-1);

    }

    function handleKeyDown(event) {

        if (disabled) {
            return;
        }

        switch (event.key) {

            case "ArrowDown":
                // Opening on the first arrow is the combobox convention
                event.preventDefault();
                if (!open) {
                    openList();
                } else if (matches.length) {
                    setActiveIndex((index) => (index + 1) % matches.length);
                }
                break;

            case "ArrowUp":
                event.preventDefault();
                if (open && matches.length) {
                    setActiveIndex((index) =>
                        index <= 0 ? matches.length - 1 : index - 1
                    );
                }
                break;

            case "Enter":
                // Enter inside a <form> submits it, so while the list is open
                // the key belongs to the combobox first
                if (open) {
                    event.preventDefault();
                    if (activeIndex >= 0 && matches[activeIndex]) {
                        commit(matches[activeIndex]);
                    } else {
                        setOpen(false);
                    }
                }
                break;

            case "Escape":
                if (open) {
                    // Closing is the whole revert: the input renders the
                    // committed label whenever the list is closed
                    event.preventDefault();
                    setOpen(false);
                    setActiveIndex(-1);
                }
                break;

            case "Tab":
                // Let focus move; closing on blur does the revert
                setOpen(false);
                break;

            default:
                break;

        }

    }

    /*
      onMouseDown is suppressed on the interactive rows so pressing one never
      blurs the input - otherwise blur closes the list before the click lands.
    */
    function suppressBlur(event) {
        event.preventDefault();
    }

    const inputClasses = `
        w-full rounded-gov border bg-white px-3 py-2 pr-9 text-sm outline-none
        transition placeholder:text-ink-muted/60 focus:border-gov-blue
        disabled:cursor-not-allowed disabled:bg-paper disabled:text-ink-muted
        ${error ? "border-red-600" : "border-rule"}
    `;

    // The input renders the committed label when closed and the query when
    // open; empty means the overlay placeholder has its moment
    const displayText = open ? query : selected ? selected.label : "";

    return (

        <div className="space-y-1.5">

            {label && (
                <label
                    id={`${id}-label`}
                    htmlFor={id}
                    className="block text-sm font-semibold text-ink"
                >
                    {label}
                    {required && <span className="ml-0.5 text-red-700" aria-hidden="true">*</span>}
                </label>
            )}

            {hint && <p className="text-xs text-ink-muted">{hint}</p>}

            <div className="relative">

                <input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type="text"
                    role="combobox"
                    autoComplete="off"
                    aria-expanded={open}
                    aria-controls={open ? listboxId : undefined}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                    }
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={error ? errorId : undefined}
                    disabled={disabled}
                    placeholder={placeholder}
                    className={inputClasses}
                    value={displayText}
                    onFocus={openList}
                    onClick={openList}
                    onChange={(event) => {
                        const nextQuery = event.target.value;
                        const nextMatches = filterOptions(options, nextQuery, selected?.label);

                        setQuery(nextQuery);
                        setActiveIndex(nextMatches.length ? 0 : -1);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => {
                        setOpen(false);
                        setActiveIndex(-1);
                        onBlur?.();
                    }}
                />

                {displayText === "" && placeholderElement && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-muted/60"
                    >
                        {placeholderElement}
                    </div>
                )}

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                        <ChevronDown size={16} aria-hidden="true" />
                    )}
                </span>

                {open && (

                    <ul
                        ref={listRef}
                        id={listboxId}
                        role="listbox"
                        aria-labelledby={label ? `${id}-label` : undefined}
                        aria-label={!label && typeof placeholder === "string" ? placeholder : undefined}
                        className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-gov border border-rule bg-white py-1 shadow-lg"
                    >

                        {loading && (
                            <li
                                role="option"
                                aria-disabled="true"
                                aria-selected="false"
                                className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted"
                            >
                                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                                {loadingText}
                            </li>
                        )}

                        {!loading && matches.length === 0 && (
                            <li
                                role="option"
                                aria-disabled="true"
                                aria-selected="false"
                                className="px-3 py-2 text-sm text-ink-muted"
                            >
                                {noMatchesText}
                            </li>
                        )}

                        {!loading && matches.map((option, index) => {

                            const isActive = index === activeIndex;
                            const isSelected = option.value === value;

                            return (
                                <li
                                    key={option.value}
                                    id={`${listboxId}-option-${index}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    data-active={isActive || undefined}
                                    onMouseDown={suppressBlur}
                                    onClick={() => commit(option)}
                                    onMouseMove={() => setActiveIndex(index)}
                                    className={`cursor-pointer px-3 py-2 text-sm ${
                                        isActive
                                            ? "bg-gov-blue/10 text-ink"
                                            : "text-ink"
                                    }`}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && (
                                            <Check size={14} className="shrink-0 text-india-green" aria-hidden="true" />
                                        )}
                                    </span>
                                </li>
                            );

                        })}

                    </ul>

                )}

            </div>

            {error && (
                <p id={errorId} role="alert" className="text-xs font-medium text-red-700">
                    {error.message}
                </p>
            )}

        </div>

    );

}
