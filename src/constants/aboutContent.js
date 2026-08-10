/**
 * ============================================================================
 * About Page Content
 * ============================================================================
 *
 * The written material for the About page, kept out of the components so
 * the sections stay layout only - the same split used by
 * environmentContent.js and homeContent.js.
 *
 * Source and editing rules
 * ------------------------
 * This page is a public-facing retelling of the project README. The README
 * is a backend engineering document: roughly two thirds of it is Spring
 * Boot layering, JPA entity diagrams, Maven commands, JaCoCo coverage and
 * an application.properties block containing credential placeholders. None
 * of that belongs on a civic site read by residents, and the config block
 * would be actively unwise to publish.
 *
 * So only the material that answers a visitor's two real questions is
 * carried across:
 *
 *   "What is this?"      - Vision, Problem Statement, Our Solution
 *   "How does it work?"  - the five stages, and the checks around them
 *
 * Three rules were followed, the same ones the Environment page uses:
 *
 * 1. No invented statistics. The platform is new and has no track record
 *    to quote yet; numbers describing adoption or tonnage would be made
 *    up. The only figures here are configured system thresholds, marked
 *    as such below.
 *
 * 2. No claims the backend does not implement. Every capability listed
 *    corresponds to a working module. Items from the README's "Future
 *    Enhancements" - maps, notifications, mobile apps, heat maps - are
 *    deliberately absent; they are plans, not features.
 *
 * 3. No technology names as selling points. A resident does not care that
 *    reports are stored in PostgreSQL. Google Gemini is the one exception,
 *    and it is named because "an AI checks the photograph" invites the
 *    question "whose AI?", which deserves a straight answer.
 * ============================================================================
 */


/**
 * What is actually wrong - the opening section.
 *
 * Taken from the README's Problem Statement, but rewritten from the
 * municipal point of view into the resident's. The README says "citizens
 * often submit duplicate reports for the same garbage location", which is
 * a database problem; what the resident experiences is four neighbours
 * each reporting the same heap and none of them knowing the others did.
 *
 * Ordered so the list builds: nothing gets recorded, what is recorded
 * cannot be trusted, what is trusted cannot be prioritised, and what is
 * done is never seen.
 */
export const ABOUT_PROBLEMS = [
    {
        title: "The same heap, reported four times",
        body:
            "Neighbours complain separately about one pile, and none of " +
            "them can see that the others already did. Four records of one " +
            "problem look like four problems, and the effort spent sorting " +
            "that out is effort not spent clearing anything.",
    },
    {
        title: "No way to tell a real complaint from a careless one",
        body:
            "A photograph of the wrong street, an old picture, or nothing " +
            "recognisable at all costs as much to process as a genuine " +
            "report. Once enough of them accumulate, every report starts " +
            "being treated as though it might be wrong.",
    },
    {
        title: "Nothing to prioritise by",
        body:
            "A blocked drain beside a school and a stray bag on a quiet " +
            "lane arrive looking identical. Without a signal of which " +
            "matters more, the queue is worked in the order it was typed.",
    },
    {
        title: "Completion nobody can check",
        body:
            "A job marked done and a job actually done are the same entry " +
            "in most systems. The only way to tell them apart is to send " +
            "somebody back to look.",
    },
    {
        title: "The reporter never hears the ending",
        body:
            "Having reported something, a resident has no way to find out " +
            "whether it was cleared, by whom, or when. The silence is what " +
            "stops them reporting the next one.",
    },
    {
        title: "The work is invisible",
        body:
            "Sanitation work is noticed when it fails and ignored when it " +
            "succeeds. Nobody clearing waste well has anything to show for " +
            "it afterwards.",
    },
];

/**
 * What the platform is - the approach section.
 *
 * Condensed from the README's Vision and Our Solution, both of which are
 * written for a technical reader and lean on words like "ecosystem" and
 * "leverages". The substance survives; the vocabulary does not.
 */
export const ABOUT_APPROACH = {

    heading: "A record, not a complaint box",

    paragraphs: [
        "Clean Bharat is a public register of neighbourhood waste. A " +
        "resident photographs a site and files it; the platform checks the " +
        "photograph, routes it to the municipal body for that city, and " +
        "keeps it open until somebody clears it and proves they did.",

        "The difference from a complaint form is that nothing here is " +
        "private. The report, the discussion under it, the urgency the " +
        "neighbourhood assigned it and the photograph of the cleared site " +
        "are all readable without an account. A report that is ignored " +
        "stays visible, and so does one that is answered.",

        "Two points in that sequence are checked by Google Gemini rather " +
        "than taken on trust - once when the waste is reported, once when " +
        "it is claimed to be gone. Those two checks are what make the rest " +
        "of the record worth reading.",
    ],
};

