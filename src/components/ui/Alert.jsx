import {
    AlertTriangle,
    CheckCircle2,
    Info,
    XCircle,
} from "lucide-react";

/**
 * ==========================================================
 * Alert
 * ----------------------------------------------------------
 * Notice block used for errors, confirmations and guidance.
 *
 * Styled as an official notice: a coloured left rule, a pale
 * tint and a matching icon, rather than a rounded toast.
 * ==========================================================
 */

// Colours and icon per notice type
const VARIANTS = {
    error: {
        wrapper: "border-l-4 border-l-red-700 bg-red-50 text-red-900",
        icon: XCircle,
        iconClass: "text-red-700",
        title: "Error",
    },
    success: {
        wrapper: "border-l-4 border-l-india-green bg-green-50 text-green-900",
        icon: CheckCircle2,
        iconClass: "text-india-green",
        title: "Success",
    },
    warning: {
        wrapper: "border-l-4 border-l-saffron bg-orange-50 text-orange-900",
        icon: AlertTriangle,
        iconClass: "text-orange-600",
        title: "Please Note",
    },
    info: {
        wrapper: "border-l-4 border-l-gov-blue bg-blue-50 text-gov-navy",
        icon: Info,
        iconClass: "text-gov-blue",
        title: "Information",
    },
};

export default function Alert({
    type = "error",
    // Heading can be overridden, otherwise the variant default is used
    title,
    children,
}) {

    const variant = VARIANTS[type] || VARIANTS.error;

    const Icon = variant.icon;

    return (
        <div
            // Errors interrupt; the rest are announced without stealing focus
            role={type === "error" ? "alert" : "status"}
            className={`flex gap-3 rounded-gov border border-rule px-4 py-3 ${variant.wrapper}`}
        >
            <Icon
                size={18}
                className={`mt-0.5 shrink-0 ${variant.iconClass}`}
                aria-hidden="true"
            />

            <div className="text-sm">
                {/* Formal notices always carry a heading */}
                <p className="font-semibold">
                    {title || variant.title}
                </p>

                <div className="mt-0.5 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}
