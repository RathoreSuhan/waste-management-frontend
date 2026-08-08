import React from "react";
import ReactDOM from "react-dom/client";

// React Router - enables navigation between pages
import { BrowserRouter } from "react-router-dom";

// Auth Context - makes user login state available to all components
import { AuthProvider } from "@/context/AuthContext";

// All route definitions (login, dashboards, protected pages)
import AppRoutes from "@/routes/AppRoutes";

// Global Tailwind CSS styles
import "@/index.css";

/**
 * App Entry Point
 * 
 * Provider Hierarchy:
 * 1. React.StrictMode - catches potential bugs during development
 * 2. AuthProvider - provides authentication state (user, token, login/logout)
 * 3. BrowserRouter - enables page navigation
 * 4. AppRoutes - defines all routes (public, protected, role-based)
 */
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {/* Wrap app with auth context so all components can access user info */}
        <AuthProvider>
            {/* Enable React Router for page navigation */}
            <BrowserRouter>
                {/* Define all routes here */}
                <AppRoutes />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>
);