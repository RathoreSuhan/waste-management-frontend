/**
 * ============================================================================
 * Home Page Content
 * ============================================================================
 *
 * The written material for the landing page, kept out of the components for
 * the same reason environmentContent.js exists: the sections stay layout
 * only, and the wording can be revised - or translated - without touching
 * any JSX.
 *
 * Two rules were followed, as on the Environment page:
 *
 * 1. Nothing is invented. The process below is the pipeline the backend
 *    actually runs, in the order it runs it, taken from the request flow
 *    documented in the server's README. A landing page that describes a
 *    process the software does not perform is a promise the platform
 *    cannot keep.
 *
 * 2. Quotations are attributed as honestly as their provenance allows.
 *    Where a line is popularly assigned to someone but not verifiably
 *    theirs, it says so rather than asserting it.
 * ============================================================================
 */

/**
 * How a report travels through the platform, from upload to leaderboard.
 *
 * The backend runs fourteen discrete steps. Naming all fourteen on a
 * landing page was tried and abandoned: a visitor deciding whether to
 * report a pile of rubbish does not need to know that the image is held
 * on managed storage, and a wall of that detail buries the two facts
 * that actually distinguish this platform from a complaint box.
 *
 * So this is the summary - five stage names, nothing else. Each one is
 * the milestone a citizen would recognise, in the order it happens. The
 * underlying steps still run; they are simply not the landing page's
 * business. Anyone who wants the detail can follow a report through the
 * public record, which is linked at the foot of the section.
 *
 * `ai` marks the two points where Google Gemini looks at a photograph:
 * once to confirm the reported waste is real, once to confirm it is
 * gone. Those two checks are the reason the record can be trusted, so
 * they stay marked even in a summary this short.
 *
 * `icon` is deliberately absent. Icons are components, not content, and
 * resolving them here would drag lucide-react into a constants file.
 * HomeProcessSection maps them by `id`.
 */
export const HOME_PROCESS_STAGES = [
    {
        id: "filed",
        title: "Report Filed",
        caption: "A citizen photographs the site",
    },
    {
        id: "validated",
        title: "AI Image Validation",
        caption: "Gemini confirms the waste is real",
        ai: true,
    },
    {
        id: "assigned",
        title: "Assignment Created",
        caption: "Routed to the municipal body, claimed by a cleaner",
    },
    {
        id: "verified",
        title: "Cleanup Verified",
        caption: "Before and after photographs compared",
        ai: true,
    },
    {
        id: "rewarded",
        title: "Reward Awarded",
        caption: "Points credited, report closed and published",
    },
];


/**
 * Quotations for the photographic band on the landing page.
 *
 * Provenance, since it matters more than the wording:
 *
 * - The Gandhi line is from his public writing on sanitation in the 1920s
 *   and is quoted in that form throughout Indian civic material. It is
 *   attributed to him plainly.
 * - Wendell Berry's line comes from his essays on land and farming.
 * - Annie Leonard's is from The Story of Stuff, and is the most exact
 *   description of the problem this platform exists to record.
 *
 * The two quotations used on the Environment page are deliberately not
 * repeated here. A visitor who reads both pages should not be handed the
 * same two lines twice.
 */
export const HOME_QUOTES = [
    {
        text: "Sanitation is more important than independence.",
        attribution: "Mahatma Gandhi",
    },
    {
        text: "The earth is what we all have in common.",
        attribution: "Wendell Berry",
    },
    {
        text:
            "There is no such thing as away. When we throw anything away, " +
            "it must go somewhere.",
        attribution: "Annie Leonard",
    },
];

/**
 * The heading copy for that band, kept beside the quotations it introduces.
 *
 * Devanagari sits above the English line, the same order the hero uses.
 */
export const HOME_QUOTE_BAND = {
    eyebrow: "Why This Matters",
    hi: "स्वच्छ भारत, स्वस्थ भारत",
    en: "A Clean Street Is Not Somebody Else's Job",
    body:
        "Every pile of waste on a roadside was walked past by hundreds of " +
        "people before somebody reported it. This is the record of the ones " +
        "who stopped.",
};

/**
 * ----------------------------------------------------------------------------
 * Closing invitation band
 * ----------------------------------------------------------------------------
 *
 * Copy for the photograph that sits between the leaderboard and the roles
 * section, carrying hp2.jpg.
 *
 * This is the second and last quotation band on the page, and it is doing a
 * different job from the first. HOME_QUOTE_BAND opens the argument - why a
 * roadside pile is anybody's business. This one closes it, immediately
 * before the reader is asked which role they are, so the copy is addressed
 * to them in the second person rather than stated as a general truth.
 *
 * `pledge` is the promise a visitor is being invited to make; the three
 * `marks` are what making it actually costs, kept to a handful of words
 * each because they sit in a row beneath the pledge rather than as prose.
 */
export const HOME_PLEDGE_BAND = {
    eyebrow: "Your Turn",
    hi: "बदलाव आपसे शुरू होता है",
    en: "Change Begins With The One Who Notices",
    quote:
        "We won't have a society if we destroy the environment.",
    attribution: "Margaret Mead",
    pledge:
        "You do not need a budget, a department or a title to start. You " +
        "need a photograph of something that should not be there, and the " +
        "willingness to say so.",
    marks: [
        { label: "One photograph", caption: "Taken where you stand" },
        { label: "One minute", caption: "To file it on the record" },
        { label: "One less site", caption: "Once a cleaner claims it" },
    ],
};


