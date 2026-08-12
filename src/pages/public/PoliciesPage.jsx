import { Scale, FileText, ShieldCheck, Accessibility, Mail, Clock } from "lucide-react";

import PageIntro from "@/components/layout/PageIntro";

import PolicyJumpNav from "@/components/policies/PolicyJumpNav";
import PolicyDocument from "@/components/policies/PolicyDocument";

import {
    POLICY_DOCUMENTS,
    GRIEVANCE_OFFICER,
} from "@/constants/policyContent";

/**
 * ============================================================================
 * Policies Page
 * ============================================================================
 *
 * The three documents the footer links to, on one route:
 *
 *   /policies#terms          - Terms & Conditions
 *   /policies#privacy        - Privacy Policy
 *   /policies#accessibility  - Accessibility Statement
 *
 * One page rather than three, for the same reason About holds How It Works
 * at an anchor: they are one subject - the terms on which this record is
 * published and read - each of them short, and a reader checking one
 * usually wants a glance at its neighbour. Three routes would also mean
 * three near-identical pages to keep in step.
 *
 * The footer's three links point at the three anchors, so each still
 * arrives at its own document and the column continues to read as three
 * separate items. ScrollManager retries the anchor while the page settles,
 * and each section carries scroll-mt-20 to clear the sticky navigation.
 *
 * Editorial, not data-driven: no API calls, nothing to fetch, readable
 * signed out - the same shape as the About and Environment pages.
 *
 * The grievance officer block at the foot is not decoration. The IT
 * (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021
 * expect a named contact and a stated response window for a platform
 * hosting user submissions, and both the terms and the privacy policy
 * refer the reader to it, so it closes the page rather than hiding inside
 * one of the three documents.
 * ============================================================================
 */

/*
  Icons keyed by document id, held here rather than in policyContent so the
  constants file stays free of lucide-react imports - the same split
  AboutSafeguardsSection uses for its safeguard icons.
*/
const POLICY_ICONS = {
    terms: FileText,
    privacy: ShieldCheck,
    accessibility: Accessibility,
};

export default function PoliciesPage() {

    return (
        <>
            <PageIntro
                icon={Scale}
                eyebrow="Policies"
                en="Policies"
                hi="नीतियाँ"
                description="The terms of use, what happens to your data, and how accessible this platform is - with the limits of each stated plainly."
            />

            {/*
              Contents first, so a reader arriving at one anchor can see
              the other two documents are here as well.
            */}
            <PolicyJumpNav icons={POLICY_ICONS} />

            {/*
              The three documents, alternating paper and white down the
              page. The jump nav above sits on white, so the first
              document takes paper to keep the run going.
            */}
            {POLICY_DOCUMENTS.map((doc, index) => (
                <PolicyDocument
                    key={doc.id}
                    document={doc}
                    icon={POLICY_ICONS[doc.id]}
                    tone={index % 2 === 0 ? "paper" : "white"}
                />
            ))}

            {/* ---------------- Grievance officer ---------------- */}
            <section
                id="grievance"
                className="scroll-mt-20 bg-white"
                aria-labelledby="grievance-heading"
            >
                <div className="mx-auto max-w-7xl px-4 py-12">

                    <div className="border-b border-rule pb-3">
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                            <Mail size={12} aria-hidden="true" />
                            Complaints and Takedown
                        </p>

                        <h2
                            id="grievance-heading"
                            className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl"
                        >
                            Grievance Officer
                        </h2>

                        <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                            Complaints about content published here, notices of
                            copyright or trademark infringement, and requests
                            concerning your own data all go to one place.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">

                        {/* Who to write to */}
                        <div className="rounded-gov border border-rule bg-paper p-5">
                            <h3 className="font-serif text-base font-bold text-gov-navy">
                                {GRIEVANCE_OFFICER.name}
                            </h3>

                            <p className="mt-0.5 text-xs tracking-wide text-ink-muted uppercase">
                                {GRIEVANCE_OFFICER.role}
                            </p>

                            <p className="mt-3 text-sm text-ink-muted">
                                <a
                                    href={`mailto:${GRIEVANCE_OFFICER.email}`}
                                    className="font-semibold text-gov-blue underline hover:no-underline"
                                >
                                    {GRIEVANCE_OFFICER.email}
                                </a>
                            </p>

                            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                                Please include the exact address of the page or
                                material concerned, what the problem is, and how
                                to reach you. A complaint without a location
                                cannot be acted on.
                            </p>
                        </div>

                        {/* What happens next */}
                        <div className="rounded-gov border border-rule bg-paper p-5">
                            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-gov-navy">
                                <Clock size={15} aria-hidden="true" className="text-gov-blue" />
                                What to expect
                            </h3>

                            <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex gap-2">
                                    <dt className="text-ink-muted">Acknowledged within</dt>
                                    <dd className="font-semibold text-gov-navy">
                                        {GRIEVANCE_OFFICER.acknowledgeWithin}
                                    </dd>
                                </div>

                                <div className="flex gap-2">
                                    <dt className="text-ink-muted">Resolved within</dt>
                                    <dd className="font-semibold text-gov-navy">
                                        {GRIEVANCE_OFFICER.resolveWithin}
                                    </dd>
                                </div>
                            </dl>

                            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                                These are the periods the Information Technology
                                (Intermediary Guidelines and Digital Media Ethics
                                Code) Rules, 2021 expect of a platform hosting
                                material submitted by its users.
                            </p>
                        </div>
                    </div>

                    {/*
                      Repeated here deliberately.

                      This block is the one part of the page a reader may
                      arrive at directly, and it is where somebody angry
                      about a report will land. The non-affiliation line
                      belongs beside the complaint address, not only in
                      clause 1 of the terms further up.
                    */}
                    <p className="mt-6 max-w-3xl border-l-2 border-saffron pl-3 text-xs leading-relaxed text-ink-muted">
                        Clean Bharat is an independent, privately built civic
                        platform. It is not run by, affiliated with, or endorsed
                        by any government body, and writing to this address does
                        not constitute a complaint to any municipal or statutory
                        authority.
                    </p>
                </div>
            </section>
        </>
    );
}
