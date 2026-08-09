import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploadField from "@/components/reports/ImageUploadField";
import LocationVerificationPanel from "@/components/reports/LocationVerificationPanel";

import useGeoLocation from "@/hooks/useGeoLocation";

import { createReportSchema } from "@/schemas/reportSchema";
import { createReport } from "@/services/reportService";
import {
    getErrorMessage,
    getDuplicateReportDetails,
    getImageValidationDetails,
} from "@/utils/errorMessage";
import {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_BYTES,
    MAX_IMAGE_SIZE_LABEL,
    IMAGE_REJECTION_META,
    DEFAULT_IMAGE_REJECTION_META,
} from "@/constants/reportConstants";
import { formatDistance } from "@/utils/geo";
import {
    evaluateLocation,
    canSubmitLocation,
    LOCATION_STATUS,
} from "@/utils/locationVerification";
import {
    saveDraftValues,
    loadDraftValues,
    setDraftFile,
    getDraftFile,
    clearDraft,
    hasDraftContent,
} from "@/utils/reportDraft";

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
 *
 * Field labels match the backend CreateReportRequest exactly, so the form
 * and the API describe the same thing by the same name.
 *
 * Anything typed here is written to a draft store, so moving to another
 * section and coming back does not wipe a half-filled form.
 * ============================================================================
 */

// Blank form, used when there is no saved draft to restore
const EMPTY_FORM = {
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
};