/**
 * The checks that sit around the five stages.
 *
 * This is the part of the README worth keeping in detail, because it is
 * the answer to "why should I believe any of this?". The flowcharts and
 * algorithm names are dropped; what each check actually rules out is kept.
 *
 * On the numbers in `duplicates`: 100 metres and 30 days are the shipped
 * defaults of app.duplicate.radius-meters and app.duplicate.max-age-days.
 * They are configurable per deployment, so the copy says "about" and
 * "roughly" rather than stating them as fixed law. If those defaults are
 * ever changed in application.properties, this text must change with them.
 */
export const ABOUT_SAFEGUARDS = [
    {
        id: "validation",
        title: "The photograph is checked before the report is accepted",
        body:
            "Every uploaded image is examined before it becomes a report. " +
            "The check looks for waste actually being present, for the " +
            "picture being clear enough to act on, and for signs the image " +
            "was generated rather than taken. A report that fails is " +
            "refused at the point of filing, with the reason given, rather " +
            "than being accepted and quietly discarded later.",
        ai: true,
    },
    {
        id: "duplicates",
        title: "One site, one report",
        body:
            "Before a new report is created, the platform looks for an " +
            "existing one at the same place - within about a hundred " +
            "metres, filed within roughly the last month. If it finds one, " +
            "it sends the reporter to that report instead of creating a " +
            "second. Their weight goes on the record that already exists, " +
            "which is what makes it rise.",
        ai: false,
    },
    {
        id: "verification",
        title: "The cleanup is checked before it counts",
        body:
            "A cleaner finishing a site uploads a photograph of it cleared. " +
            "That image is compared against the original: same location, " +
            "same surroundings, waste actually gone. A picture of a " +
            "different clean street does not pass. Only after it does are " +
            "points credited and the report closed.",
        ai: true,
    },
    {
        id: "priority",
        title: "The neighbourhood decides what is urgent",
        body:
            "Residents rate how urgent a site is and discuss it underneath. " +
            "Those ratings and that discussion combine into a single score " +
            "the report list can be ordered by, so what rises is what the " +
            "people living beside it say matters - not what was filed most " +
            "recently.",
        ai: false,
    },
];

/**
 * What the platform can actually do - the capabilities section.
 *
 * Drawn from the README's Core Features table, with the rows that describe
 * infrastructure rather than capability removed: authentication, cloud
 * storage and the admin portal are all real, but none of them is a reason
 * for a resident to use the site. What remains is phrased as something the
 * reader can do, not as a module that exists.
 *
 * `id` keys the icon in the component, so the two files can only ever
 * drift loudly.
 */
export const ABOUT_CAPABILITIES = [
    {
        id: "report",
        title: "Report a site",
        body:
            "A photograph and a location, taken where you are standing. " +
            "The address, city and pincode are recorded with it so the " +
            "report reaches the right municipal body.",
    },
    {
        id: "track",
        title: "Follow it to the end",
        body:
            "Every report keeps its status in the open - filed, assigned, " +
            "in progress, resolved - and the person who filed it can see " +
            "each change without asking anybody.",
    },
    {
        id: "rate",
        title: "Say how urgent it is",
        body:
            "Any signed-in resident can rate a site from one to five " +
            "stars. The ratings average into an urgency score carried on " +
            "the report itself.",
    },
    {
        id: "discuss",
        title: "Discuss it with neighbours",
        body:
            "Threaded comments under every report, so context that would " +
            "never fit in the original description - the hours it is worst, " +
            "who else has tried - stays attached to the site it concerns.",
    },
    {
        id: "claim",
        title: "Claim and clear",
        body:
            "Cleaners see unclaimed sites in their area, take one, and " +
            "close it by uploading proof. Nobody is assigned work they did " +
            "not accept.",
    },
    {
        id: "recognise",
        title: "Be credited for the work",
        body:
            "Verified cleanups earn points and a place on the city, state " +
            "and national rankings, with a full history of what was earned " +
            "for which site.",
    },
    {
        id: "public",
        title: "Read the whole record",
        body:
            "Reports, rankings and completed cleanups are all readable " +
            "without an account. Taking part needs one; watching does not.",
    },
];

/**
 * Closing line.
 *
 * The README's own closing quotation, which is the creator's sentence
 * about the project rather than a borrowed aphorism - so unlike the
 * Environment page's quotes, its attribution is not in question.
 */
export const ABOUT_QUOTE = {
    text:
        "Technology becomes meaningful when it solves real-world problems. " +
        "Clean Bharat is a step toward leveraging Artificial Intelligence " +
        "to build cleaner, smarter, and more connected communities.",
    attribution: "Suhan Kumar Singh, creator of Clean Bharat",
};
