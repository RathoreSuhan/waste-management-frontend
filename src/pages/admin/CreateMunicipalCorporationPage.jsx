import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeading from "@/components/common/PageHeading";
import MunicipalCorporationForm from "@/components/admin/MunicipalCorporationForm";
import { createMunicipalCorporation } from "@/services/municipalCorporationService";
import { getErrorMessage } from "@/utils/errorMessage";

/**
 * ============================================================================
 * Create Municipal Corporation (Phase 5)
 * ============================================================================
 *
 * Registers a new municipal corporation record.
 * Posts to POST /api/municipal-corporations.
 * ============================================================================
 */

export default function CreateMunicipalCorporationPage() {

    const navigate = useNavigate();

    // Failure message passed down to the form
    const [error, setError] = useState("");

    /**
     * Submits the new record.
     *
     * The promise is returned so react-hook-form keeps isSubmitting
     * raised until the request settles - without it the button would
     * re-enable immediately and invite a duplicate entry.
     */
    const handleSubmit = (values) => {

        setError("");

        return createMunicipalCorporation(values)
            .then(() => {
                // Straight back to the register, where the new row appears
                navigate("/admin/municipal-corporations");
            })
            .catch((err) => {
                setError(
                    getErrorMessage(err, "The record could not be saved.")
                );
            });
    };

    return (
        <div>
            <PageHeading
                title="Add Municipal Corporation"
                titleHi="नगर निगम जोड़ें"
                subtitle="Register a municipal corporation and its contact details for a city."
            />

            <div className="max-w-3xl">
                <MunicipalCorporationForm
                    onSubmit={handleSubmit}
                    submitLabel="Save Record"
                    error={error}
                />
            </div>
        </div>
    );
}
