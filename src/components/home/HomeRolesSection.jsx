import { Link } from "react-router-dom";
import { User, Truck, Landmark, ArrowRight } from "lucide-react";

/**
 * ============================================================================
 * Home Roles Section
 * ============================================================================
 *
 * Who the platform is for, and what each of them does here.
 *
 * The backend models four roles with genuinely different portals behind
 * them, and a visitor choosing on the registration form has no way to
 * know which one they are. Stating it on the landing page is cheaper
 * than an account created under the wrong role, which cannot be changed
 * without an administrator.
 *
 * Three of the four are shown. The municipal corporation is named even
 * though nobody can register as one, because it is not a back-office
 * role: it decides which cleaner is authorised for a site and whether
 * the finished work passes, so a citizen reading the page is owed the
 * fact that a public body - not the platform, and not the AI - takes
 * those decisions. Its card ends in a note instead of a register link.
 *
 * The administrator card was removed from this section deliberately, on
 * different grounds: nobody can sign up as one and it decides nothing
 * about an individual cleanup, so on a page whose job is to route a
 * visitor to the right registration it described a door that does not
 * open. Listing the moderation powers - removing reports, managing
 * accounts - also told every reader what an administrator can do to
 * their report, which is not a landing page's business. The admin portal
 * documents itself to the people who have it.
 *
 * The role itself still exists and still works. Nothing here changes
 * ROLE_ADMIN, its routes, or its permissions - this is presentation only.
 * The definition is kept below rather than deleted, so restoring the card
 * is a matter of putting one entry back in the array.
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
            // Cleanup is awarded by the corporation, not taken - see the proposal workflow
            "Inspect reported sites in your area and submit a cleanup proposal",
            "Carry out the work once the municipal corporation assigns it to you",
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
        icon: Landmark,
        title: "Municipalities",
        titleHindi: "नगर निगम",
        summary:
            "The municipal corporation for a city, and the officers who act for it.",
        duties: [
            "Read the cleanup proposals submitted for a reported site",
            "Authorise one cleaner, ask for a revision, or reject a proposal",
            "Follow the authorised cleanup and its activity log",
            "Sign the finished work off, or send it back for rework",
        ],
        // Municipal accounts are issued to a corporation, never self-registered,
        // so this card ends in a note rather than a register link
        note: "Issued to a city's municipal corporation. Not open for public registration.",
        tint: "bg-saffron-soft",
        iconClass: "text-civic-amber",
    },

    /*
      The administrator card, withdrawn from the public page.

      Kept here so the decision is visible and reversible: restoring it
      means uncommenting this entry, adding Building2 back to the lucide
      import, and taking the grid below to four columns.

          {
              icon: Building2,
              title: "Administrators",
              titleHindi: "प्रशासक",
              summary: "The people keeping the record straight.",
              duties: [
                  "Monitor platform-wide activity",
                  "Manage citizen and cleaner accounts",
                  "Search, filter and remove reports",
                  "Maintain municipal corporation contacts",
              ],
              note: "Granted by an existing administrator. Not open for registration.",
              tint: "bg-plum-soft",
              iconClass: "text-civic-plum",
          },
    */
];


export default function HomeRolesSection() {

    return (
        <section className="border-t border-rule bg-white">
            <div className="mx-auto max-w-7xl px-4 py-12">

                <div className="border-b border-rule pb-3">
                    <h2 className="font-serif text-2xl font-bold text-gov-navy">
                        Who Uses This Platform
                    </h2>

                    <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                    <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                        Three roles, each with its own portal. Choose the one
                        that describes you before registering - municipal
                        accounts are issued by the corporation itself.
                    </p>
                </div>

                {/*
                  Three columns across the page's full measure.

                  These were previously capped at max-w-4xl, on the
                  argument that cards stretched wide would each read
                  as a paragraph floating in space. In place that was the
                  wrong trade: they sat visibly narrower than every
                  other section and read as an afterthought at the foot of
                  the page, which is the opposite of what a section asking
                  people to register should do. The cap is gone and the
                  extra room is absorbed by larger type and heavier
                  interior padding rather than left as blank card.

                  The third column arrives at lg, not md. Three cards in
                  the md band leave about 230px each, which is too narrow
                  for a serif heading and a p-7 duty list - so the md
                  layout is left as the two columns it already was, and
                  the municipal card wraps to its own row there.
                */}
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                    {ROLES.map((role) => (
                        <article
                            key={role.title}
                            className="flex flex-col overflow-hidden rounded-gov border border-rule bg-white transition hover:border-gov-blue/40"
                        >

                            {/* Tinted head, carrying the role's colour */}
                            <header
                                className={`flex items-center gap-4 border-b border-rule ${role.tint} px-7 py-5`}
                            >
                                <role.icon
                                    size={26}
                                    className={role.iconClass}
                                    aria-hidden="true"
                                />

                                <div>
                                    <p className="font-serif text-xs text-ink-muted">
                                        {role.titleHindi}
                                    </p>

                                    <h3 className="font-serif text-xl font-bold text-gov-navy">
                                        {role.title}
                                    </h3>
                                </div>
                            </header>

                            {/* flex-1 so the actions align across the cards */}
                            <div className="flex flex-1 flex-col p-7">

                                <p className="text-base leading-relaxed text-ink">
                                    {role.summary}
                                </p>

                                <ul className="mt-5 flex-1 space-y-2.5">

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
