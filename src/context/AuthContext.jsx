import { createContext, useContext, useEffect, useState } from "react";
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
 * ============================================================================
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    // Logged-in user information
    const [user, setUser] = useState(null);

    // JWT Token
    const [token, setToken] = useState(null);

    // Loading while restoring session
    const [loading, setLoading] = useState(true);

    /**
     * Restore login after page refresh.
     */
    useEffect(() => {

        // Read token from browser storage
        const storedToken = localStorage.getItem("token");

        // Read user from browser storage
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {

            setToken(storedToken);

            setUser(JSON.parse(storedUser));
        }

        setLoading(false);

    }, []);

    /**
     * Login User
     */
    async function login(loginData) {

        // Call backend login API
        const response = await authService.login(loginData);

        // Save JWT token
        localStorage.setItem("token", response.token);

        // Save user information
        localStorage.setItem(
            "user",
            JSON.stringify({
                email: response.email,
                role: response.role,
            })
        );

        // Update React state
        setToken(response.token);

        setUser({
            email: response.email,
            role: response.role,
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
        setToken(null);

        setUser(null);
    }

    const value = {

        user,

        token,

        loading,

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

/**
 * Custom Hook
 */
export function useAuthContext() {

    return useContext(AuthContext);

}