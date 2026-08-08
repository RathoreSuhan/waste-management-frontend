/**
 * ==========================================================
 * Reusable Alert Component
 * ==========================================================
 *
 * Used for:
 * ✓ Success messages
 * ✓ Error messages
 * ✓ Warning messages
 * ✓ Information messages
 *
 * This keeps UI consistent across the project.
 * ==========================================================
 */

export default function Alert({
    type = "error", // error | success | warning | info
    children,
}) {

    // Tailwind classes according to alert type
    const styles = {
        error:
            "bg-red-100 text-red-700 border border-red-300",

        success:
            "bg-green-100 text-green-700 border border-green-300",

        warning:
            "bg-yellow-100 text-yellow-700 border border-yellow-300",

        info:
            "bg-blue-100 text-blue-700 border border-blue-300",
    };

    return (
        <div
            className={`
                rounded-lg
                px-4
                py-3
                text-sm
                ${styles[type]}
            `}
        >
            {children}
        </div>
    );
}