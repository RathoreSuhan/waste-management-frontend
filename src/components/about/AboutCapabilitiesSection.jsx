import { Link } from "react-router-dom";
import {
    Camera,
    ListChecks,
    Star,
    MessagesSquare,
    Truck,
    Trophy,
    Globe,
    LayoutGrid,
    ArrowRight,
} from "lucide-react";

import { ABOUT_CAPABILITIES } from "@/constants/aboutContent";

/**
 * ============================================================================
 * About - What the Platform Does
 * ============================================================================
 *
 * The closing inventory: what a reader can actually do here.
 *
 * Placed last deliberately. A feature list is the least persuasive thing
 * on the page and the most skimmable, so it earns its place only after
 * the problem, the approach and the checks have been made. Someone who
 * stopped reading before this point has still had the argument.
 *
 * Only capabilities a visitor can act on are listed. The README's feature
 * table also covers authentication, cloud image storage and the admin
 * portal; those are real, but none of them is a reason for a resident to
 * be here, and listing infrastructure as though it were a benefit is how
 * feature lists lose their meaning.
 * ============================================================================
 */

/*
  Keyed by capability id. Kept out of aboutContent for the same reason as
  every other icon map in the project - constants files hold data, not
  components.
*/
const CAPABILITY_ICONS = {
    report: Camera,
    track: ListChecks,
    rate: Star,
    discuss: MessagesSquare,
    propose: Truck,
    recognise: Trophy,
    public: Globe,
};

export default function AboutCapabilitiesSection() {

    return (
        <section className="border-b border-rule bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="border-b border-rule pb-3">
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                        <LayoutGrid size={12} aria-hidden="true" />
                        What You Can Do
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                        On the Platform Today
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                        Everything listed here is working now. Nothing on this
                        page describes a feature that is planned but not yet
                        built.
                    </p>
                </div>

                <ul className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                    {ABOUT_CAPABILITIES.map((capability) => {

                        const CapabilityIcon = CAPABILITY_ICONS[capability.id];

                        return (
                            <li key={capability.id} className="flex gap-3">
                                <CapabilityIcon
                                    size={18}
                                    className="mt-0.5 shrink-0 text-india-green"
                                    aria-hidden="true"
                                />

                                <div className="min-w-0">
                                    <h3 className="font-serif text-base leading-snug font-bold text-gov-navy">
                                        {capability.title}
                                    </h3>

                                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                                        {capability.body}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {/*
                  The page ends where the process does - on the public
                  record, showing the five stages having actually happened.
                  Same destination the homepage process section uses, for
                  the same reason: a worked example beats another
                  description.
                */}
                <div className="mt-10 border-t border-rule pt-5">
                    <Link
                        to="/success-stories"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gov-blue hover:underline"
                    >
                        See a report that went the whole way
                        <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
