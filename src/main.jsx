import React from "react";
import ReactDOM from "react-dom/client";

// React Router - enables navigation between pages
import { BrowserRouter } from "react-router-dom";

// Auth Context - makes user login state available to all components
import { AuthProvider } from "@/context/AuthContext";

// Language Context - decides which of the two languages reads as primary
import { LanguageProvider } from "@/context/LanguageContext";

// All route definitions (login, dashboards, protected pages)
import AppRoutes from "@/routes/AppRoutes";

// Global Tailwind CSS styles
import "@/index.css";

/**
 * App Entry Point
 * 
 * Provider Hierarchy:
 * 1. React.StrictMode - catches potential bugs during development
 * 2. LanguageProvider - decides which language reads as the primary text
 * 3. AuthProvider - provides authentication state (user, token, login/logout)
 * 4. BrowserRouter - enables page navigation
 * 5. AppRoutes - defines all routes (public, protected, role-based)
 *
 * Language sits outside auth on purpose: the choice belongs to whoever is
 * reading the screen, signed in or not, and must survive logging out.
 */
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {/* Interface language, read by every bilingual label */}
        <LanguageProvider>
            {/* Wrap app with auth context so all components can access user info */}
            <AuthProvider>
                {/* Enable React Router for page navigation */}
                <BrowserRouter>
                    {/* Define all routes here */}
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </LanguageProvider>
    </React.StrictMode>
);
