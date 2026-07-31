import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

// Layout
import MainLayout from "@/layouts/MainLayout";

// Route Guards
import PublicRoute from "@/routes/PublicRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RoleRoute from "@/routes/RoleRoute";

// Public Pages
import HomePage from "@/pages/public/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NotFoundPage from "@/pages/common/NotFoundPage";

// Dashboards
import CitizenDashboard from "@/pages/citizen/CitizenDashboard";
import CleanerDashboard from "@/pages/cleaner/CleanerDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";

export default function AppRoutes() {

    return (

        <BrowserRouter>

            <Routes>

                {/* =======================================================
                        PUBLIC ROUTES
                ======================================================== */}

                <Route element={<PublicRoute />}>

                    <Route path="/" element={<HomePage />} />

                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />

                    <Route
                        path="/register"
                        element={<RegisterPage />}
                    />

                </Route>

                {/* =======================================================
                        PROTECTED ROUTES
                ======================================================== */}

                <Route element={<ProtectedRoute />}>

                    <Route element={<MainLayout />}>

                        {/* Citizen */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRole="ROLE_CITIZEN"
                                />
                            }
                        >

                            <Route
                                path="/citizen/dashboard"
                                element={<CitizenDashboard />}
                            />

                        </Route>

                        {/* Cleaner */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRole="ROLE_CLEANER"
                                />
                            }
                        >

                            <Route
                                path="/cleaner/dashboard"
                                element={<CleanerDashboard />}
                            />

                        </Route>

                        {/* Admin */}

                        <Route
                            element={
                                <RoleRoute
                                    allowedRole="ROLE_ADMIN"
                                />
                            }
                        >

                            <Route
                                path="/admin/dashboard"
                                element={<AdminDashboard />}
                            />

                        </Route>

                    </Route>

                </Route>

                {/* 404 */}

                <Route
                    path="*"
                    element={<NotFoundPage />}
                />

            </Routes>

        </BrowserRouter>

    );

}