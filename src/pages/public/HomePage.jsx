import { Link } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import { getDashboardPath } from "@/utils/roleRedirect";

/**
 * ============================================================================
 * Home Page
 * ============================================================================
 *
 * Public landing page - visible to everyone.
 *
 * The call to action changes depending on the session, so a logged-in user
 * is never stranded here without a way back into the app.
 * ============================================================================
 */

export default function HomePage() {

    // Session information
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">

            <div className="rounded-xl bg-white p-10 text-center shadow-lg">

                <h1 className="text-5xl font-bold text-blue-900">
                    Clean Bharat
                </h1>

                <p className="mt-4 text-gray-600">
                    Report garbage in your area and help keep your city clean.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">

                    {isAuthenticated ? (
                        // Logged in - straight to the matching dashboard
                        <Link
                            to={getDashboardPath(user?.role)}
                            className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-800"
                        >
                            Go to Dashboard
                        </Link>
                    ) : (
                        // Guest - offer login and registration
                        <>
                            <Link
                                to="/login"
                                className="rounded-lg bg-blue-700 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-800"
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="rounded-lg border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
