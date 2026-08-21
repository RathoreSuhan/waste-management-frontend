/**
 * ============================================================================
 * Proposal Detail Panel (Phase 16 - Municipal Officer console)
 * ============================================================================
 *
 * The complete cleaning plan behind one proposal, laid out for the officer who
 * has to defend the award decision later.
 *
 * ProposalReviewCard deliberately shows only the comparison figures (cleaner,
 * duration, manpower, inspection distance). Everything an officer needs to
 * judge *method* rather than *price* lives here:
 *
 *   - site observations recorded during the physical inspection
 *   - equipment the cleaner will bring
 *   - the cleaning method they intend to use
 *   - the waste-handling plan (where the collected waste actually goes)
 *   - estimated waste volume and proposed start date
 *   - the cleaner's own closing remarks
 *   - the inspection photograph with its exact coordinates and a maps link
 *
 * This is a presentational panel, not a modal: pages render it inline under the
 * selected card so the officer can keep the queue in view while reading a plan.
 * It performs no fetching and takes no decisions.
 * ============================================================================
 */

import { CalendarDays, ExternalLink, MapPin, Trash2, Wrench } from "lucide-react";
import BiText from "@/components/common/BiText";
import { INSPECTION_RADIUS_METRES } from "@/constants/assignmentConstants";
import { getCleanerTypeLabel } from "@/constants/municipalConstants";
import { buildMapsUrl, formatCoordinates, formatDateTime } from "@/utils/formatters";

/**
 * One labelled free-text block of the plan.
 *
 * Long fields (waste handling, method) are whitespace-preserved so the officer
 * reads exactly what the cleaner typed, including their own line breaks.
 */
function PlanField({ icon: Icon, label, labelHi, value }) {
    return (
        <div className="rounded-gov border border-rule bg-white p-3">
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-ink-muted">
                {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
                <BiText en={label} hi={labelHi} />
            </p>

            {/* whitespace-pre-line keeps the cleaner's own paragraphing intact */}
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{value || "Not provided"}</p>
        </div>
    );
}

export default function ProposalDetailPanel({ proposal }) {

    // Rendered conditionally by the pages, but guard anyway so a cleared
    // selection cannot crash the queue screen.
    if (!proposal) {
        return null;
    }

    const distance = proposal.inspectionDistanceMeters;
    const hasDistance = distance !== null && distance !== undefined;
    const withinRadius = hasDistance && distance <= INSPECTION_RADIUS_METRES;

    // Coordinates are optional on very old rows, so the maps link is conditional.
    const mapsUrl = buildMapsUrl(proposal.inspectionLatitude, proposal.inspectionLongitude);

    return (
        <section className="rounded-gov border border-gov-blue/30 bg-blue-50/40 p-4 sm:p-5">

            <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gov-navy">
                        <BiText en="Full cleaning plan" hi="पूर्ण सफाई योजना" />
                    </h4>
                    <p className="mt-1 text-sm text-ink-muted">

                        {/* Restates who authored the plan so the panel stands alone if printed */}
                        {proposal.cleanerName || "-"} &middot; {getCleanerTypeLabel(proposal.cleanerType)}
                        {proposal.cleanerOrganization ? ` · ${proposal.cleanerOrganization}` : ""}
                    </p>
                </div>
                <p className="text-xs text-ink-muted">
                    <BiText en="Proposal" hi="प्रस्ताव" /> #{proposal.proposalId}
                </p>
            </header>

            {/* Inspection evidence block: photo + exact coordinates + distance verdict */}
            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
                {proposal.inspectionImageUrl ? (
                    <a
                        href={proposal.inspectionImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-gov border border-rule bg-white"
                    >

                        {/* Opens the raw upload so the officer can zoom into the site */}
                        <img
                            src={proposal.inspectionImageUrl}
                            alt="Site inspection photograph"
                            loading="lazy"
                            className="h-40 w-full object-cover md:h-full"
                        />
                    </a>
                ) : null}

                <div className="rounded-gov border border-rule bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-ink-muted">
                        <BiText en="Inspection verification" hi="निरीक्षण सत्यापन" />
                    </p>

                    <p className="mt-2 text-sm text-ink">
                        <span className="text-ink-muted">
                            <BiText en="Inspected at" hi="निरीक्षण समय" primaryOnly />:{" "}
                        </span>
                        {proposal.inspectedAt ? formatDateTime(proposal.inspectedAt) : "-"}
                    </p>

                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-ink">
                        <MapPin className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                        {formatCoordinates(proposal.inspectionLatitude, proposal.inspectionLongitude) || "-"}
                        {mapsUrl ? (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-gov-blue underline"
                            >
                                Open in Maps
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </a>
                        ) : null}
                    </p>

                    {/* The 50 m platform rule, measured by the backend, stated plainly */}
                    <p className={`mt-2 text-sm font-medium ${withinRadius ? "text-india-green" : "text-rose-700"}`}>
                        {hasDistance
                            ? `${Math.round(distance)} m from the reported location (${INSPECTION_RADIUS_METRES} m rule ${withinRadius ? "met" : "not met"})`
                            : "Distance was not recorded for this inspection."}
                    </p>
                </div>
            </div>

            {/* The plan itself */}
            <div className="mt-4 grid gap-3">
                <PlanField
                    label="Site observations"
                    labelHi="स्थल अवलोकन"
                    value={proposal.siteObservations}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                    <PlanField
                        icon={Wrench}
                        label="Equipment"
                        labelHi="उपकरण"
                        value={proposal.equipment}
                    />
                    <PlanField
                        label="Cleaning method"
                        labelHi="सफाई विधि"
                        value={proposal.cleaningMethod}
                    />
                </div>
                <PlanField
                    icon={Trash2}
                    label="Waste handling plan"
                    labelHi="कचरा निपटान योजना"
                    value={proposal.wasteHandlingPlan}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                    <PlanField
                        label="Estimated waste volume"
                        labelHi="अनुमानित कचरा मात्रा"
                        value={proposal.estimatedWasteVolume}
                    />
                    <PlanField
                        icon={CalendarDays}
                        label="Proposed start date"
                        labelHi="प्रस्तावित प्रारंभ तिथि"

                        // Sent as a plain date by the backend, so it is shown as-is
                        value={proposal.proposedStartDate}
                    />
                </div>

                {/* Only shown when the cleaner actually wrote something */}
                {proposal.remarks ? (
                    <PlanField label="Cleaner remarks" labelHi="सफाई कर्मी टिप्पणी" value={proposal.remarks} />
                ) : null}
            </div>

            {/* Audit footer: submission and last-edit timestamps */}
            <p className="mt-4 text-xs text-ink-muted">
                <BiText en="Submitted" hi="प्रस्तुत" primaryOnly />:{" "}
                {proposal.submittedAt ? formatDateTime(proposal.submittedAt) : "-"}
                {proposal.updatedAt ? ` · Last updated: ${formatDateTime(proposal.updatedAt)}` : ""}
            </p>
        </section>
    );
}