import { Link } from "react-router-dom";
import { User, Truck, Building2, ArrowRight } from "lucide-react";

/**
 * ============================================================================
 * Home Roles Section
 * ============================================================================
 *
 * Who the platform is for, and what each of them does here.
 *
 * The backend models three roles with genuinely different portals behind
 * them, and a visitor choosing on the registration form has no way to
 * know which one they are. Stating it on the landing page is cheaper
 * than an account created under the wrong role, which cannot be changed
 * without an administrator.
 *
 * Only citizens and cleaners can register. The admin card is described
 * but carries no call to action, because admin access is granted by
 * promotion from the admin portal, never by signing up.
 * ============================================================================
 */

const ROLES = [
    {
        icon: User,
        title: "Citizens",
        titleHindi: "नागरिक",
        summary:
            "Anybody who wants an uncollected waste site dealt with.",
        duties: [
            "File a report with a photograph and location",
            "Track it through to closure",
            "Rate how urgent a site is",
            "Discuss reports with neighbours",
        ],
        action: {
            label: "Register as a Citizen",
            to: "/register",
        },
        // Tinted heading strip, so the three cards are told apart at a glance
        tint: "bg-civic-teal-soft",
        iconClass: "text-civic-teal",
    },
    {
        icon: Truck,
        title: "Cleaners",
        titleHindi: "सफाई कर्मी",
        summary:
            "Individuals, NGOs, private firms and municipal teams doing the work.",
        duties: [
            "Claim reported sites in your area",
            "Upload proof once the site is cleared",
            "Earn reward points for verified work",
            "Appear on city, state and national rankings",
        ],
        action: {
            label: "Register as a Cleaner",
            to: "/register",
        },
        tint: "bg-green-soft",
        iconClass: "text-india-green",
    },
    {
        icon: Building2,
        title: "Administrators",
        titleHindi: "प्रशासक",
        summary:
            "The people keeping the record straight.",
        duties: [
            "Monitor platform-wide activity",
            "Manage citizen and cleaner accounts",
            "Search, filter and remove reports",
            "Maintain municipal corporation contacts",
        ],
        // No action: admin access comes from promotion, not registration
        note: "Granted by an existing administrator. Not open for registration.",
        tint: "bg-plum-soft",
        iconClass: "text-civic-plum",
    },
];

export default function HomeRolesSection() {

    return (
        <section className="border-t border-rule bg-paper">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="border-b border-rule pb-3">
                    <h2 className="font-serif text-2xl font-bold text-gov-navy">
                        Who Uses This Platform
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                        Three roles, each with its own portal. Choose the one that
                        describes you before registering.
                    </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {ROLES.map((role) => (
                        <article
                            key={role.title}
                            className="flex flex-col rounded-gov border border-rule bg-white"
                        >

                            {/* Tinted head, carrying the role's colour */}
                            <header
                                className={`flex items-center gap-3 border-b border-rule ${role.tint} px-5 py-4`}
                            >
                                <role.icon
                                    size={22}
                                    className={role.iconClass}
                                    aria-hidden="true"
                                />

                                <div>
                                    <p className="font-serif text-xs text-ink-muted">
                                        {role.titleHindi}
                                    </p>

                                    <h3 className="font-serif text-lg font-bold text-gov-navy">
                                        {role.title}
                                    </h3>
                                </div>
                            </header>

                            {/* flex-1 so the actions align across all three cards */}
                            <div className="flex flex-1 flex-col p-5">

                                <p className="text-sm leading-relaxed text-ink">
                                    {role.summary}
                                </p>

                                <ul className="mt-4 flex-1 space-y-2">
                                    {role.duties.map((duty) => (
                                        <li
                                            key={duty}
                                            className="flex gap-2 text-sm leading-relaxed text-ink-muted"
                                        >
                                            {/* Saffron marker rather than a bullet glyph */}
                                            <span
                                                aria-hidden="true"
                                                className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-saffron"
                                            />

                                            {duty}
                                        </li>
                                    ))}
                                </ul>

                                {role.action ? (
                                    <Link
                                        to={role.action.to}
                                        className="mt-5 inline-flex items-center gap-1.5 self-start rounded-gov border border-gov-blue px-4 py-2 text-sm font-semibold text-gov-blue transition hover:bg-gov-blue/5"
                                    >
                                        {role.action.label}
                                        <ArrowRight size={14} aria-hidden="true" />
                                    </Link>
                                ) : (
                                    <p className="mt-5 border-t border-rule pt-3 text-xs leading-relaxed text-ink-muted">
                                        {role.note}
                                    </p>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
