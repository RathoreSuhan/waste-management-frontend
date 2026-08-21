import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ============================================================================
 * useCleanupDisclaimer (Phase 15)
 * ============================================================================
 *
 * Puts the presence notice in front of a cleanup action.
 *
 * Proposing for a site and starting awarded work both commit the cleaner to
 * being physically at the reported site when they record evidence, so both are
 * held behind CleanupDisclaimerDialog. This hook stores the assignment that is
 * waiting on acknowledgement and runs the real action only once the cleaner
 * accepts, which keeps the two cleaner pages free of duplicate dialog state.
 *
 * The notice is issued on *every* proposal and *every* start - it is an
 * undertaking about the current task, not a one-time tutorial, so nothing is
 * remembered between actions.
 *
 * Usage:
 *   const disclaimer = useCleanupDisclaimer(handlePropose);
 *   <TaskCard onPropose={disclaimer.requestAcknowledgement} … />
 *   <CleanupDisclaimerDialog
 *       open={Boolean(disclaimer.pendingAssignment)}
 *       onAccept={disclaimer.accept}
 *       onCancel={disclaimer.cancel}
 *   />
 * ============================================================================
 */

export default function useCleanupDisclaimer(onAcknowledged) {

    // Assignment the cleaner has chosen but not yet acknowledged
    const [pendingAssignment, setPendingAssignment] = useState(null);

    /*
      The action is read through a ref rather than captured in a dependency
      list: page handlers are re-created on every render, and depending on
      them would rebuild `accept` each time and hand the dialog a new
      callback on every keystroke elsewhere on the page.
    */
    const actionRef = useRef(onAcknowledged);

    useEffect(() => {
        actionRef.current = onAcknowledged;
    }, [onAcknowledged]);

    /**
     * Show the notice for an assignment. Nothing is sent to the backend yet.
     */
    const requestAcknowledgement = useCallback((assignment) => {
        setPendingAssignment(assignment);
    }, []);

    /**
     * Acknowledged - run the real action, then close the notice.
     */
    const accept = useCallback(async () => {

        if (!pendingAssignment) {
            return;
        }

        try {
            await actionRef.current?.(pendingAssignment);
        } finally {
            // Closed in `finally` so a refused action cannot leave the notice stuck open
            setPendingAssignment(null);
        }
    }, [pendingAssignment]);

    /**
     * Declined or dismissed - the assignment is left untouched.
     */
    const cancel = useCallback(() => {
        setPendingAssignment(null);
    }, []);

    return { pendingAssignment, requestAcknowledgement, accept, cancel };
}