/**
 * ==========================================================
 * Stat Card
 * ----------------------------------------------------------
 * Single figure in a statistics row.
 *
 * Styled as an official data tile: a solid accent rule on the
 * left, square corners, and no gradients. Accent colours are
 * drawn from the tricolour palette only.
 * ==========================================================
 */

// Accent maps to a left border colour and a matching figure colour
const ACCENTS = {
    navy: {
        border: "border-l-gov-navy",
        value: "text-gov-navy",
    },
    blue: {
        border: "border-l-gov-blue",
        value: "text-gov-blue",
    },
    saffron: {
        border: "border-l-saffron",
        value: "text-orange-700",
    },
    green: {
        border: "border-l-india-green",
        value: "text-india-green",
    },
};

export default function StatCard({
    title,
    value,
    description,
    accent = "navy",
    // Optional Lucide icon component
    icon: Icon,
}) {

    const tone = ACCENTS[accent] || ACCENTS.navy;

    return (
        <div
            className={`rounded-gov border border-rule border-l-4 bg-white p-4 ${tone.border}`}
        >
            {/* Label sits above the figure, as on official dashboards */}
            <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-semibold tracking-[0.1em] text-ink-muted uppercase">
                    {title}
                </p>

                {Icon && (
                    <Icon size={16} className="text-ink-muted" aria-hidden="true" />
                )}
            </div>

            {/* The figure itself */}
            <p className={`mt-2 font-serif text-3xl font-bold ${tone.value}`}>
                {value}
            </p>

            {description && (
                <p className="mt-1.5 border-t border-rule pt-1.5 text-xs text-ink-muted">
                    {description}
                </p>
            )}
        </div>
    );
}
