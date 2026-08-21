import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList } from "lucide-react";

import PageHeading from "@/components/common/PageHeading";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ImageUploadField from "@/components/reports/ImageUploadField";
import CleanupLocationCapture from "@/components/cleanup/CleanupLocationCapture";
import useGeoLocation from "@/hooks/useGeoLocation";
import { proposalSchema } from "@/schemas/proposalSchema";
import { submitProposal } from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import {
    clearProposalDraft,
    getProposalFile,
    getProposalLocation,
    hasProposalDraftContent,
    loadProposalDraft,
    saveProposalDraft,
    setProposalFile,
    setProposalLocation,
} from "@/utils/proposalDraft";
import { INSPECTION_RADIUS_METRES } from "@/constants/assignmentConstants";
import {
    LOCATION_STATUS,
    canSubmitLocation,
    evaluateCleanupLocation,
} from "@/utils/locationVerification";

/**
 * ============================================================================
 * Submit Proposal Page (Phase 14)
 * ============================================================================
 *
 * A cleaner inspects an open site in person and submits a cleanup proposal.
 *
 * This page replaced the one-tap "Claim Task" action. Submitting does NOT award
 * the site: several cleaners may propose for the same waste, and a municipal
 * officer decides who is assigned. That is stated plainly on the page so a
 * cleaner does not travel expecting the work to already be theirs.
 *
 * The assignment is passed through router state from the available-tasks list,
 * because the backend exposes no GET /api/cleanup-assignments/{id}. If the page
 * is opened directly (refresh, shared link) the site coordinates are unknown,
 * so the inspection proximity check is skipped here and left entirely to the
 * backend, which always re-verifies it.
 *
 * The form is long and is filled in on a phone at the waste site, so every
 * answer is kept in a per-assignment draft (see utils/proposalDraft). A stray
 * tap on the sidebar no longer throws the work away.
 * ============================================================================
 */

