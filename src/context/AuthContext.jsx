import { useState } from "react";

import AuthContext from "@/context/authContextInstance";
import * as authService from "@/services/authService";
import { clearSessionExpiryNotice } from "@/api/sessionExpiry";
import { clearAllProposalDrafts } from "@/utils/proposalDraft";

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
 * registerWithEmail()
 * loginWithGoogle()
 * registerWithGoogle()
 * logout()
 * isAuthenticated
 *
 * The session is restored from localStorage while state is first created,
 * not afterwards in an effect. Reading storage is synchronous, so there is
 * nothing to wait for - and restoring it in an effect meant the very first
 * render always claimed the visitor was signed out, which flashed the login
 * page at people who were already signed in.
 *
 * Signing in or out also wipes any unsubmitted cleanup proposal draft. Those
 * drafts are unsent work belonging to one person, so they must never be waiting
 * for whoever signs in next on the same device.
 *
 * All three ways in end at the same place. Google sign-in is not a second
 * session mechanism: the backend answers it with the same Clean Bharat JWT that
 * password sign-in returns, so it is stored the same way and the rest of the
 * application cannot tell the difference - which is exactly the point.
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
     * Put a freshly issued session into storage and into React state.
     *
     * Shared by every way in, so there is one definition of what being signed
     * in means. Google sign-in writing its own copy of this is how the two
     * would drift - a draft left behind here, a key named differently there.
     *
     * @param {Object} response - backend reply carrying { token, email, role }
     */
    function establishSession(response) {

        // Safety net for sessions that ended without logout, e.g. an expired token
        clearAllProposalDrafts();

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
     * Login User
     *
     * Email and password. Kept for municipal bodies and for accounts created
     * before Google sign-in existed.
     */
    async function login(loginData) {

        // Call backend login API
        const response = await authService.login(loginData);

        return establishSession(response);
    }

    /**
     * Sign up with an address and a password.
     *
     * Two calls end up here. The first has no verification code, so the backend
     * emails one and answers without a token - no session is started, because no
     * account exists yet. The second carries the code, and that answer does
     * establish the session.
     *
     * The raw answer is returned either way so the caller can tell the two
     * apart and show the code step.
     *
     * @param {Object} registrationData - the form, plus verificationCode on the
     *        second call
     */
    async function registerWithEmail(registrationData) {

        const response = await authService.register(registrationData);

        // No token means the code is still outstanding
        if (response.verificationRequired) {
            return response;
        }

        return establishSession(response);
    }

    /**
     * Sign in with a Google credential.
     *
     * Returns the backend's answer either way, because there are two of them.
     * A Google account with no Clean Bharat account behind it is answered with
     * registrationRequired and NO token, so no session is started here - the
     * caller sends the visitor on to finish registering. Starting a session at
     * that point would mean an account that does not exist appearing signed in.
     *
     * @param {string} credential - Google ID token
     */
    async function loginWithGoogle(credential) {

        const response = await authService.googleSignIn(credential);

        if (response.registrationRequired) {
            return response;
        }

        return establishSession(response);
    }

    /**
     * Finish a first-time Google sign-up and sign the new account in.
     *
     * @param {Object} registrationData - credential plus the Clean Bharat
     *        profile Google cannot supply (role, state, city, cleaner details)
     */
    async function registerWithGoogle(registrationData) {

        const response = await authService.googleRegister(registrationData);

        return establishSession(response);
    }

    /**
     * Logout User
     */
    function logout() {

        // Remove stored information
        localStorage.removeItem("token");

        localStorage.removeItem("user");

        // Half-written proposals were never sent, so they leave with the session
        clearAllProposalDrafts();

        /*
          Any earlier "your session has ended" note goes too, so signing out on
          purpose is not explained as an expiry on the way to the login form.

          SessionExpiryWatcher records its note after calling this, for that
          reason - the order matters.
        */
        clearSessionExpiryNotice();

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

        registerWithEmail,

        loginWithGoogle,

        registerWithGoogle,

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
