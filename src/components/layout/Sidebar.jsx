import { NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

/**
 * Sidebar Navigation
 * 
 * Shows role-based menu items and logout button.
 * Uses NavLink to highlight the active page.
 */

export default function Sidebar({ menuItems = [] }) {
    // Get user info and logout function from auth context
    const { user, logout } = useAuth();

    return (
        <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
            {/* Header section - brand name and user email */}
            <div className="border-b border-slate-800 p-6">
                {/* Platform name */}
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">
                    Clean Bharat
                </p>
                {/* Page title based on role */}
                <h2 className="mt-2 text-xl font-semibold">
                    {user?.role === "ROLE_ADMIN"
                        ? "Admin Portal"
                        : user?.role === "ROLE_CLEANER"
                            ? "Cleaner Hub"
                            : "Citizen Dashboard"}
                </h2>
                {/* User email */}
                <p className="mt-2 text-sm text-slate-400">{user?.email}</p>
            </div>

            {/* Navigation menu items */}
            <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        // Highlight current page in green
                        className={({ isActive }) =>
                            `flex items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
                                isActive
                                    ? "bg-emerald-500 text-white shadow"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`
                        }
                    >
                        {/* Menu icon */}
                        <span className="mr-3 text-base">{item.icon}</span>
                        {/* Menu label */}
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Logout button at bottom */}
            <div className="border-t border-slate-800 p-4">
                <button
                    onClick={logout}
                    className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}
