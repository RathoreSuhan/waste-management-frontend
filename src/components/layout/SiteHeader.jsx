import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Users, Languages } from "lucide-react";

import BiText from "@/components/common/BiText";
import AccountControl from "@/components/layout/AccountControl";
import useLanguage from "@/hooks/useLanguage";
import { LANGUAGES } from "@/constants/languageConstants";
import { UI } from "@/i18n/strings";

/**
 * ============================================================================
 * Site Header
 * ============================================================================
 *
 * Masthead used across the platform:
 *
 *   1. Utility strip  - contact details, language toggle, text resizing,
 *                       and the signed-in account controls
 *   2. Accent rule    - saffron / white / green band
 *   3. Masthead       - emblem and platform name
 *
 * Both layouts render this, which is why the account controls belong here:
 * it is the only place a sign-out button is guaranteed to be on screen.
 *
 * This is an independent community project, so nothing here claims any
 * government department, ministry or scheme. The formal layout is kept
 * because it reads as trustworthy, not because it is official.
 * ============================================================================
 */

export default function SiteHeader() {

    // Text size preference - kept for accessibility, not for appearances
    const [scale, setScale] = useState("md");

    /*
      Interface language. Held in context rather than locally, so pressing
      this button actually re-renders every bilingual label on the page
      instead of only changing this button's own caption.
    */
    const { language, toggleLanguage, isHindi } = useLanguage();

    /*
      Language codes for the two masthead name lines. The platform name is
      rendered as two separate elements rather than through BiText, because
      here they stack vertically with the primary as an <h1> - a heading the
      document outline needs, which an inline gloss cannot provide.
    */
    const primaryLang = isHindi ? LANGUAGES.HI : LANGUAGES.EN;

    const secondaryLang = isHindi ? LANGUAGES.EN : LANGUAGES.HI;

    /**
     * Applies the chosen text size to <html>.
     * All spacing uses rem, so the entire site scales together.
     */
    function applyScale(next) {

        setScale(next);

        const root = document.documentElement;

        // Clear any previously applied scale before adding the new one
        root.classList.remove("text-sm-scale", "text-md-scale", "text-lg-scale");

        root.classList.add(`text-${next}-scale`);
    }

    return (
        <header>
            {/* Lets keyboard users jump straight past the navigation */}
            <a href="#main-content" className="skip-link">
                <BiText {...UI.site.skipToContent} primaryOnly />
            </a>

            {/* ---------------- Utility strip ---------------- */}
            <div className="bg-gov-navy text-white">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs">

                    {/* Contact route - email only, since this is a volunteer run project */}
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Mail size={12} aria-hidden="true" />
                            support@cleanbharat.org
                        </span>

                        <span className="hidden items-center gap-1.5 sm:flex">
                            <Users size={12} aria-hidden="true" />
                            <BiText {...UI.site.communityRun} primaryOnly />
                        </span>
                    </div>

                    <div className="flex items-center gap-4">

                        {/* Text resizing, so low vision users are not forced to zoom */}
                        <div className="flex items-center gap-1">
                            <span className="mr-1 text-white/70">
                                <BiText {...UI.site.textSize} primaryOnly />:
                            </span>

                            {/* Each button maps to a root font-size class */}
                            {[
                                { key: "sm", label: "A-" },
                                { key: "md", label: "A" },
                                { key: "lg", label: "A+" },
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    type="button"
                                    onClick={() => applyScale(option.key)}
                                    aria-label={`Set text size ${option.label}`}
                                    // Current selection is filled in, the rest are outlined
                                    className={`h-5 w-6 border border-white/30 text-[10px] leading-none transition ${scale === option.key
                                        ? "bg-white text-gov-navy"
                                        : "hover:bg-white/15"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/*
                          Language toggle.

                          The caption names the language you would move to,
                          not the one you are in - a button reading "हिन्दी"
                          while already in Hindi gives no clue what pressing
                          it does. aria-label states it as an action, since
                          a bare language name is not one.
                        */}
                        <button
                            type="button"
                            onClick={toggleLanguage}
                            lang={language === LANGUAGES.EN ? LANGUAGES.HI : LANGUAGES.EN}
                            aria-label={
                                language === LANGUAGES.EN
                                    ? "हिन्दी में देखें / View in Hindi"
                                    : "View in English / अंग्रेज़ी में देखें"
                            }
                            className="flex items-center gap-1.5 border border-white/30 px-2 py-0.5 transition hover:bg-white/15"
                        >
                            <Languages size={12} aria-hidden="true" />
                            {language === LANGUAGES.EN ? "हिन्दी" : "English"}
                        </button>

                        {/* Identity and sign out - renders nothing for a visitor */}
                        <AccountControl />
                    </div>
                </div>
            </div>

            {/* Accent divider */}
            <div className="tricolour-rule" />

            {/* ---------------- Masthead ---------------- */}
            <div className="border-b border-rule bg-white">
                <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">

                    {/* Platform mark */}
                    <Link to="/" className="flex items-center gap-4">
                        <PlatformMark />


                        <div>
                            {/*
                              Platform name, twice over. The secondary
                              rendering sits above the primary and steps down
                              in size, so switching language reorders these
                              two lines rather than replacing either.
                            */}
                            <p
                                lang={secondaryLang}
                                className="font-serif text-lg leading-tight font-bold text-gov-navy"
                            >
                                {isHindi ? UI.site.name.en : UI.site.name.hi}
                            </p>

                            <h1
                                lang={primaryLang}
                                className="font-serif text-xl leading-tight font-bold text-gov-navy"
                            >
                                {isHindi ? UI.site.name.hi : UI.site.name.en}
                            </h1>

                            <p className="mt-0.5 text-xs text-ink-muted">
                                <BiText {...UI.site.tagline} primaryOnly />
                                <span className="mx-1.5 text-rule">|</span>
                                <BiText {...UI.site.builtBy} primaryOnly />
                            </p>
                        </div>
                    </Link>

                    {/* Ownership, stated plainly to avoid any official impression */}
                    <div className="ml-auto hidden text-right lg:block">
                        <p className="text-xs tracking-wide text-ink-muted uppercase">
                            <BiText {...UI.site.initiative} primaryOnly />
                        </p>

                        {/*
                          The disclaimer that matters most, so it is the one
                          line shown in both languages at once rather than
                          only in the reader's choice.
                        */}
                        <p className="mt-0.5 text-xs font-semibold text-india-green">
                            <BiText {...UI.site.notGovernment} />
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
}

/**
 * Platform mark.
 *
 * The project logo from public/logo.svg, cropped to a circle.
 *
 * Served from public/ rather than imported, so the 1.4 MB file is fetched
 * once by the browser and cached instead of being inlined into the bundle.
 *
 * The circular crop is doing real work here: the artwork carries a square
 * off-white plate and its viewBox is offset from the origin, so dropping
 * it in unframed would sit off-centre against the white masthead. The
 * fixed-size wrapper with overflow-hidden and object-cover trims the plate
 * and centres the mark.
 *
 * Sized in px rather than rem: the A- / A / A+ controls scale the root
 * font size, and a mark that grew with the text would start to crowd the
 * platform name beside it.
 */
function PlatformMark() {

    return (
        <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-full border border-rule bg-white">
            <img
                src="/logo.svg"
                alt="Clean Bharat logo"
                width="44"
                height="44"
                className="h-full w-full object-cover"
            />
        </span>
    );
}


