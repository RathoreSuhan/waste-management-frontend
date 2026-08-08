import useAuth from "@/hooks/useAuth";

/**
 * Topbar
 * 
 * Displays page title, description, and user's current role badge.
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

            {/* User role badge */}
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                {user?.role === "ROLE_ADMIN"
                    ? "Administrator"
                    : user?.role === "ROLE_CLEANER"
                        ? "Cleaner"
                        : "Citizen"}
            </div>
        </header>
    );
}
