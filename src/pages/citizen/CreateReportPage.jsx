import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploadField from "@/components/reports/ImageUploadField";

import useGeoLocation from "@/hooks/useGeoLocation";

import { createReportSchema } from "@/schemas/reportSchema";
import { createReport } from "@/services/reportService";
import {
    getErrorMessage,
    getDuplicateReportDetails,
} from "@/utils/errorMessage";
import {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    MAX_IMAGE_SIZE_LABEL,
} from "@/constants/reportConstants";

/**
 * ============================================================================
 * Create Garbage Report Page
 * ============================================================================
 *
 * Citizens report garbage from here.
 *
 * Calls POST /api/reports as multipart/form-data.
 * The logged-in user is resolved by the backend from the JWT token,
 * so the frontend only sends the report details and the photo.
 * ============================================================================
 */

export default function CreateReportPage() {

    // Used to redirect to the created report
    const navigate = useNavigate();

    // Browser GPS helper
    const { detecting, locationError, detectLocation } = useGeoLocation();

    // Selected garbage photo
    const [imageFile, setImageFile] = useState(null);

    // Validation message for the photo field
    const [imageError, setImageError] = useState("");

    // Error returned by the backend
    const [serverError, setServerError] = useState("");

    // Duplicate report details returned with HTTP 409
    const [duplicateInfo, setDuplicateInfo] = useState(null);

    /**
     * React Hook Form
     */
    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createReportSchema),

        defaultValues: {
            title: "",
            description: "",
            latitude: "",
            longitude: "",
            address: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
        },
    });

    /**
     * Validate the selected photo against the backend rules.
     */
    function handleFileChange(file) {

        // Clear the old validation message
        setImageError("");

        setImageFile(file);

        // Nothing selected (user removed the photo)
        if (!file) {
            return;
        }

        // Only formats supported by the backend AI pipeline
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setImageError("Only JPG, PNG or WEBP images are allowed.");
            return;
        }

        // Backend rejects anything above the multipart limit
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
            setImageError(`Image must be smaller than ${MAX_IMAGE_SIZE_LABEL}.`);
        }
    }

    /**
     * Fill the coordinate fields using the device GPS.
     */
    async function handleDetectLocation() {

        const coords = await detectLocation();

        // User denied permission or detection failed
        if (!coords) {
            return;
        }

        // Values are stored as strings because the schema validates strings
        setValue("latitude", String(coords.latitude), { shouldValidate: true });
        setValue("longitude", String(coords.longitude), { shouldValidate: true });
    }

    /**
     * Submit the report to the backend.
     */
    async function onSubmit(data) {

        // Reset previous API messages
        setServerError("");
        setDuplicateInfo(null);

        // Photo is mandatory for the backend AI validation
        if (!imageFile) {
            setImageError("Please upload a photo of the garbage.");
            return;
        }

        // Stop if the photo failed the format/size checks
        if (imageError) {
            return;
        }

        try {
            // Convert coordinate strings into numbers before sending
            const response = await createReport(
                {
                    ...data,
                    latitude: Number(data.latitude),
                    longitude: Number(data.longitude),
                },
                imageFile
            );

            // Open the newly created report
            navigate(`/reports/${response.id}`, {
                state: { created: true },
            });

        } catch (error) {

            // Backend detected a nearby duplicate report (HTTP 409)
            const duplicate = getDuplicateReportDetails(error);

            if (duplicate) {
                setDuplicateInfo(duplicate);
                return;
            }

            // Any other validation / AI / server error
            setServerError(getErrorMessage(error, "Unable to submit the report."));
        }
    }

    return (
        <div className="mx-auto max-w-3xl">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">

                {/* Page heading */}
                <h1 className="text-2xl font-semibold text-slate-900">
                    Report Garbage
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Add a photo and location so cleaners can find and clear the waste quickly.
                </p>

                {/* Duplicate report warning with a link to the existing report */}
                {duplicateInfo && (
                    <div className="mt-6">
                        <Alert type="warning">
                            <p>{duplicateInfo.message}</p>

                            {duplicateInfo.existingReportId && (
                                <Link
                                    to={`/reports/${duplicateInfo.existingReportId}`}
                                    className="mt-2 inline-block font-semibold underline"
                                >
                                    View the existing report
                                </Link>
                            )}
                        </Alert>
                    </div>
                )}

                {/* Backend error message */}
                {serverError && (
                    <div className="mt-6">
                        <Alert type="error">{serverError}</Alert>
                    </div>
                )}

                {/* Location detection error */}
                {locationError && (
                    <div className="mt-6">
                        <Alert type="info">{locationError}</Alert>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-6 space-y-5"
                >

                    {/* Report title */}
                    <Input
                        label="Title"
                        placeholder="e.g. Garbage pile near bus stop"
                        {...register("title")}
                        error={errors.title}
                    />

                    {/* Report description */}
                    <Textarea
                        label="Description"
                        placeholder="Describe the garbage, how long it has been there, and why it needs attention."
                        {...register("description")}
                        error={errors.description}
                    />

                    {/* Garbage photo with preview */}
                    <ImageUploadField
                        file={imageFile}
                        onFileChange={handleFileChange}
                        error={imageError}
                    />

                    {/* Location block */}
                    <div className="rounded-xl border border-slate-200 p-4">

                        <div className="flex items-center justify-between gap-3">
                            <h2 className="text-sm font-semibold text-slate-800">
                                Location Details
                            </h2>

                            {/* Auto fill coordinates from the device */}
                            <button
                                type="button"
                                onClick={handleDetectLocation}
                                disabled={detecting}
                                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {detecting ? "Detecting..." : "📍 Use My Location"}
                            </button>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">

                            {/* GPS latitude */}
                            <Input
                                label="Latitude"
                                placeholder="22.572600"
                                {...register("latitude")}
                                error={errors.latitude}
                            />

                            {/* GPS longitude */}
                            <Input
                                label="Longitude"
                                placeholder="88.363900"
                                {...register("longitude")}
                                error={errors.longitude}
                            />
                        </div>

                        {/* Full address */}
                        <div className="mt-4">
                            <Input
                                label="Address"
                                placeholder="Street / area of the garbage location"
                                {...register("address")}
                                error={errors.address}
                            />
                        </div>

                        {/* Optional landmark */}
                        <div className="mt-4">
                            <Input
                                label="Landmark (optional)"
                                placeholder="Near the community park"
                                {...register("landmark")}
                                error={errors.landmark}
                            />
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">

                            {/* City */}
                            <Input
                                label="City"
                                placeholder="Kolkata"
                                {...register("city")}
                                error={errors.city}
                            />

                            {/* State */}
                            <Input
                                label="State"
                                placeholder="West Bengal"
                                {...register("state")}
                                error={errors.state}
                            />

                            {/* Pincode */}
                            <Input
                                label="Pincode"
                                placeholder="700001"
                                {...register("pincode")}
                                error={errors.pincode}
                            />
                        </div>
                    </div>

                    {/* Upload can take a while because of AI validation */}
                    {isSubmitting && (
                        <Alert type="info">
                            Uploading your photo and checking it with AI. This may take a few seconds.
                        </Alert>
                    )}

                    <div className="flex gap-3">

                        {/* Submit the report */}
                        <Button type="submit" loading={isSubmitting}>
                            Submit Report
                        </Button>

                        {/* Leave the form without submitting */}
                        <Link
                            to="/citizen/dashboard"
                            className="flex w-full items-center justify-center rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
