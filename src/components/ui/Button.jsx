/**
 * ==========================================================
 * Reusable Button Component
 * ==========================================================
 */

export default function Button({

    children,

    loading = false,

    className = "",

    ...props

}) {

    return (

        <button
            {...props}
            disabled={loading || props.disabled}
            className={`
                w-full
                rounded-lg
                bg-blue-700
                px-4
                py-2
                text-white
                font-semibold
                transition
                hover:bg-blue-800
                disabled:cursor-not-allowed
                disabled:opacity-60
                ${className}
            `}
        >

            {loading ? "Please wait..." : children}

        </button>

    );

}