export default function CreateReportPage() {

    // Used to redirect to the created report
    const navigate = useNavigate();

    // Browser GPS helper
    const {
        detecting,
        locationError,
        detectLocation,
        clearLocationError,
    } = useGeoLocation();

    /**
     * Position read from the device, used to confirm the citizen is at the
     * site. Held on the page rather than in the draft store, because a
     * position restored from an earlier visit would prove nothing about
     * where the citizen is now.
     */
    const [position, setPosition] = useState(null);

    /**
     * Whether the citizen has declared the location themselves, which is
     * what allows a report through when GPS cannot confirm it.
     */
    const [locationDeclared, setLocationDeclared] = useState(false);

    // Raised when submission is attempted with neither confirmation
    const [locationBlocked, setLocationBlocked] = useState("");

    // Selected garbage photo - recovered from the draft if one is held
    const [imageFile, setImageFile] = useState(() => getDraftFile());

    // Validation message for the photo field
    const [imageError, setImageError] = useState("");

    // Error returned by the backend
    const [serverError, setServerError] = useState("");

    // Duplicate report details returned with HTTP 409
    const [duplicateInfo, setDuplicateInfo] = useState(null);

    // Photograph refused by the backend AI validation
    const [imageRejection, setImageRejection] = useState(null);

    /**
     * Text values saved on a previous visit.
     *
     * Read once during the first render so the inputs can be seeded directly,
     * which avoids a visible flash of empty fields followed by a reset().
     */
    const [restoredValues] = useState(() => loadDraftValues());

    // Whether to tell the user that earlier input was brought back
    const [draftRestored, setDraftRestored] = useState(
        () => hasDraftContent(restoredValues)
    );

    /**
     * Notices sit above a long form, so after a failed submission they are
     * scrolled well out of view. This ref lets us bring them back on screen.
     */
    const noticeRef = useRef(null);

    /**
     * React Hook Form
     */
    const {
        register,
        handleSubmit,
        setValue,
        getValues,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createReportSchema),

        // Continue from the saved draft when there is one
        defaultValues: restoredValues || EMPTY_FORM,
    });

    /**
     * Coordinates are watched rather than read on demand, because the
     * verification panel has to respond the moment they are edited. Typing
     * a different latitude should visibly withdraw the confirmation, not
     * leave a stale "Location Confirmed" on screen.
     */
    const latitude = watch("latitude");
    const longitude = watch("longitude");

    /**
     * Current verification outcome, recalculated whenever the captured
     * position or the coordinates change.
     */
    const { status: locationStatus, distanceMetres } = useMemo(
        () => evaluateLocation(position, latitude, longitude),
        [position, latitude, longitude]
    );

    // Whether the report is allowed through in its present state
    const locationAllowed = canSubmitLocation(locationStatus, locationDeclared);

    /**
     * Mirror the current values into the draft store.
     *
     * Reading with getValues() on demand avoids subscribing to the form,
     * so typing does not trigger a re-render of this fairly large page.
     */
    function saveDraft() {
        saveDraftValues(getValues());
    }

    /**
     * Bring a failed submission into view.
     *
     * Without this the user is left at the bottom of the form beside the
     * submit button, with no visible clue as to why nothing happened.
     */
    useEffect(() => {

        // Only react once there is something worth showing
        if (!duplicateInfo && !serverError && !imageRejection) {
            return;
        }

        noticeRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });

        // Move focus as well, so the notice is announced rather than just shown
        noticeRef.current?.focus({ preventScroll: true });

    }, [duplicateInfo, serverError, imageRejection]);

    /**
     * Validate the selected photo against the backend rules.
     */
    function handleFileChange(file) {

        // Clear the old validation message
        setImageError("");

        // The previous verdict no longer applies to this photograph
        setImageRejection(null);

        setImageFile(file);

        // Hold the photo in the draft so it survives navigation
        setDraftFile(file);

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
     * Capture the device position and pin the report to it.
     *
     * The reading is kept as well as copied into the fields, because the
     * coordinates alone cannot show whether they came from the device or
     * were typed in from somewhere else entirely.
     */
    async function handleCapturePosition() {

        const reading = await detectLocation();

        // User denied permission or detection failed
        if (!reading) {
            return;
        }

        setPosition(reading);

        // A fresh reading supersedes any earlier complaint about the location
        setLocationBlocked("");

        // Values are stored as strings because the schema validates strings
        setValue("latitude", String(reading.latitude), { shouldValidate: true });
        setValue("longitude", String(reading.longitude), { shouldValidate: true });

        // setValue does not raise a change event, so the draft is saved here
        saveDraft();
    }

    /**
     * Record the citizen's own confirmation of the location.
     *
     * Ticking it clears both the block and any detection error, since the
     * citizen has taken responsibility for the coordinates and the failed
     * reading is no longer something they need to act on.
     */
    function handleDeclaredChange(checked) {

        setLocationDeclared(checked);

        if (checked) {
            setLocationBlocked("");
            clearLocationError();
        }
    }

    /**
     * Submit the report to the backend.
     */
    async function onSubmit(data) {

        // Reset previous API messages
        setServerError("");
        setDuplicateInfo(null);
        setImageRejection(null);

        // Photo is mandatory for the backend AI validation
        if (!imageFile) {
            setImageError("Please upload a photo of the garbage.");
            return;
        }

        // Stop if the photo failed the format/size checks
        if (imageError) {
            return;
        }

        /**
         * Reports are meant to be filed at the site, so an unconfirmed
         * location is stopped here rather than sent on to the backend, which
         * has no way to tell where the citizen actually was.
         */
        if (!locationAllowed) {
            setLocationBlocked(
                locationStatus === LOCATION_STATUS.TOO_FAR
                    ? "The location entered is away from where you are. Capture your position at the site, or confirm the location yourself in section 3."
                    : "Please confirm the location in section 3 before submitting."
            );
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

            // Submitted successfully, so the draft must not linger
            clearDraft();

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

            // Photograph refused by the AI, with the reason it gave
            const rejection = getImageValidationDetails(error);

            if (rejection) {
                setImageRejection(rejection);
                return;
            }

            // Any other validation / AI / server error
            setServerError(getErrorMessage(error, "Unable to submit the report."));
        }
    }

    // Any notice at all means the form needs pushing down a little
    const hasNotice =
        draftRestored || duplicateInfo || serverError || locationError
        || imageRejection;

    return (
        <div className="mx-auto max-w-3xl">

            {/* Page heading, rendered once per page */}
            <PageHeading
                title="File a Report"
                titleHi="रिपोर्ट दर्ज करें"
                subtitle="Complete all mandatory fields marked with an asterisk. Reports are recorded against your account."
            />

            <div className="rounded-gov border border-rule bg-white">

                {/* Form header band */}
                <div className="border-b border-rule bg-paper px-5 py-3">
                    <h2 className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Garbage Report Form
                    </h2>
                </div>

                <div className="p-5 lg:p-6">

                    {/*
                      Notices are grouped in one focusable block so a failed
                      submission can be scrolled to and announced in one step.
                    */}
                    <div
                        ref={noticeRef}
                        tabIndex={-1}
                        className="space-y-4 outline-none"
                    >

                        {/* Draft recovered from an earlier visit */}
                        {draftRestored && (
                            <Alert type="info" title="Saved Draft Restored">
                                <p>
                                    Your earlier entries have been brought back.
                                    {!imageFile &&
                                        " The photograph is not retained after a page refresh, so please attach it again."}
                                </p>

                                {/* Lets the user start over rather than edit around the draft */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearDraft();
                                        setDraftRestored(false);
                                        window.location.reload();
                                    }}
                                    className="mt-2 font-semibold underline"
                                >
                                    Discard the draft and start afresh
                                </button>
                            </Alert>
                        )}

                        {/* Duplicate report warning with a link to the existing record */}
                        {duplicateInfo && (
                            <DuplicateReportNotice duplicate={duplicateInfo} />
                        )}

                        {/* Photograph refused by the AI check */}
                        {imageRejection && (
                            <ImageRejectionNotice rejection={imageRejection} />
                        )}

                        {/* Backend error message */}
                        {serverError && (
                            <Alert type="error" title="Submission Failed">
                                {serverError}
                            </Alert>
                        )}

                        {/* Location detection error */}
                        {locationError && (
                            <Alert type="info" title="Location Unavailable">
                                {locationError}
                            </Alert>
                        )}
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        // React change events bubble, so one handler covers every field
                        onChange={saveDraft}
                        className={hasNotice ? "mt-5" : ""}
                    >

                        {/* ---------- Section 1 ---------- */}
                        <FormSection
                            step="1"
                            title="Report Details"
                        >
                            <div className="space-y-4">

                                {/* Maps to CreateReportRequest.title */}
                                <Input
                                    label="Title"
                                    required
                                    hint="A short heading, e.g. Uncollected waste near bus stand"
                                    placeholder="Uncollected waste near bus stand"
                                    {...register("title")}
                                    error={errors.title}
                                />

                                {/* Maps to CreateReportRequest.description */}
                                <Textarea
                                    label="Description"
                                    required
                                    hint="State the nature of the waste, how long it has remained, and any health hazard caused."
                                    placeholder="Describe the issue in detail"
                                    {...register("description")}
                                    error={errors.description}
                                />
                            </div>
                        </FormSection>

                        {/* ---------- Section 2 ---------- */}
                        <FormSection
                            step="2"
                            title="Photograph"
                        >
                            {/* Photograph with preview - validated before submission */}
                            <ImageUploadField
                                file={imageFile}
                                onFileChange={handleFileChange}
                                error={imageError}
                            />
                        </FormSection>

                        {/* ---------- Section 3 ---------- */}
                        <FormSection
                            step="3"
                            title="Location Details"
                        >
                            <div className="space-y-4">

                                {/*
                                  Confirms the citizen is at the site. Placed
                                  above the coordinates because it is what
                                  fills them in for most reports.
                                */}
                                <LocationVerificationPanel
                                    status={locationStatus}
                                    distanceMetres={distanceMetres}
                                    position={position}
                                    detecting={detecting}
                                    locationError={locationError}
                                    declared={locationDeclared}
                                    onDeclaredChange={handleDeclaredChange}
                                    onCapture={handleCapturePosition}
                                />

                                {/* Raised when submission was attempted unconfirmed */}
                                {locationBlocked && (
                                    <p
                                        role="alert"
                                        className="text-xs font-semibold text-red-700"
                                    >
                                        {locationBlocked}
                                    </p>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">

                                    {/*
                                      Coordinates stay editable so the pin can
                                      be moved onto the waste across the road,
                                      but the panel withdraws its confirmation
                                      once they leave the site radius.
                                    */}
                                    <Input
                                        label="Latitude"
                                        required
                                        placeholder="22.572600"
                                        {...register("latitude")}
                                        error={errors.latitude}
                                    />

                                    {/* GPS longitude */}
                                    <Input
                                        label="Longitude"
                                        required
                                        placeholder="88.363900"
                                        {...register("longitude")}
                                        error={errors.longitude}
                                    />
                                </div>

                                {/* Street address */}
                                <Input
                                    label="Address"
                                    required
                                    placeholder="Street or area where the waste is located"
                                    {...register("address")}
                                    error={errors.address}
                                />

                                {/* Optional, but makes the site much easier to find */}
                                <Input
                                    label="Landmark"
                                    hint="Optional, but helps the cleanup team locate the site."
                                    placeholder="Near the community park"
                                    {...register("landmark")}
                                    error={errors.landmark}
                                />

                                <div className="grid gap-4 sm:grid-cols-3">

                                    {/* City / town */}
                                    <Input
                                        label="City"
                                        required
                                        placeholder="Kolkata"
                                        {...register("city")}
                                        error={errors.city}
                                    />

                                    {/* State */}
                                    <Input
                                        label="State"
                                        required
                                        placeholder="West Bengal"
                                        {...register("state")}
                                        error={errors.state}
                                    />

                                    {/* Postal code */}
                                    <Input
                                        label="Pincode"
                                        required
                                        placeholder="700001"
                                        {...register("pincode")}
                                        error={errors.pincode}
                                    />
                                </div>
                            </div>
                        </FormSection>

                        {/* Verification can take a few seconds because of AI checks */}
                        {isSubmitting && (
                            <div className="mt-5">
                                <Alert type="info" title="Verification in Progress">
                                    Your photograph is being uploaded and verified. Please do
                                    not close this window.
                                </Alert>
                            </div>
                        )}

                        {/* Declaration - sets the expectation that reports are checked */}
                        <p className="mt-6 rounded-gov border border-rule bg-paper p-3 text-[11px] leading-relaxed text-ink-muted">
                            <span className="font-semibold text-ink">Declaration:</span>{" "}
                            I declare that the information furnished above is true to the
                            best of my knowledge. I understand that misleading reports may
                            be rejected and repeated misuse may lead to my account being
                            suspended.
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3 border-t border-rule pt-5">

                            {/* Submit the report */}
                            <Button
                                type="submit"
                                loading={isSubmitting}
                                fullWidth={false}
                                className="min-w-44"
                            >
                                Submit Report
                            </Button>

                            {/* Leaving deliberately is a discard, so the draft goes too */}
                            <Link
                                to="/citizen/dashboard"
                                onClick={clearDraft}
                                className="inline-flex items-center justify-center rounded-gov border border-rule bg-white px-5 py-2.5 text-sm font-semibold text-ink-muted transition hover:bg-paper"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

/**
 * Notice shown when the backend finds an existing report at the same place.
 *
 * The bare message alone reads like a refusal. The distance and the category
 * are what let the citizen recognise the pile as the one already logged, so
 * both are quoted alongside a link to that record - which is where an urgency
 * rating or a comment will do more good than a second report.
 */
function DuplicateReportNotice({ duplicate }) {

    // Sent by the backend as metres between the two reports
    const distance =
        typeof duplicate.distanceMeters === "number"
            ? formatDistance(duplicate.distanceMeters)
            : null;

    return (
        <Alert type="warning" title="Possible Duplicate Report">

            <p>{duplicate.message}</p>

            {/* What the backend matched on, in plain terms */}
            {(distance || duplicate.garbageCategory) && (
                <dl className="mt-2 space-y-0.5 text-[13px]">

                    {distance && (
                        <div className="flex gap-1.5">
                            <dt className="font-semibold">Distance:</dt>
                            <dd>{distance} from the location you entered</dd>
                        </div>
                    )}

                    {/* AI's reading of the waste, which the report list does not show */}
                    {duplicate.garbageCategory && (
                        <div className="flex gap-1.5">
                            <dt className="font-semibold">Waste identified as:</dt>
                            <dd>{duplicate.garbageCategory}</dd>
                        </div>
                    )}
                </dl>
            )}

            {/*
              Supporting the existing report is the useful action here, so the
              link is framed as that rather than as a dead end.
            */}
            {duplicate.existingReportId && (
                <Link
                    to={`/reports/${duplicate.existingReportId}`}
                    className="mt-2 inline-block font-semibold underline"
                >
                    View the existing report and add your support
                </Link>
            )}
        </Alert>
    );
}

/**
 * Notice shown when the AI check refuses the uploaded photograph.
 *
 * A rejection is only useful if the citizen can tell what to change, so three
 * things are shown together: the guidance for the reason, what the AI actually
 * reported seeing, and a couple of practical tips for the next attempt.
 *
 * The AI observation is kept visually separate from the guidance, because it
 * is a machine's reading of the photograph rather than an instruction.
 */
function ImageRejectionNotice({ rejection }) {

    // Unknown reason codes still render, using the generic heading
    const meta =
        IMAGE_REJECTION_META[rejection.reason] || DEFAULT_IMAGE_REJECTION_META;

    // Confidence is optional, and only worth showing as a whole percentage
    const confidencePercent =
        typeof rejection.confidence === "number"
            ? Math.round(rejection.confidence * 100)
            : null;

    return (
        <Alert type="warning" title={meta.title}>

            {/* Guidance written by the backend for this rejection reason */}
            <p>{rejection.message}</p>

            {/* The AI's own reading of the photograph, quoted as an observation */}
            {rejection.aiRemarks && (
                <p className="mt-2 border-l-2 border-orange-300 pl-2.5 text-[13px] italic">
                    <span className="font-semibold not-italic">
                        AI observation:
                    </span>{" "}
                    {rejection.aiRemarks}

                    {confidencePercent !== null && (
                        <span className="not-italic">
                            {" "}({confidencePercent}% confidence)
                        </span>
                    )}
                </p>
            )}

            {/* What to do differently next time */}
            {meta.tips.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[13px]">
                    {meta.tips.map((tip) => (
                        <li key={tip}>{tip}</li>
                    ))}
                </ul>
            )}

            {/*
              The rest of the form is still filled in, so the only thing needed
              is a different photograph.
            */}
            <p className="mt-2 text-[13px]">
                Your other details have been kept. Attach a different photograph
                in section 2 and submit again.
            </p>
        </Alert>
    );
}

/**
 * Numbered section of the report form.
 *
 * Splitting a long form into numbered parts makes it easier to work
 * through and easier to refer to in the field hints.
 */
function FormSection({ step, title, action, children }) {

    return (
        <fieldset className="mt-5 first:mt-0">

            <div className="mb-3 flex items-center justify-between gap-3 border-b border-rule pb-2">

                <legend className="flex items-center gap-2">
                    {/* Step number in a solid navy square */}
                    <span className="flex h-5 w-5 items-center justify-center rounded-gov bg-gov-navy text-[11px] font-bold text-white">
                        {step}
                    </span>

                    <span className="text-sm font-semibold text-gov-navy">
                        {title}
                    </span>
                </legend>

                {/* Optional helper action, e.g. detect location */}
                {action}
            </div>

            {children}
        </fieldset>
    );
}
