import { Outlet } from "react-router-dom";

/**
 * ============================================================================
 * Main Layout
 * ============================================================================
 *
 * This layout will later contain:
 *
 * Navbar
 * Sidebar
 * Footer
 *
 * Outlet renders the active page.
 * ============================================================================
 */

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-slate-100">

            {/* Future Navbar */}

            {/* Active Page */}
            <Outlet />

            {/* Future Footer */}

        </div>
    );
}