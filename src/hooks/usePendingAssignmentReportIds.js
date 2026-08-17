import { useEffect, useState } from "react";

import useAuth from "@/hooks/useAuth";
import { getPendingAssignments } from "@/services/cleanupService";

/**
 * Load the report IDs whose cleanup assignments are still pending.
 *
 * This is optional presentation enrichment. Null means no reliable snapshot is
 * available, while an empty Set means the protected request succeeded and no
 * assignments remain pending.
 *
 * Signed-out visitors never call the protected endpoint. Request failures also
 * stay silent so report pages continue rendering with backend report statuses.
 *
 * @returns {Set<string>|null}
 */
export default function usePendingAssignmentReportIds() {
    const { isAuthenticated, token } = useAuth();

    const [snapshot, setSnapshot] = useState({
        token: null,
        reportIds: null,
    });

    const sessionToken = isAuthenticated ? token : null;

    useEffect(() => {
        let active = true;

        if (!sessionToken) {
            return () => {
                active = false;
            };
        }

        getPendingAssignments()
            .then((assignments) => {
                if (!active) {
                    return;
                }

                const list = Array.isArray(assignments) ? assignments : [];

                setSnapshot({
                    token: sessionToken,
                    reportIds: new Set(
                        list
                            .filter((assignment) => assignment.reportId != null)
                            .map((assignment) => String(assignment.reportId))
                    ),
                });
            })
            .catch(() => {
                if (active) {
                    setSnapshot({
                        token: sessionToken,
                        reportIds: null,
                    });
                }
            });

        return () => {
            active = false;
        };
    }, [sessionToken]);

    // A snapshot from another auth session is never reliable for this render.
    return snapshot.token === sessionToken ? snapshot.reportIds : null;
}
