/**
 * ==========================================================
 * Reusable Select Component
 * ==========================================================
 */

export default function Select({

    label,

    options = [],

    error,

    className = "",

    ...props

}) {

    return (

        <div className="space-y-1">

            {label && (

                <label className="block text-sm font-medium text-gray-700">

                    {label}

                </label>

            )}

            <select
                {...props}
                className={`
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    px-4
                    py-2
                    outline-none
                    focus:border-blue-600
                    focus:ring-2
                    focus:ring-blue-200
                    ${className}
                `}
            >

                {options.map(option => (

                    <option

                        key={option.value}

                        value={option.value}

                    >

                        {option.label}

                    </option>

                ))}

            </select>

            {error && (

                <p className="text-sm text-red-500">

                    {error.message}

                </p>

            )}

        </div>

    );

}