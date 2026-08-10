import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

/**
 * ============================================================================
 * Auth Shell
 * ============================================================================
 *
 * The framing shared by the sign-in and registration pages: a photograph
 * across the whole viewport, a navy wash over it, and the form held in a
 * card at the centre.
 *
 * Both pages render outside PublicLayout, so there is no masthead here to
 * anchor the visitor. The shell supplies that anchor itself - the wordmark
 * and a way back to the site - so somebody who lands on /login from a
 * search result is not left on a page with no exit.
 *
 * Props
 *   image       imported background photograph
 *   title       English heading
 *   titleHindi  Devanagari line set above it
 *   subtitle    one line of context under the heading
 *   width       card width, since registration carries a longer form
 *   footer      the "already have an account" line
 * ============================================================================
 */

export default function AuthShell({
    image,
    title,
    titleHindi,
    subtitle,
    width = "max-w-md",
    footer,
    children,
}) {

    return (
        <div className="relative min-h-screen">

            {/*
              The photograph.

              An <img> rather than a CSS background: this is the largest
              paint on the page, and as an element it can be told to load
              eagerly at high priority instead of waiting for the
              stylesheet to be parsed first.

              Decorative, so it is hidden from assistive technology - a
              screen reader gains nothing from "photograph of a park"
              before a sign-in form.
            */}
            <img
                src={image}
                alt=""
                aria-hidden="true"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover"
            />

            {/*
              Navy wash.

              Two jobs: it ties an arbitrary photograph to the portal's
              palette, and it gives the white card a consistently dark
              surround so its edge reads no matter what the photograph is
              doing behind it. Heavier at the foot, where the card sits
              lowest on small screens.
            */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-gov-navy/85 via-gov-navy/75 to-gov-navy/90"
            />

            {/* Card, above both layers */}
            <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">

                {/* Wordmark, doubling as the way back to the public site */}
                <Link
                    to="/"
                    className="mb-5 inline-flex items-center gap-2.5 text-white transition hover:opacity-90"
                >
                    <img
                        src="/clean-bharat-logo-preview.png"
                        alt=""
                        aria-hidden="true"
                        className="h-9 w-9"
                    />

                    <span className="font-serif text-xl font-bold tracking-wide">
                        Clean Bharat
                    </span>
                </Link>

                <div
                    className={`w-full ${width} overflow-hidden rounded-gov border border-white/20 bg-white shadow-2xl`}
                >

                    {/* Header band, as used on the report record */}
                    <header className="bg-gov-navy px-6 py-5 text-center text-white">

                        {/* Devanagari above the English title, as on the landing page */}
                        <p className="font-serif text-sm text-white/70">
                            {titleHindi}
                        </p>

                        <h1 className="mt-0.5 font-serif text-2xl font-bold">
                            {title}
                        </h1>

                        <p className="mt-1.5 text-sm text-white/75">
                            {subtitle}
                        </p>
                    </header>

                    {/* The portal's strongest identifying mark */}
                    <div className="tricolour-rule" />

                    <div className="p-6 lg:p-7">
                        {children}
                    </div>

                    {footer && (
                        <div className="border-t border-rule bg-paper px-6 py-4 text-center text-sm text-ink-muted">
                            {footer}
                        </div>
                    )}
                </div>

                {/* Back to the public site, stated plainly under the card */}
                <Link
                    to="/"
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition hover:text-white hover:underline"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    Back to Home
                </Link>

                {/* Ownership, stated here too rather than only in the footer */}
                <p className="mt-3 max-w-sm text-center text-[11px] leading-relaxed text-white/50">
                    An independent community project. Not run by, affiliated with,
                    or endorsed by any government department.
                </p>
            </div>
        </div>
    );
}
