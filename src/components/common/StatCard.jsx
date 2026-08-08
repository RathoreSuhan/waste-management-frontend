/**
 * StatCard
 * 
 * Reusable dashboard statistic card with title, value, and description.
 * Used in dashboards to display key metrics and summary data.
 */

export default function StatCard({ title, value, description, accent = "blue" }) {
    // Color gradient styles for different accent types
    const accentStyles = {
        blue: "from-blue-500 to-cyan-500",
        emerald: "from-emerald-500 to-green-500",
        violet: "from-violet-500 to-fuchsia-500",
        amber: "from-amber-500 to-orange-500",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* Colored accent bar at top */}
            <div className={`mb-4 h-2 w-20 rounded-full bg-gradient-to-r ${accentStyles[accent]}`} />
            
            {/* Metric label */}
            <p className="text-sm font-medium text-slate-500">{title}</p>
            
            {/* Large number value */}
            <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
            
            {/* Description text */}
            <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
    );
}
