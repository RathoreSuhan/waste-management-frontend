/**
 * ==========================================================
 * Input
 * ----------------------------------------------------------
 * Form field styled for a government portal:
 * square corners, thin rules, an explicit required marker
 * and accessible error messaging.
 * ==========================================================
 */

export default function Input({
    label,
    error,
    // Government forms always mark mandatory fields with a red asterisk
    required = false,
    hint,
    className = "",
    ...props
}) {

    return (
        <div className="space-y-1.5">

            {label && (
                <label className="block text-sm font-semibold text-ink">
                    {label}

                    {/* Asterisk is decorative; the input carries the real required flag */}
                    {required && (
                        <span className="ml-0.5 text-red-700" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}

            {/* Optional helper text shown above the field */}
            {hint && <p className="text-xs text-ink-muted">{hint}</p>}

            <input
                {...props}
                // Tells screen readers the field is invalid
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

            {/* Validation message, announced politely when it appears */}
            {error && (
                <p role="alert" className="text-xs font-medium text-red-700">
                    {error.message}
                </p>
            )}
        </div>
    );
}
