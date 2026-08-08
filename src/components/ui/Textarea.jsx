/**
 * ==========================================================
 * Textarea
 * ----------------------------------------------------------
 * Multi-line field matching the Input styling so forms stay
 * visually consistent.
 * ==========================================================
 */

export default function Textarea({
    label,
    error,
    required = false,
    hint,
    rows = 5,
    className = "",
    ...props
}) {

    return (
        <div className="space-y-1.5">

            {label && (
                <label className="block text-sm font-semibold text-ink">
                    {label}

                    {/* Mandatory field marker */}
                    {required && (
                        <span className="ml-0.5 text-red-700" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}

            {hint && <p className="text-xs text-ink-muted">{hint}</p>}

            <textarea
                {...props}
                rows={rows}
                aria-invalid={error ? "true" : undefined}
                className={`
                    w-full
                    rounded-gov
                    border
                    bg-white
                    px-3 py-2
                    text-sm
                    outline-none
                    transition
                    placeholder:text-ink-muted/60
                    focus:border-gov-blue
                    ${error ? "border-red-600" : "border-rule"}
                    ${className}
                `}
            />

            {error && (
                <p role="alert" className="text-xs font-medium text-red-700">
                    {error.message}
                </p>
            )}
        </div>
    );
}
