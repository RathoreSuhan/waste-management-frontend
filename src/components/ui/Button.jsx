/**
 * ==========================================================
 * Button
 * ----------------------------------------------------------
 * Institutional styling: near-square corners, solid fills,
 * no gradients or glow effects.
 *
 * Variants:
 *   primary   - main action (navy blue)
 *   secondary - outlined, for less prominent actions
 *   success   - confirmations (India green)
 *   danger    - destructive actions
 * ==========================================================
 */

// Each variant maps to a fixed set of Tailwind classes
const VARIANTS = {
    primary:
        "bg-gov-blue text-white border border-gov-blue hover:bg-gov-blue-dark",

    secondary:
        "bg-white text-gov-blue border border-gov-blue hover:bg-gov-blue/5",

    success:
        "bg-india-green text-white border border-india-green hover:bg-[#0f6f06]",

    danger:
        "bg-red-700 text-white border border-red-700 hover:bg-red-800",
};

export default function Button({
    children,
    loading = false,
    variant = "primary",
    // Buttons are full width by default, matching the original behaviour
    fullWidth = true,
    className = "",
    ...props
}) {

    return (
        <button
            {...props}
            disabled={loading || props.disabled}
            className={`
                inline-flex items-center justify-center gap-2
                rounded-gov
                px-5 py-2.5
                text-sm font-semibold
                transition
                disabled:cursor-not-allowed disabled:opacity-60
                ${fullWidth ? "w-full" : ""}
                ${VARIANTS[variant] || VARIANTS.primary}
                ${className}
            `}
        >
            {/* Busy state keeps the button width stable */}
            {loading ? "Please wait..." : children}
        </button>
    );
}
