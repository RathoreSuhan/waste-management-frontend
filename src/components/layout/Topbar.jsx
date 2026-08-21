import useAuth from "@/hooks/useAuth";
import { getRoleLabel } from "@/constants/roleLabels"; // single source of truth for role wording

/**
 * Topbar
 * 
 * Displays page title, description, and user's current role badge.
 *
 * The badge text comes from the shared roleLabels map rather than a local
 * ternary, so a newly added role (for example the Municipal Officer, who is
 * a city-level civic authority and NOT a platform administrator) is named
 * correctly here without touching this file again.
 */

export default function Topbar({ title, subtitle }) {
    // Get user role from auth context
    const { user } = useAuth();

    return (
        <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            {/* Page title and subtitle */}
            <div>
                <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>

            {/* User role badge - resolved from the shared label map, with a
                safe fallback inside getRoleLabel for unknown role codes. */}
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                {getRoleLabel(user?.role)}
            </div>
        </header>
    );
}
