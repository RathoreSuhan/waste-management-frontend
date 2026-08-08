import { Link } from "react-router-dom";

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
 * ============================================================================
 */

// Link columns, grouped by what the visitor is trying to do
const FOOTER_SECTIONS = [
    {
        heading: "Report Waste",
        links: [
            { label: "File a Report", to: "/citizen/report" },
            { label: "Track My Reports", to: "/citizen/history" },
            { label: "Public Reports", to: "/reports" },
        ],
    },
    {
        heading: "About the Platform",
        links: [
            { label: "About the Project", to: "/" },
            { label: "How It Works", to: "/" },
            { label: "Frequently Asked Questions", to: "/" },
        ],
    },
    {
        heading: "Policies",
        links: [
            { label: "Terms & Conditions", to: "/" },
            { label: "Privacy Policy", to: "/" },
            { label: "Accessibility Statement", to: "/" },
        ],
    },
];

export default function SiteFooter() {

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
                                        <Link
                                            to={link.to}
                                            className="text-xs text-white/75 transition hover:text-white hover:underline"
                                        >
                                            {link.label}
                                        </Link>
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
        </footer>
    );
}
