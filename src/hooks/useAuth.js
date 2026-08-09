import { useAuthContext } from "@/hooks/useAuthContext";


/**
 * ============================================================================
 * Custom Authentication Hook
 * ============================================================================
 *
 * Instead of importing AuthContext everywhere,
 * components will simply use:
 *
 * const auth = useAuth();
 * ============================================================================
 */

export default function useAuth() {
    return useAuthContext();
}