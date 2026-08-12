import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";
import { useAuthContext } from "@/hooks/useAuthContext";

/**
 * ============================================================================
 * Site Footer
 * ============================================================================
 *
 * Dense, link-heavy footer closing every page, followed by the ownership
 * and disclaimer strip.
 *
 * The disclaimer is the important part: the layout and colours here look
 * official, so the footer states outright that this platform is private and
 * unaffiliated. Looking trustworthy must not shade into looking government.
 *
 * Two of these links point into citizen-only territory, so this component
 * reads auth state - see the note on `citizenOnly` below for why a footer
 * needs to know who is looking at it.
 * ============================================================================
 */

/*
  Link columns, grouped by what the visitor is trying to do.

  `citizenOnly` marks a destination behind RoleRoute allowedRole
  ="ROLE_CITIZEN". Those entries render as buttons rather than links,
  because a plain <Link> to them is a trap:

    - a guest is bounced to /login by ProtectedRoute with no explanation
    - a cleaner or admin is silently redirected to their own dashboard
      by RoleRoute, which reads as a broken link

  Neither is wrong about access - the guard holds either way - but both
  leave the reader with no idea what happened. PublicNav already solved
  this for its File a Report button by asking LoginRequiredDialog to
  explain first; the footer now uses the same dialog rather than a
  second, differently-worded answer to the same question.
*/
const FOOTER_SECTIONS = [
    {
        heading: "Report Waste",
        links: [
            {
                label: "File a Report",
                to: "/citizen/report",
                citizenOnly: true,
                // Phrased to complete "You need an account to ..."
                action: "file a waste report",
            },
            {
                label: "Track My Reports",
                to: "/citizen/history",
                citizenOnly: true,
                action: "track your reports",
            },
            { label: "Public Reports", to: "/reports" },
        ],
    },
    {
        heading: "About the Platform",
        links: [
            { label: "About the Project", to: "/about" },

            /*
              Same page, further down. How It Works is the five-stage
              rail inside the About page rather than a page of its own -
              it is the answer to "what is this", not a separate subject,
              and alone it would be a heading and a diagram.
            */
            { label: "How It Works", to: "/about#how-it-works" },

            /*
              The FAQ closes the landing page rather than occupying one
              of its own - four questions do not make a page, and the
              answers are most useful to somebody still reading about
              the platform. ScrollManager takes the reader to the
              section itself.
            */
            { label: "Frequently Asked Questions", to: "/#faq" },
        ],
    },
    {
        heading: "Policies",
        links: [
            /*
              All three resolve to one Policies page rather than three
              routes - one subject, three short documents, and a reader
              checking one usually wants a look at its neighbour. Kept as
              three separate links because that is how somebody scans a
              footer for the one they want.
            */

            /*
              No #terms on this one, deliberately.

              Terms is the first document on the page, so the anchor was
              doing nothing but skipping the heading and the contents
              strip to land on a section that already sat just below
              them - the reader arrived mid-page having missed both.
              Without a hash, ScrollManager applies its ordinary forward
              rule and opens the page at the top, where the terms are
              the first thing read anyway.
            */
            { label: "Terms & Conditions", to: "/policies" },

            // These two sit further down, so the anchor is doing real work
            { label: "Privacy Policy", to: "/policies#privacy" },
            { label: "Accessibility Statement", to: "/policies#accessibility" },
        ],
    },
];

export default function SiteFooter() {

    const { user } = useAuthContext();
    const navigate = useNavigate();

    /*
      The citizen-only link currently being explained, or null when
      nothing is being asked. Holds the link itself so the dialog can
      name the action and return the reader to the right place.
    */
    const [prompt, setPrompt] = useState(null);

    /**
     * Follow a citizen-only footer link, if the reader may.
     *
     * Same three-way decision PublicNav makes: no account, wrong role,
     * or through.
     */
    function handleGuardedLink(link) {

        // No account yet - invite them to sign in, remembering the destination
        if (!user) {
            setPrompt({ ...link, citizenOnly: false });
            return;
        }

        // Signed in, but reporting and report history belong to citizens
        if (user.role !== "ROLE_CITIZEN") {
            setPrompt({ ...link, citizenOnly: true });
            return;
        }

        navigate(link.to);
    }

    return (
        <footer className="mt-auto">

            {/* Accent divider separates content from the footer */}
            <div className="tricolour-rule" />

            {/* ---------------- Link columns ---------------- */}
            <div className="bg-gov-navy text-white">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Platform identity */}
                    <div>
                        <p className="font-serif text-base font-bold">
                            स्वच्छ भारत
                        </p>

                        <p className="font-serif text-base font-bold">
                            Clean Bharat
                        </p>

                        <p className="mt-2 text-xs leading-relaxed text-white/65">
                            A community platform for reporting neighbourhood waste
                            problems and getting them cleared by local cleanup teams.
                        </p>
                    </div>

                    {/* Grouped navigation links */}
                    {FOOTER_SECTIONS.map((section) => (
                        <div key={section.heading}>
                            <h2 className="text-[11px] font-semibold tracking-[0.15em] text-saffron uppercase">
                                {section.heading}
                            </h2>

                            <ul className="mt-3 space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        {link.citizenOnly ? (
                                            /*
                                              A button, not a link. It may
                                              not navigate at all, and
                                              dressing something that opens
                                              a dialog as a hyperlink
                                              promises a page it might not
                                              deliver. Styled identically
                                              to its neighbours so the
                                              column still reads as a list.
                                            */
                                            <button
                                                type="button"
                                                onClick={() => handleGuardedLink(link)}
                                                className="text-left text-xs text-white/75 transition hover:text-white hover:underline"
                                            >
                                                {link.label}
                                            </button>
                                        ) : (
                                            <Link
                                                to={link.to}
                                                className="text-xs text-white/75 transition hover:text-white hover:underline"
                                            >
                                                {link.label}
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* ---------------- Ownership strip ---------------- */}
            <div className="bg-[#071f39] text-white/60">
                <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-[11px] sm:flex-row sm:items-center sm:justify-between">

                    {/* Stated plainly, so nobody mistakes this for an official portal */}
                    <p>
                        An independent, privately built civic platform. Not affiliated
                        with, nor endorsed by, any government body.
                    </p>

                    {/* Build stamp - generated at render time, not hardcoded */}
                    <p>
                        Last updated:{" "}
                        {new Date().toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>

            {/*
              Raised when the reader cannot follow a citizen-only link.

              redirectTo is the link's own destination, so signing in from
              here lands on the page they asked for rather than back at
              the bottom of whatever page they happened to be reading.
            */}
            <LoginRequiredDialog
                open={Boolean(prompt)}
                onClose={() => setPrompt(null)}
                action={prompt?.action}
                citizenOnly={prompt?.citizenOnly}
                currentRole={user?.role}
                redirectTo={prompt?.to}
            />
        </footer>
    );
}
