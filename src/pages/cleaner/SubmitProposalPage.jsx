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
import {
    getProposal,      // reads the proposal being revised, so the form can be prefilled
    submitProposal,
    updateProposal,   // PUT, which also replaces the inspection photograph
} from "@/services/cleanupService";
import { getErrorMessage } from "@/utils/errorMessage";
import {
    clearProposalDraft,
    getProposalFile,
    getProposalLocation,
    hasProposalDraftContent,
    loadProposalDraft,
    proposalEditDraftId, // keeps a revision draft apart from an unfinished new one
    saveProposalDraft,
    setProposalFile,
    setProposalLocation,
} from "@/utils/proposalDraft";
import {
    INSPECTION_RADIUS_METRES,
    isProposalEditable,
    PROPOSAL_STATUS,
} from "@/constants/assignmentConstants";
import {
    LOCATION_STATUS,
    canSubmitLocation,
    evaluateCleanupLocation,
} from "@/utils/locationVerification";

/**
 * ============================================================================
 * Submit Proposal Page (Phase 14, revision mode added in Phase 16)
 * ============================================================================
 *
 * A cleaner inspects an open site in person and submits a cleanup proposal.
 *
 * This page replaced the one-tap "Claim Task" action. Submitting does NOT award
 * the site: several cleaners may propose for the same waste, and a municipal
 * officer decides who is assigned. That is stated plainly on the page so a
 * cleaner does not travel expecting the work to already be theirs.
 *
 * The same form serves two routes:
 *
 *   /cleaner/proposals/new/:assignmentId  - a first proposal for a site
 *   /cleaner/proposals/:proposalId/edit   - revising one already filed
 *
 * They are one component on purpose. The questions, the 50 m inspection rule
 * and the photograph requirement are identical; only the destination differs
 * (POST for the site, PUT for the proposal). Two copies would drift apart.
 *
 * Revision matters because a municipal officer can send a proposal back with
 * "Request Revision" instead of rejecting it. Without this route that decision
 * left the cleaner with nothing to act on: the bid sat in the queue, editable
 * by the rules but unreachable from the interface.
 *
 * For a new proposal the assignment is passed through router state from the
 * available-tasks list, because the backend exposes no
 * GET /api/cleanup-assignments/{id}. If the page is opened directly (refresh,
 * shared link) the site coordinates are unknown, so the proximity reading is
 * shown without a distance and the check is left entirely to the backend,
 * which always re-verifies it.
 *
 * The form is long and is filled in on a phone at the waste site, so every
 * answer is kept in a draft (see utils/proposalDraft). A stray tap on the
 * sidebar no longer throws the work away.
 * ============================================================================
 */

/*
  Server record -> form fields.

  Only the answers the cleaner may change are copied; ids, status and the
  inspection coordinates are the server's business. Optional text becomes ""
  rather than undefined, because an uncontrolled input given undefined keeps
  whatever React put there first and the field would look stale.
*/
function toFormValues(proposal) {
    return {
        siteObservations: proposal.siteObservations || "",
        estimatedDurationDays: proposal.estimatedDurationDays ?? 1,
        manpowerCount: proposal.manpowerCount ?? 1,
        equipment: proposal.equipment || "",
        cleaningMethod: proposal.cleaningMethod || "",
        wasteHandlingPlan: proposal.wasteHandlingPlan || "",
        estimatedWasteVolume: proposal.estimatedWasteVolume || "",

        // LocalDate arrives as 2026-08-25, which is what <input type="date"> wants
        proposedStartDate: proposal.proposedStartDate
            ? String(proposal.proposedStartDate).slice(0, 10)
            : "",

        remarks: proposal.remarks || "",
    };
}