export default function SubmitProposalPage() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();

    // Passed by AvailableTasksPage so the site details can be shown and checked
    const assignment = useLocation().state?.assignment || null;

    const { detecting, locationError, detectLocation } = useGeoLocation();

    // Whatever was typed before the cleaner navigated away, read once on mount
    const [savedDraft] = useState(() => loadProposalDraft(assignmentId));

    // The GPS reading saved with that draft, so a verified inspection survives too
    const [savedLocation] = useState(() => getProposalLocation(assignmentId));

    // Inspection evidence: an optional photograph of the site as found
    const [inspectionImage, setInspectionImage] = useState(
        () => getProposalFile(assignmentId) // kept for the tab, lost on a reload
    );

    // GPS proof that the cleaner actually visited the site
    const [position, setPosition] = useState(savedLocation?.position || null);
    const [locationStatus, setLocationStatus] = useState(
        savedLocation?.status || LOCATION_STATUS.NOT_CAPTURED
    );
    const [distanceMetres, setDistanceMetres] = useState(
        savedLocation?.distanceMetres ?? null
    );

    const [submitError, setSubmitError] = useState("");

    // Said once, so refilled answers do not look like a glitch
    const [draftRestored] = useState(() => hasProposalDraftContent(savedDraft));

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(proposalSchema),
        defaultValues: {
            estimatedDurationDays: 1, // most sites are a single day of work
            manpowerCount: 2,
            ...savedDraft, // a saved draft takes precedence over these starting values
        },
    });

    /*
      Keep the draft in step with the form.

      watch(callback) returns a subscription, so it is torn down when the page
      unmounts - which is exactly the navigation that used to wipe the answers.

      The site details are stored with the answers so My Proposals can name the
      unfinished draft instead of showing a bare assignment number.
    */
    useEffect(() => {

        // Only known when the form was opened from Available Tasks
        const site = assignment
            ? {
                reportTitle: assignment.reportTitle,          // heading on the draft card
                address: assignment.address,                  // where the waste is
                city: assignment.city,
                reportId: assignment.reportId,                // powers the "View Report" link
                reportLatitude: assignment.reportLatitude,    // so a resumed draft can still
                reportLongitude: assignment.reportLongitude,  // check the inspection distance
            }
            : null;

        const subscription = watch((values) => {

            saveProposalDraft(assignmentId, values, site);

        });

        return () => subscription.unsubscribe();

    }, [assignment, assignmentId, watch]);

    // Hold the chosen photograph with the draft, so leaving the page keeps it
    const handleInspectionImageChange = (file) => {
        setInspectionImage(file);
        setProposalFile(assignmentId, file);
    };

    // Read the device position and check it against the reported waste location
    const handleCaptureLocation = async () => {
        setSubmitError("");

        const reading = await detectLocation();

        if (!reading) {
            return;
        }

        setPosition(reading);

        const verdict = evaluateCleanupLocation(
            reading,
            assignment?.reportLatitude,
            assignment?.reportLongitude,
            INSPECTION_RADIUS_METRES
        );

        setLocationStatus(verdict.status);
        setDistanceMetres(verdict.distanceMetres);

        // Stored with the draft, so returning to the form is still verified
        setProposalLocation(assignmentId, {
            position: reading,
            status: verdict.status,
            distanceMetres: verdict.distanceMetres,
        });
    };

    // Only a good reading inside the platform radius may be submitted
    const locationVerified = canSubmitLocation(locationStatus);

    const onSubmit = async (values) => {
        setSubmitError("");

        if (!locationVerified) {
            setSubmitError(
                `Capture your location at the site before submitting. Clean Bharat accepts an inspection only within ${INSPECTION_RADIUS_METRES} m of the reported waste.`
            );
            return;
        }

        // Multipart, because the inspection photograph travels with the plan
        const formData = new FormData();

        if (inspectionImage) {
            formData.append("inspectionImage", inspectionImage);
        }

        formData.append("inspectionLatitude", position.latitude);
        formData.append("inspectionLongitude", position.longitude);
        formData.append("siteObservations", values.siteObservations);
        formData.append("estimatedDurationDays", values.estimatedDurationDays);
        formData.append("manpowerCount", values.manpowerCount);
        formData.append("equipment", values.equipment);
        formData.append("cleaningMethod", values.cleaningMethod);
        formData.append("wasteHandlingPlan", values.wasteHandlingPlan);

        // Optional fields are omitted rather than sent empty, so Bean Validation passes
        if (values.estimatedWasteVolume) {
            formData.append("estimatedWasteVolume", values.estimatedWasteVolume);
        }

        if (values.proposedStartDate) {
            formData.append("proposedStartDate", values.proposedStartDate);
        }

        if (values.remarks) {
            formData.append("remarks", values.remarks);
        }

        try {
            await submitProposal(assignmentId, formData);

            clearProposalDraft(assignmentId); // the plan now lives on the server

            // The proposal list is where the municipal decision will appear
            navigate("/cleaner/proposals", { replace: true });
        } catch (error) {
            setSubmitError(getErrorMessage(error));
        }
    };

    return (
        <div className="mx-auto max-w-3xl">

            <PageHeading
                title="Submit Cleanup Proposal"
                titleHi="सफाई प्रस्ताव जमा करें"
                subtitle="Inspect the site, then send your cleanup plan to the municipal corporation for approval."
            />

            {/* The single most important expectation to set for a cleaner */}
            <Alert type="info" title="Submitting a proposal does not assign the work">
                Other cleaners may propose for the same site. A municipal officer
                compares the proposals and approves one. You will see the decision
                under My Proposals.
            </Alert>

            {/* Which site this proposal is for, when the list handed it over */}
            {assignment && (
                <section className="mt-4 rounded-gov border border-rule bg-white p-4">
                    <h2 className="flex items-center gap-2 font-serif text-base font-bold text-gov-navy">
                        <ClipboardList size={16} aria-hidden="true" />
                        {assignment.reportTitle}
                    </h2>

                    <p className="mt-1 text-sm text-ink-muted">
                        {assignment.address || "Address not recorded"}
                        {assignment.city && ` \u2022 ${assignment.city}`}
                    </p>
                </section>
            )}

            {/* Opened directly, so the site coordinates were never loaded */}
            {!assignment && (
                <div className="mt-4">
                    <Alert type="warning" title="Site details unavailable">
                        Open this form from Available Tasks so your distance from the
                        waste can be shown. Your inspection coordinates are still
                        verified by the server before the proposal is accepted.
                    </Alert>
                </div>
            )}

            {/* Answers came back from a draft, so say so instead of surprising the cleaner */}
            {draftRestored && (
                <div className="mt-4">
                    <Alert type="info" title="Draft restored">
                        Your earlier answers for this site have been brought back.
                        Attach the inspection photograph again if it is not shown.
                    </Alert>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>

                {/* ---------------- Inspection evidence ---------------- */}
                <section className="rounded-gov border border-rule bg-white p-4">
                    <h2 className="font-serif text-base font-bold text-gov-navy">
                        Inspection Evidence
                    </h2>

                    <p className="mt-1 text-sm text-ink-muted">
                        Capture your location at the waste site. A photograph of the
                        site as you found it is optional but strengthens your proposal.
                    </p>

                    <div className="mt-3">
                        <CleanupLocationCapture
                            status={locationStatus}
                            position={position}
                            distanceMetres={distanceMetres}
                            detecting={detecting}
                            locationError={locationError}
                            onCapture={handleCaptureLocation}
                        />
                    </div>

                    <div className="mt-4">
                        <ImageUploadField
                            file={inspectionImage}
                            onFileChange={handleInspectionImageChange}
                        />
                    </div>
                </section>

                {/* ---------------- The plan itself ---------------- */}
                <section className="space-y-4 rounded-gov border border-rule bg-white p-4">
                    <h2 className="font-serif text-base font-bold text-gov-navy">
                        Cleanup Plan
                    </h2>

                    <Textarea
                        label="Site observations"
                        required
                        rows={4}
                        hint="What did you find - type of waste, spread, access, any hazard?"
                        error={errors.siteObservations?.message}
                        {...register("siteObservations")}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Estimated duration (days)"
                            type="number"
                            min={1}
                            max={30}
                            required
                            error={errors.estimatedDurationDays?.message}
                            {...register("estimatedDurationDays")}
                        />

                        <Input
                            label="Manpower (workers)"
                            type="number"
                            min={1}
                            max={100}
                            required
                            error={errors.manpowerCount?.message}
                            {...register("manpowerCount")}
                        />
                    </div>

                    <Input
                        label="Equipment and tools"
                        required
                        hint="e.g. 1 tractor trolley, 4 spades, gloves, masks"
                        error={errors.equipment?.message}
                        {...register("equipment")}
                    />

                    <Textarea
                        label="Proposed cleaning method"
                        required
                        rows={3}
                        hint="How the waste will be collected, segregated and loaded"
                        error={errors.cleaningMethod?.message}
                        {...register("cleaningMethod")}
                    />

                    <Textarea
                        label="Waste handling plan"
                        required
                        rows={4}
                        hint="Where the waste will be taken and how it will be disposed of or recycled"
                        error={errors.wasteHandlingPlan?.message}
                        {...register("wasteHandlingPlan")}
                    />

                    <Input
                        label="Estimated waste volume"
                        hint="Optional, e.g. about 2 tractor loads"
                        error={errors.estimatedWasteVolume?.message}
                        {...register("estimatedWasteVolume")}
                    />

                    <Input
                        label="Proposed start date"
                        type="date"
                        hint="Optional. Today or later."
                        error={errors.proposedStartDate?.message}
                        {...register("proposedStartDate")}
                    />

                    <Textarea
                        label="Remarks for the municipal officer"
                        rows={3}
                        hint="Optional. Anything else the officer should know."
                        error={errors.remarks?.message}
                        {...register("remarks")}
                    />
                </section>

                {/* Backend rejections, e.g. inspection too far or duplicate proposal */}
                {submitError && <Alert type="error">{submitError}</Alert>}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="submit"
                        fullWidth={false}
                        loading={isSubmitting}
                        // Location is proof of a real inspection, so it gates submission
                        disabled={!locationVerified}
                    >
                        Submit Proposal
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        // Cancel is a deliberate abandon, so the draft goes with it
                        onClick={() => {
                            clearProposalDraft(assignmentId);
                            navigate(-1);
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
