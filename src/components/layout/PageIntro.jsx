import PageHeading from "@/components/common/PageHeading";
import useLanguage from "@/hooks/useLanguage";
import useLayoutMode from "@/hooks/useLayoutMode";
import { LANGUAGES } from "@/constants/languageConstants";

/**
 * ============================================================================
 * Page Intro
 * ============================================================================
 *
 * Opening block for the four pages that serve both shells.
 *
 * On the public site it renders the full-bleed navy hero band those pages
 * were designed around. Inside the signed-in shell it renders the same words
 * as an ordinary PageHeading instead.
 *
 * The band cannot simply be carried across. It runs edge to edge because
 * PublicLayout leaves its <main> unconstrained; MainLayout constrains to
 * max-w-7xl, subtracts a 288px sidebar and adds its own padding, so the
 * band would sit as a dark slab inside an already narrow column, with its
 * own max-w-7xl nested inside a max-w-7xl parent. It would also be the only
 * heading in the shell that looked nothing like the rest, and it would push
 * the actual content below the fold on a laptop.
 *
 * Same content either way. Only its presentation changes.
 * ============================================================================
 */

export default function PageIntro({
    // Icon shown beside the title in the band, e.g. TrendingUp
    icon: Icon,

    /*
      Small line above the title on the public band, e.g. "Community
      Engagement Register". Dropped in-app, where the breadcrumb trail
      already says where the reader is and a second label above the
      heading would only repeat it.
    */
    eyebrow,

    // Title in both languages
    en,
    hi,

    // One or two lines explaining what the page lists
    description,

    // Optional controls, e.g. a scope selector
    action,
}) {

    const { inApp } = useLayoutMode();

    const { isHindi } = useLanguage();

    /*
      In-app: the standard heading every other signed-in page uses, so a
      sidebar user sees one consistent treatment across the whole shell.
      PageHeading handles the bilingual pairing itself.
    */
    if (inApp) {
        return (
            <PageHeading
                title={en}
                titleHi={hi}
                subtitle={description}
                action={action}
            />
        );
    }

    // Public: the hero band, which is the front door for these pages
    const primary = isHindi ? (hi || en) : en;

    const secondary = isHindi ? en : hi;

    return (
        <section className="hero-band border-b border-rule text-white">
            <div className="mx-auto max-w-7xl px-4 py-10">

                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        {eyebrow && (
                            <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-white/70 uppercase">
                                {Icon && <Icon size={12} aria-hidden="true" />}
                                {eyebrow}
                            </p>
                        )}

                        <h1 className="flex items-center gap-2.5 font-serif text-3xl font-bold">
                            {/*
                              The icon moves up into the eyebrow when there
                              is one, so it is not printed twice.
                            */}
                            {Icon && !eyebrow && <Icon size={26} aria-hidden="true" />}

                            <span lang={isHindi && hi ? LANGUAGES.HI : LANGUAGES.EN}>
                                {primary}
                            </span>

                            {/*
                              The other language, dimmed against the navy.
                              White at 70% rather than the muted grey used on
                              paper, which would all but disappear here.
                            */}
                            {secondary && secondary !== primary && (
                                <span
                                    lang={isHindi ? LANGUAGES.EN : LANGUAGES.HI}
                                    className="text-xl font-normal text-white/70"
                                >
                                    {secondary}
                                </span>
                            )}
                        </h1>

                        {description && (
                            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                                {description}
                            </p>
                        )}
                    </div>

                    {action}
                </div>
            </div>
        </section>
    );
}
