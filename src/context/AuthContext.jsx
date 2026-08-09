import { useState } from "react";

import AuthContext from "@/context/authContextInstance";
import * as authService from "@/services/authService";

/**
 * ============================================================================
 * Authentication Context
 * ============================================================================
 *
 * Stores authentication information globally.
 *
 * Any component can access:
 *
 * user
 * token
 * login()
 * logout()
 * isAuthenticated
 *
 * The session is restored from localStorage while state is first created,
 * not afterwards in an effect. Reading storage is synchronous, so there is
 * nothing to wait for - and restoring it in an effect meant the very first
 * render always claimed the visitor was signed out, which flashed the login
 * page at people who were already signed in.
 * ============================================================================
 */

/**
 * Read the saved session, if there is one.
 *
 * Anything unreadable is treated as no session at all: a half-written or
 * hand-edited entry should send someone to the login page, not break the
 * application on startup.
 */
function readStoredSession() {
    try {
        const storedToken = localStorage.getItem("token");

        const storedUser = localStorage.getItem("user");

        if (!storedToken || !storedUser) {
            return { token: null, user: null };
        }

        return {
            token: storedToken,
            user: JSON.parse(storedUser),
        };
    } catch {
        // Corrupt JSON, or storage blocked entirely (private browsing)
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }) {

    /*
      Read storage once, on the first render only. Passing a function to
      useState means it is not repeated on every later render.
    */
    const [session, setSession] = useState(readStoredSession);

    const { user, token } = session;

    /**
     * Login User
     */
    async function login(loginData) {

        // Call backend login API
        const response = await authService.login(loginData);

        const nextUser = {
            email: response.email,
            role: response.role,
        };

        // Save JWT token
        localStorage.setItem("token", response.token);

        // Save user information
        localStorage.setItem("user", JSON.stringify(nextUser));

        // Update React state - one write, so the two can never disagree
        setSession({
            token: response.token,
            user: nextUser,
        });

        return response;
    }

    /**
     * Logout User
     */
    function logout() {

        // Remove stored information
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        // Clear React state
        setSession({ token: null, user: null });
    }

    const value = {

        user,

        token,

        /*
          Kept for consumers that wait on it, such as ProtectedRoute.
          Restoring the session no longer happens after the first render,
          so there is never a moment where the answer is unknown.
        */
        loading: false,

        login,

        logout,

        // true if user exists
        isAuthenticated: !!token,
    };

    return (

        <AuthContext.Provider value={value}>

            {children}

        </AuthContext.Provider>

    );
}
