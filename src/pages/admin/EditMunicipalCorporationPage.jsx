import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import MunicipalCorporationForm from "@/components/admin/MunicipalCorporationForm";
import {
    getMunicipalCorporation,
    updateMunicipalCorporation,
} from "@/services/municipalCorporationService";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Edit Municipal Corporation (Phase 5)
 * ============================================================================
 *
 * Loads an existing record, then submits the revised values to
 * PUT /api/municipal-corporations/{id}.
 *
 * The form is only mounted once the record has arrived, since
 * react-hook-form reads defaultValues on first render and would
 * otherwise hold empty fields.
 * ============================================================================
 */

export default function EditMunicipalCorporationPage() {

    const { id } = useParams();
    const navigate = useNavigate();

    // Existing record, null until loaded
    const [corporation, setCorporation] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load failure, e.g. the id does not exist
    const [loadError, setLoadError] = useState("");

    // Save failure, shown inside the form
    const [saveError, setSaveError] = useState("");

    /**
     * Load the record being edited.
     */
    useEffect(() => {

        let ignore = false;

        getMunicipalCorporation(id)
            .then((data) => {
                if (!ignore) {
                    setCorporation(data);
                }
            })
            .catch((err) => {
                if (!ignore) {
                    setLoadError(
                        getErrorMessage(err, "This record could not be loaded.")
                    );
                }
            })
            .finally(() => {
                if (!ignore) {
                    setLoading(false);
                }
            });

        return () => {
            ignore = true;
        };
    }, [id]);

    /**
     * Submits the revised values.
     */
    const handleSubmit = (values) => {

        setSaveError("");

        return updateMunicipalCorporation(id, values)
            .then(() => {
                navigate("/admin/municipal-corporations");
            })
            .catch((err) => {
                setSaveError(
                    getErrorMessage(err, "The changes could not be saved.")
                );
            });
    };

    return (
        <div>
            <PageHeading
                title="Edit Municipal Corporation"
                titleHi="नगर निगम संपादित करें"
                subtitle="Revise the contact details held for this city."
            />

            <div className="max-w-3xl">

                {loading && (
                    <div className="rounded-gov border border-rule bg-white p-8 text-center text-sm text-ink-muted">
                        Loading record…
                    </div>
                )}

                {/* Record missing or unreachable - the form is not offered */}
                {!loading && loadError && (
                    <Alert type="error" title="Record unavailable">
                        {loadError}{" "}
                        <Link
                            to="/admin/municipal-corporations"
                            className="font-semibold underline"
                        >
                            Return to the register
                        </Link>
                    </Alert>
                )}

                {/* Mounted only once values are available */}
                {!loading && corporation && (
                    <MunicipalCorporationForm
                        defaultValues={{
                            city: corporation.city || "",
                            organizationName: corporation.organizationName || "",
                            phone: corporation.phone || "",
                            email: corporation.email || "",
                        }}
                        onSubmit={handleSubmit}
                        submitLabel="Save Changes"
                        error={saveError}
                    />
                )}
            </div>
        </div>
    );
}
