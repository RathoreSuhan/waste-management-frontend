import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

/**
 * ============================================================================
 * Breadcrumbs
 * ============================================================================
 *
 * Every interior page of a government portal carries a breadcrumb trail,
 * so users always know where they are in the hierarchy.
 *
 * Replaces the old Topbar, which duplicated the page heading that each
 * page already renders itself.
 *
 * Expected shape:
 *   [{ label: "Citizen Dashboard", to: "/citizen/dashboard" }, { label: "..." }]
 *
 * The final entry is the current page and is not linked.
 * ============================================================================
 */

export default function Breadcrumbs({ trail = [] }) {

    return (
        <nav
            aria-label="Breadcrumb"
            className="border-b border-rule bg-white px-4 py-2 lg:px-6"
        >
            <ol className="mx-auto flex max-w-7xl flex-wrap items-center gap-1 text-xs">

                {/* Trail always begins at the portal home */}
                <li className="flex items-center gap-1">
                    <Link
                        to="/"
                        className="flex items-center gap-1 text-gov-blue hover:underline"
                    >
                        <Home size={12} aria-hidden="true" />
                        Home
                    </Link>
                </li>

                {trail.map((crumb, index) => {

                    // The last crumb represents the page currently open
                    const isLast = index === trail.length - 1;

                    return (
                        <li key={crumb.label} className="flex items-center gap-1">

                            <ChevronRight
                                size={12}
                                className="text-ink-muted"
                                aria-hidden="true"
                            />

                            {isLast || !crumb.to ? (
                                // Current page - plain text, flagged for screen readers
                                <span
                                    aria-current="page"
                                    className="font-semibold text-ink"
                                >
                                    {crumb.label}
                                </span>
                            ) : (
                                <Link
                                    to={crumb.to}
                                    className="text-gov-blue hover:underline"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
