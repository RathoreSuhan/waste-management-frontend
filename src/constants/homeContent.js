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

/**
 * ----------------------------------------------------------------------------
 * Frequently asked questions
 * ----------------------------------------------------------------------------
 *
 * Four questions closing the landing page, reached directly from the
 * footer's FAQ link at /#faq.
 *
 * Which four, and why these
 * -------------------------
 * A visitor who has read this far has one thing left standing between them
 * and filing a report, and it is nearly always one of these: whether they
 * are allowed to, what will happen next, why the site refused their
 * photograph, or whether it is worth reporting a heap somebody else has
 * already complained about. Questions the page has answered already - what
 * the platform is, why waste matters - are deliberately not repeated; an
 * FAQ that restates the page above it is padding.
 *
 * The same rules the About page follows apply, and two of them bit while
 * writing these:
 *
 * 1. No claims the backend does not implement. Notifications are
 *    conspicuously absent from the second answer: they sit in the README's
 *    Future Enhancements, so the honest answer is that the reader checks
 *    the report, not that the platform will tell them.
 *
 * 2. Nothing asserted that a backend file does not support. The six
 *    reasons in `rejected` are the six values of ImageRejectionReason, in
 *    the enum's own order, rewritten from its `guidance` strings - not a
 *    plausible-sounding list of reasons an image validator might give.
 *
 * On the figures in `duplicate`: 100 metres and 30 days are the shipped
 * defaults of app.duplicate.radius-meters and app.duplicate.max-age-days,
 * which is why the copy hedges with "about" and "roughly". They are
 * configurable per deployment, and ABOUT_SAFEGUARDS quotes the same two
 * numbers - so if those defaults change in application.properties, both
 * files must change together.
 *
 * `id` keys the icon in HomeFaqSection, the same split HomeProcessSection
 * uses for its stages, so the two files can only ever drift loudly.
 */
export const HOME_FAQS = [
    {
        id: "account",
        question: "Do I need an account to use this?",
        answer:
            "Not to read it. Every report, the discussion beneath it, the " +
            "cleaner rankings and the photographs of cleared sites are " +
            "public, and none of them ask you to sign in. An account is " +
            "needed only to take part - to file a report, rate how urgent a " +
            "site is, or comment on one. Watching is free, because a record " +
            "is only worth anything if anybody can check it.",
    },
    {
        id: "after-filing",
        question: "What happens after I file a report?",
        answer:
            "Your photograph is checked, then the report is routed to the " +
            "municipal body for that city, where a cleaner can claim it. " +
            "When they finish they upload a photograph of the cleared site, " +
            "which is compared against your original before the report is " +
            "closed and published. Every one of those changes is visible on " +
            "the report itself, so you can follow it to the end without " +
            "having to ask anybody how it is going.",
    },
    {
        id: "rejected",
        question: "Why was my photograph rejected?",
        answer:
            "Every image is examined before it becomes a report, and it is " +
            "turned away for one of six reasons: no waste could be " +
            "identified in it; there is litter, but too little to warrant a " +
            "municipal cleanup; it is not a real photograph, such as a " +
            "drawing, a screenshot or an AI-generated image; it is too " +
            "blurred or too dark to verify; it clearly shows something that " +
            "is not a waste site; or it could not be judged with enough " +
            "confidence either way. Whichever it was is shown to you at the " +
            "time, so the picture can be retaken and filed again.",
    },
    {
        id: "duplicate",
        question: "Somebody already reported this spot. Should I bother?",
        answer:
            "Yes - and you will not end up creating a second entry for it. " +
            "Before a new report is filed the platform looks for an " +
            "existing one at the same place, within about a hundred metres " +
            "and filed within roughly the last month. If it finds one you " +
            "are taken to that report rather than starting a fresh one, and " +
            "your urgency rating and comments are added to it. That is what " +
            "makes a site rise: one report carrying the weight of everybody " +
            "who has noticed it, instead of four thin records competing.",
    },
];


