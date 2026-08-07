/**
 * ==========================================================
 * Reusable Input Component
 * ----------------------------------------------------------
 * Used throughout the project.
 *
 * Features:
 * ✓ Label
 * ✓ Error message
 * ✓ React Hook Form support
 * ✓ Tailwind styling
 * ==========================================================
 */

export default function Input({
    label,
    error,
    className = "",
    ...props
}) {
    return (
        <div className="space-y-1">

            {/* Input Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}

            {/* Input Field */}
            <input
                {...props}
                className={`
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2
                    outline-none
                    transition
                    focus:border-blue-600
                    focus:ring-2
                    focus:ring-blue-200
                    ${className}
                `}
            />

            {/* Validation Error */}
            {error && (
                <p className="text-sm text-red-500">
                    {error.message}
                </p>
            )}

        </div>
    );
}