import { Routes, Route } from "react-router-dom";

// Import application pages
import HomePage from "@/pages/public/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NotFoundPage from "@/pages/common/NotFoundPage";

/**
 * ============================================================================
 * Central Routing Configuration
 * ============================================================================
 *
 * All application routes are defined here.
 * Later we will add:
 * - Protected Routes
 * - Role Based Routes
 * - Nested Dashboard Routes
 * ============================================================================
 */
export default function AppRoutes() {
    return (   
        <Routes>

            {/* Public Home */}
            <Route path="/" element={<HomePage />} />

            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/register"
                element={<RegisterPage />}
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />

        </Routes>
    );
}