/*
  A stored value is only usable when the server really sent a number.
  Number(null) is 0, which would read as a valid position on the equator, so
  the type is checked rather than the coerced value.
*/
function toStoredNumber(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export default function SubmitProposalPage() {

    // Exactly one of the two is present, which is how the mode is decided
    const { assignmentId, proposalId } = useParams();
    const isEditing = Boolean(proposalId);

    const navigate = useNavigate();

    // Passed by AvailableTasksPage so the site details can be shown and checked
    const assignment = useLocation().state?.assignment || null;

    const { detecting, locationError, detectLocation } = useGeoLocation();

    /*
      Drafts are keyed by what is being written, not by the site: a cleaner
      revising proposal 12 must not overwrite an unfinished new proposal for
      the same waste, and the listing must not offer a revision as a "draft".
    */
    const draftId = isEditing ? proposalEditDraftId(proposalId) : assignmentId;

    // Whatever was typed before the cleaner navigated away, read once on mount
    const [savedDraft] = useState(() => loadProposalDraft(draftId));

    // The GPS reading saved with that draft, so a verified inspection survives too
    const [savedLocation] = useState(() => getProposalLocation(draftId));

    // Inspection evidence: an optional photograph of the site as found
    const [inspectionImage, setInspectionImage] = useState(
        () => getProposalFile(draftId) // kept for the tab, lost on a reload
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

    // Revision mode only: the proposal on file, and how the fetch went
    const [filedProposal, setFiledProposal] = useState(null);
    const [loadingProposal, setLoadingProposal] = useState(isEditing);
    const [loadError, setLoadError] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        reset, // fills the form from the server copy once it arrives
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
      Revision mode: fetch the proposal being changed.

      The cleaner may have opened this from a link or a reload, so nothing is
      assumed to have been handed over in router state. A draft, if there is
      one, is newer than the server copy and is left alone - overwriting it
      would silently discard the answers being worked on.
    */
    useEffect(() => {

        if (!isEditing) {
            return; // the new-proposal route has nothing to load
        }

        let active = true; // a reply arriving after the page closed is ignored

        (async () => {
            try {
                const data = await getProposal(proposalId);

                if (!active) {
                    return;
                }

                setFiledProposal(data);

                if (!hasProposalDraftContent(savedDraft)) {
                    reset(toFormValues(data)); // prefill only when nothing is in progress
                }
            } catch (error) {
                if (active) {
                    // 403 and 404 both land here: not yours, or no longer there
                    setLoadError(getErrorMessage(error));
                }
            } finally {
                if (active) {
                    setLoadingProposal(false);
                }
            }
        })();

        return () => {
            active = false;
        };

    }, [isEditing, proposalId, reset, savedDraft]);

    /*
      Keep the draft in step with the form.

      watch(callback) returns a subscription, so it is torn down when the page
      unmounts - which is exactly the navigation that used to wipe the answers.

      The site details are stored with the answers so My Proposals can name the
      unfinished draft instead of showing a bare assignment number.
    */
    useEffect(() => {

        /*
          Known either from Available Tasks (new proposal) or from the record
          being revised. The proposal response carries no report coordinates,
          so a revision keeps the site name only.
        */
        const site = assignment
            ? {
                reportTitle: assignment.reportTitle,          // heading on the draft card
                address: assignment.address,                  // where the waste is
                city: assignment.city,
                reportId: assignment.reportId,                // powers the "View Report" link
                reportLatitude: assignment.reportLatitude,    // so a resumed draft can still
                reportLongitude: assignment.reportLongitude,  // check the inspection distance
            }
            : filedProposal
                ? {
                    reportTitle: filedProposal.reportTitle,
                    address: filedProposal.address,
                    city: filedProposal.city,
                    reportId: filedProposal.reportId,
                }
                : null;

        const subscription = watch((values) => {

            saveProposalDraft(draftId, values, site);

        });

        return () => subscription.unsubscribe();

    }, [assignment, draftId, filedProposal, watch]);

    // Hold the chosen photograph with the draft, so leaving the page keeps it
    const handleInspectionImageChange = (file) => {
        setInspectionImage(file);
        setProposalFile(draftId, file);
    };

    // Read the device position and check it against the reported waste location
    const handleCaptureLocation = async () => {
        setSubmitError("");

        const reading = await detectLocation();

        if (!reading) {
            return;
        }

        setPosition(reading);

        /*
          Reference point for the distance shown on screen.

          A new proposal compares against the citizen's reported coordinates.
          A revision has no report coordinates to hand, so it falls back to the
          inspection the backend already accepted for this proposal - close
          enough to tell the cleaner whether they are at the right place.
          Either way the backend measures again against the report itself, so
          this reading only ever advises.
        */
        const verdict = evaluateCleanupLocation(
            reading,
            assignment?.reportLatitude ?? filedProposal?.inspectionLatitude,
            assignment?.reportLongitude ?? filedProposal?.inspectionLongitude,
            INSPECTION_RADIUS_METRES
        );

        setLocationStatus(verdict.status);
        setDistanceMetres(verdict.distanceMetres);

        // Stored with the draft, so returning to the form is still verified
        setProposalLocation(draftId, {
            position: reading,
            status: verdict.status,
            distanceMetres: verdict.distanceMetres,
        });
    };

    // Only a good reading inside the platform radius may be submitted
    const locationVerified = canSubmitLocation(locationStatus);

    /*
      Revision mode inherits the inspection already on the proposal.

      The cleaner walked to this waste once, that reading was measured against
      the 50 m rule and accepted, and the server still holds it. Demanding a
      second visit merely to re-answer the officer's questions would be a
      pointless journey, so the stored position stands unless a new one is
      captured - and capturing one remains available at any time.
    */
    const savedLatitude = isEditing
        ? toStoredNumber(filedProposal?.inspectionLatitude)
        : null;

    const savedLongitude = isEditing
        ? toStoredNumber(filedProposal?.inspectionLongitude)
        : null;

    const savedDistanceMetres = isEditing
        ? toStoredNumber(filedProposal?.inspectionDistanceMeters)
        : null;

    const savedInspectedAt = isEditing ? filedProposal?.inspectedAt || null : null;

    // Half a pair proves nothing, so both coordinates must be present
    const hasSavedFix = savedLatitude !== null && savedLongitude !== null;

    /*
      The stored fix counts only while nothing new has been captured. Once the
      cleaner takes a fresh reading it is that reading which must pass, so a
      position outside the radius cannot be waved through by the old one.
    */
    const usingSavedFix = hasSavedFix && !position;

    const locationSatisfied = usingSavedFix || locationVerified;

    const onSubmit = async (values) => {
        setSubmitError("");

        if (!locationSatisfied) {
            setSubmitError(
                `Capture your location at the site before submitting. Clean Bharat accepts an inspection only within ${INSPECTION_RADIUS_METRES} m of the reported waste.`
            );
            return;
        }

        // Multipart, because the inspection photograph travels with the plan
        const formData = new FormData();

        /*
          Revision mode: an empty upload box means "keep the photograph on
          file". Sending nothing leaves the stored Cloudinary asset untouched;
          sending a file makes the backend delete the old one and store the
          new URL, so the change is deliberate rather than accidental.
        */
        if (inspectionImage) {
            formData.append("inspectionImage", inspectionImage);
        }

        /*
          Coordinates travel only when a fresh reading was taken. Omitting them
          tells the backend to keep the inspection already on the record, which
          is exactly what a revision without a new capture means. The 50 m rule
          is re-measured there against whichever position is used, so leaving
          them out skips no check.
        */
        if (position) {
            formData.append("inspectionLatitude", position.latitude);
            formData.append("inspectionLongitude", position.longitude);
        }

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
            if (isEditing) {
                await updateProposal(proposalId, formData); // back into the review queue
            } else {
                await submitProposal(assignmentId, formData);
            }

            clearProposalDraft(draftId); // the plan now lives on the server

            // The proposal list is where the municipal decision will appear
            navigate("/cleaner/proposals", { replace: true });
        } catch (error) {
            /*
              Everything the backend refuses is shown here rather than swallowed:
              the site was awarded to another cleaner while this was being
              written, the inspection is outside the 50 m radius, the proposal
              is no longer editable, or the image was rejected.
            */
            setSubmitError(getErrorMessage(error));
        }
    };

    /*
      Revision mode, still fetching. The form is deliberately withheld: shown
      empty it would look like the plan had been lost, and anything typed
      would be overwritten the moment the record arrived.
    */
    if (isEditing && loadingProposal) {
        return (
            <div className="mx-auto max-w-3xl">
                <PageHeading
                    title="Revise Cleanup Proposal"
                    titleHi="सफाई प्रस्ताव संशोधित करें"
                    subtitle="Opening the proposal you filed."
                />

                <div className="mt-4 space-y-3" aria-hidden="true">
                    <div className="h-24 animate-pulse rounded-gov border border-rule bg-white" />
                    <div className="h-64 animate-pulse rounded-gov border border-rule bg-white" />
                </div>
            </div>
        );
    }

    // Someone else's proposal, a deleted one, or the network gave way
    if (isEditing && loadError) {
        return (
            <div className="mx-auto max-w-3xl">
                <PageHeading
                    title="Revise Cleanup Proposal"
                    titleHi="सफाई प्रस्ताव संशोधित करें"
                    subtitle="This proposal could not be opened."
                />

                <div className="mt-4">
                    <Alert type="error" title="Proposal unavailable">
                        {loadError} You can only revise proposals you filed yourself.
                    </Alert>
                </div>

                <div className="mt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        onClick={() => navigate("/cleaner/proposals")}
                    >
                        Back to My Proposals
                    </Button>
                </div>
            </div>
        );
    }

    /*
      Decided already, or withdrawn. The backend refuses the update, so the
      form is replaced by an explanation instead of letting a cleaner rewrite
      a plan that can no longer be sent.
    */
    // isProposalEditable reads .status off the object, so pass the whole proposal
    if (isEditing && filedProposal && !isProposalEditable(filedProposal)) {
        return (
            <div className="mx-auto max-w-3xl">
                <PageHeading
                    title="Revise Cleanup Proposal"
                    titleHi="सफाई प्रस्ताव संशोधित करें"
                    subtitle={filedProposal.reportTitle}
                />

                <div className="mt-4">
                    <Alert type="warning" title="This proposal can no longer be changed">
                        {filedProposal.status === PROPOSAL_STATUS.APPROVED
                            ? "The corporation has approved this proposal, so the plan is now fixed. The site appears under My Tasks."
                            : "A decision has already been recorded for this proposal, so it is closed. Check My Proposals for the outcome."}
                    </Alert>
                </div>

                <div className="mt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        onClick={() => navigate("/cleaner/proposals")}
                    >
                        Back to My Proposals
                    </Button>
                </div>
            </div>
        );
    }

    // Site details come from the list for a new proposal, from the record for a revision
    const site = assignment || filedProposal;

    return (
        <div className="mx-auto max-w-3xl">

            <PageHeading
                title={isEditing ? "Revise Cleanup Proposal" : "Submit Cleanup Proposal"}
                titleHi={isEditing ? "सफाई प्रस्ताव संशोधित करें" : "सफाई प्रस्ताव जमा करें"}
                subtitle={
                    isEditing
                        ? "Update your plan and send it back to the municipal corporation for a fresh decision."
                        : "Inspect the site, then send your cleanup plan to the municipal corporation for approval."
                }
            />

            {/* The single most important expectation to set for a cleaner */}
            {isEditing ? (
                <Alert type="info" title="Resubmitting starts the review again">
                    Your revised plan returns to the corporation as awaiting a
                    decision. Other cleaners may still be proposing for the same
                    site, so a revision is not a promise of the work.
                </Alert>
            ) : (
                <Alert type="info" title="Submitting a proposal does not assign the work">
                    Other cleaners may propose for the same site. A municipal officer
                    compares the proposals and approves one. You will see the decision
                    under My Proposals.
                </Alert>
            )}

            {/* The corporation asked for changes, which is why this form is open */}
            {isEditing && filedProposal?.status === PROPOSAL_STATUS.REVISION_REQUIRED && (
                <div className="mt-4">
                    <Alert type="warning" title="Revision requested by the corporation">
                        The officer sent this proposal back rather than rejecting it.
                        Address what they asked for, then resubmit.
                    </Alert>
                </div>
            )}

            {/* Which site this proposal is for */}
            {site && (
                <section className="mt-4 rounded-gov border border-rule bg-white p-4">
                    <h2 className="flex items-center gap-2 font-serif text-base font-bold text-gov-navy">
                        <ClipboardList size={16} aria-hidden="true" />
                        {site.reportTitle}
                    </h2>

                    <p className="mt-1 text-sm text-ink-muted">
                        {site.address || "Address not recorded"}
                        {site.city && ` \u2022 ${site.city}`}
                    </p>
                </section>
            )}

            {/* Opened directly, so the site coordinates were never loaded */}
            {!site && (
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
                        {hasSavedFix
                            ? "The position from your earlier inspection of this site is kept, so a fresh reading is not required. Capture again only if you inspected from a different spot."
                            : "Capture your location at the waste site. A photograph of the site as you found it is optional but strengthens your proposal."}
                    </p>

                    {/* The saved* props are null for a first proposal, so the panel asks for a reading */}
                    <div className="mt-3">
                        <CleanupLocationCapture
                            status={locationStatus}
                            position={position}
                            distanceMetres={distanceMetres}
                            detecting={detecting}
                            locationError={locationError}
                            onCapture={handleCaptureLocation}
                            savedLatitude={savedLatitude}
                            savedLongitude={savedLongitude}
                            savedDistanceMetres={savedDistanceMetres}
                            savedInspectedAt={savedInspectedAt}
                        />
                    </div>

                    {/*
                      The photograph already on file, with the consequence of
                      replacing it stated before the file picker rather than
                      after: the old image is deleted from storage and cannot
                      be brought back.
                    */}
                    {isEditing && filedProposal?.inspectionImageUrl && (
                        <div className="mt-4 rounded-gov border border-rule bg-paper p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                                Photograph on file
                            </p>

                            <img
                                src={filedProposal.inspectionImageUrl}
                                alt="Site as recorded in the proposal already filed"
                                className="mt-2 h-32 w-full max-w-xs rounded-gov border border-rule object-cover"
                                loading="lazy"
                            />

                            <p className="mt-2 text-xs text-ink-muted">
                                Leave the upload box empty to keep this photograph.
                                Attaching a new one replaces it permanently - the old
                                file is deleted and cannot be recovered.
                            </p>
                        </div>
                    )}

                    <div className="mt-4">
                        <ImageUploadField
                            file={inspectionImage}
                            onFileChange={handleInspectionImageChange}
                            required={false}   // Inspection evidence strengthens a proposal, it is not demanded
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

                {/* Backend rejections, e.g. inspection too far or the site already awarded */}
                {submitError && <Alert type="error">{submitError}</Alert>}

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="submit"
                        fullWidth={false}
                        loading={isSubmitting}
                        // Location is proof of a real inspection, so it gates
                        // submission - satisfied by a fresh reading or by the
                        // one already verified for this proposal
                        disabled={!locationSatisfied}
                    >
                        {isEditing ? "Resubmit Proposal" : "Submit Proposal"}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        fullWidth={false}
                        // Cancel is a deliberate abandon, so the draft goes with it
                        onClick={() => {
                            clearProposalDraft(draftId);
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