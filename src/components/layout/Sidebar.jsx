import { NavLink } from "react-router-dom";
import { LogOut, LifeBuoy, UserRound } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { getRoleLabel } from "@/constants/roleLabels";

/**
 * ============================================================================
 * Sidebar Navigation
 * ============================================================================
 *
 * Formal side navigation.
 *
 * Design notes:
 * - Navy panel with square corners, kept sober rather than app-like.
 * - The active item is marked with a saffron left border rather than a
 *   coloured pill, which reads as steadier on a dense panel.
 * - Icons are passed in as Lucide components, never emoji.
 * ============================================================================
 */

export default function Sidebar({ menuItems = [] }) {

    // Session details and the logout action
    const { user, logout } = useAuth();

    return (
        <aside className="flex w-72 shrink-0 flex-col bg-gov-navy text-white">

            {/* ---------------- Logged-in user panel ---------------- */}
            <div className="border-b border-white/15 px-5 py-4">

                <p className="text-[10px] font-semibold tracking-[0.2em] text-white/60 uppercase">
                    Logged in as
                </p>

                <div className="mt-2 flex items-start gap-2.5">

                    {/* Avatar placeholder - initial letter of the email */}
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-white/25 bg-white/10">
                        <UserRound size={16} aria-hidden="true" />
                    </span>

                    <div className="min-w-0">
                        {/* Email can be long, so it truncates rather than wrapping */}
                        <p className="truncate text-sm font-semibold" title={user?.email}>
                            {user?.email}
                        </p>

                        {/* Role is shown as a formal designation */}
                        <p className="mt-0.5 text-xs text-saffron">
                            {getRoleLabel(user?.role)}
                        </p>
                    </div>
                </div>
            </div>

            {/* ---------------- Navigation ---------------- */}
            <nav className="flex-1 py-4" aria-label="Site sections">

                <p className="px-5 pb-2 text-[10px] font-semibold tracking-[0.2em] text-white/50 uppercase">
                    Services
                </p>

                <ul>
                    {menuItems.map((item) => {

                        // Icon arrives as a component reference, rendered below
                        const Icon = item.icon;

                        return (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    // Exact matching stops the parent route staying highlighted
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm transition ${isActive
                                            ? "border-saffron bg-white/12 font-semibold text-white"
                                            : "border-transparent text-white/75 hover:border-white/30 hover:bg-white/5 hover:text-white"
                                        }`
                                    }
                                >
                                    {Icon && <Icon size={16} aria-hidden="true" />}

                                    <span>{item.label}</span>

                                    {/* Optional Hindi gloss, kept small and secondary */}
                                    {item.labelHi && (
                                        <span className="ml-auto text-[11px] text-white/45">
                                            {item.labelHi}
                                        </span>
                                    )}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* ---------------- Helpline ---------------- */}
            <div className="border-t border-white/15 px-5 py-4">

                {/* Email support, since a community project has no call centre */}
                <p className="flex items-center gap-2 text-[11px] text-white/60">
                    <LifeBuoy size={12} aria-hidden="true" />
                    Community Helpdesk
                </p>

                <p className="mt-1 text-sm font-semibold tracking-wide">
                    support@cleanbharat.org
                </p>

                <p className="mt-0.5 text-[11px] text-white/50">
                    Replies usually within two working days
                </p>
            </div>

            {/* ---------------- Sign out ---------------- */}
            <div className="border-t border-white/15 p-4">
                <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-2 border border-white/30 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10"
                >
                    <LogOut size={15} aria-hidden="true" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
