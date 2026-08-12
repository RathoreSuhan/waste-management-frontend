/**
 * ============================================================================
 * Policies Page Content
 * ============================================================================
 *
 * The three documents linked from the footer's Policies column - Terms &
 * Conditions, Privacy Policy and Accessibility Statement - kept out of the
 * components so the sections stay layout only. Same split as
 * aboutContent.js and environmentContent.js.
 *
 * Why these are one page
 * ---------------------
 * They are one subject: the terms on which this record is published and
 * read. Each is short, and somebody checking one usually wants a look at
 * its neighbour. So they are three anchored documents on /policies rather
 * than three routes, the same way How It Works lives at /about#how-it-works.
 *
 * Sourcing rules
 * --------------
 * These are legal documents, which means the ordinary rule of this project -
 * never describe a capability the backend does not have - matters more here
 * than anywhere else. A privacy policy that overstates what is collected is
 * not merely inaccurate, it is a misrepresentation. Every factual claim
 * below was checked against the code:
 *
 *   - Account fields are the columns of entity/User.java: name, email,
 *     bcrypt-hashed password, role, state, city, and for cleaners the
 *     cleaner type, organisation name and reward points.
 *
 *   - Report fields are those listed in the README's Garbage Report
 *     Management section: title, description, image, latitude, longitude,
 *     address, landmark, city, state, pincode, status, urgency score,
 *     engagement score.
 *
 *   - Location is read from the browser's Geolocation API - see
 *     hooks/useGeoLocation.js, which calls
 *     navigator.geolocation.getCurrentPosition. It is NOT read out of the
 *     photograph. There is no EXIF parsing anywhere in the backend: a
 *     search for exif/metadata/ImageMetadata across the Java sources
 *     returns nothing, and no metadata-extraction dependency is declared.
 *     The clause on photograph metadata says exactly that, because
 *     claiming to extract EXIF when nothing does would be a false
 *     statement of processing - and claiming to strip it, when nothing
 *     does either, would be a false assurance. Both are avoided.
 *
 *   - Browser storage is the complete set of keys written by this app:
 *     "token" and "user" (context/AuthContext.jsx), the language
 *     preference (context/LanguageContext.jsx) and the per-account vote
 *     and comment records (utils/myVotes.js, utils/myComments.js). All
 *     localStorage; the app sets no cookies of its own.
 *
 *   - Email is deliberately described as not shown publicly. The DTOs that
 *     reach unauthenticated readers - PublicFeedResponse,
 *     CommentResponse, LeaderboardEntryResponse, CleanupAssignmentResponse
 *     - carry a display name only. The email field appears in
 *     AuthResponse (returned to the account holder) and in
 *     admin/UserSummaryResponse and admin/UserDetailsResponse, both behind
 *     ROLE_ADMIN. If a public DTO is ever given an email field, clause 7
 *     of the privacy policy must change with it.
 *
 *   - The absence of self-service account deletion is stated plainly.
 *     Deletion exists in service/deletion/UserDeletionServiceImpl.java but
 *     is reached through the admin portal, so the honest answer is "ask
 *     us", not "press this button".
 *
 * The statutory framing - Section 79 of the Information Technology Act,
 * 2000, the IT (Intermediary Guidelines and Digital Media Ethics Code)
 * Rules, 2021, the Copyright Act, 1957 and the Trade Marks Act, 1999 -
 * follows the instructions given for this task.
 *
 * This is not legal advice, and nothing here has been reviewed by a
 * lawyer. It is a good-faith, accurate description of how the platform
 * behaves, written to the shape Indian law expects.
 * ============================================================================
 */


/*
  The one value that must be edited before this page is published.

  A grievance officer whose address does not receive mail is worse than
  none at all: the IT Rules, 2021 expect a working channel, and a takedown
  notice sent into a void is still a notice served. Kept as a single
  constant so it is a one-line change rather than a hunt through prose.
*/
export const GRIEVANCE_OFFICER = {
    name: "Suhan Kumar Singh",
    role: "Grievance Officer",

    // TODO: replace with a monitored address before this page goes live.
    email: "grievance@cleanbharat.example",

    /*
      The window the IT Rules, 2021 expect for acting on a valid
      complaint. Stated so a complainant knows what to hold us to.
    */
    acknowledgeWithin: "36 hours",
    resolveWithin: "15 days",
};

/*
  When these documents were last gone through.

  Hardcoded, unlike the footer's build stamp which is generated at render
  time. A policy that reprints today's date every day is claiming a review
  that never happened. This changes when the wording changes.
*/
export const POLICY_LAST_REVIEWED = "11 August 2026";

/**
 * The three documents, in the order the footer lists them.
 *
 * `id` is the anchor the footer links to and the key for the icon in the
 * page component, so the two files can only ever drift loudly.
 *
 * Each clause is a heading and a body. They are numbered by the component
 * rather than in the text, so inserting one does not mean renumbering the
 * rest - and a reader can still cite "Terms, clause 4".
 */
export const POLICY_DOCUMENTS = [

    /* ==================================================================
       1. Terms & Conditions
       ================================================================== */
    {
        id: "terms",
        eyebrow: "Terms of Use",
        title: "Terms & Conditions",
        hi: "नियम एवं शर्तें",

        summary:
            "The terms on which you may use this platform, what happens to " +
            "what you file, and the limits of what it promises.",

        intro:
            "By creating an account, filing a report, or reading this " +
            "record, you accept the terms below. If you do not accept " +
            "them, please do not use the platform.",

        clauses: [
            {
                heading: "This is an independent platform, not a government service",
                body:
                    "Clean Bharat is an independent, privately built civic " +
                    "project. It is not run by, affiliated with, funded by, " +
                    "or endorsed by any government department, municipal " +
                    "body or statutory authority. Filing a report here is " +
                    "not the same as filing a complaint with your municipal " +
                    "corporation, and it does not begin, replace or affect " +
                    "any statutory process or legal remedy available to you.",
            },
            {
                heading: "Official names are used descriptively only",
                body:
                    "Any reference to an official programme - including the " +
                    "Swachh Bharat Mission (स्वच्छ भारत अभियान) - or to a " +
                    "municipal body, department or public campaign is " +
                    "strictly descriptive, made to identify a locality, the " +
                    "department a report concerns, or the wider effort this " +
                    "platform sits alongside. Such use is nominative fair " +
                    "use. All official names, logos, emblems and marks " +
                    "remain the property of their respective statutory " +
                    "owners, and their appearance here implies no " +
                    "endorsement, partnership or sponsorship of any kind.",
            },
            {
                heading: "Accounts, and what each role may do",
                body:
                    "Reading the record needs no account. Taking part - " +
                    "filing a report, rating urgency, commenting, claiming " +
                    "cleanup work - requires one, and the role attached to " +
                    "your account determines what you may do. Give accurate " +
                    "registration details, keep your password to yourself, " +
                    "and do not use somebody else's account. You are " +
                    "responsible for what is done through yours.",
            },
            {
                heading: "Your content stays yours, and you licence it to us",
                body:
                    "You keep copyright in the photographs, descriptions " +
                    "and comments you upload. By uploading them you grant " +
                    "us a non-exclusive, royalty-free, worldwide, " +
                    "perpetual and transferable licence to host, reproduce, " +
                    "publicly display, adapt and distribute that material " +
                    "solely for verification, public display, automated " +
                    "classification and community transparency on this " +
                    "platform. You confirm that you hold the rights needed " +
                    "to grant that licence, and that what you upload " +
                    "infringes nobody's intellectual property, privacy or " +
                    "other rights.",
            },
            {
                heading: "Report honestly, and photograph the waste itself",
                body:
                    "Upload a photograph you took of the site you are " +
                    "reporting, showing the waste as it is. Every image is " +
                    "examined before the report is accepted, and one that " +
                    "shows no waste, is too unclear to act on, or appears " +
                    "to have been generated rather than taken is refused at " +
                    "the point of filing, with the reason given. Do not " +
                    "photograph people in a way that identifies them, and " +
                    "do not upload anything unlawful, abusive, obscene or " +
                    "misleading.",
            },
            {
                heading: "One site, one report",
                body:
                    "Before a report is created, the platform looks for an " +
                    "existing one at the same place - within roughly a " +
                    "hundred metres, filed within about the last month. If " +
                    "it finds one, you are taken to that report to add your " +
                    "weight to it instead of creating a second. Attempting " +
                    "to work around this to inflate a site's apparent " +
                    "urgency is a misuse of the platform.",
            },
            {
                heading: "Everything you file is public, and stays on the record",
                body:
                    "This is a public register, not a complaint box. Your " +
                    "report, its photograph, the location and address you " +
                    "gave, its status, the urgency the neighbourhood " +
                    "assigned it, the discussion under it and your display " +
                    "name are all readable by anyone, without an account. " +
                    "A completed cleanup is published with its before and " +
                    "after photographs, the name of the cleaner and the " +
                    "municipal body concerned. Do not file anything you are " +
                    "not willing to see published.",
            },
            {
                heading: "No promise that anything will be cleared",
                body:
                    "The platform records reports, routes them to the " +
                    "municipal body for that city, and publishes what " +
                    "happens. It does not employ sanitation staff, operate " +
                    "vehicles, or control any cleanup crew, and it gives no " +
                    "guarantee that a reported site will be cleared, or " +
                    "cleared within any period. Cleaners choose the work " +
                    "they claim; nobody is assigned a task they did not " +
                    "accept.",
            },
            {
                heading: "Reward points are recognition, not money",
                body:
                    "Points credited to a cleaner for a verified cleanup, " +
                    "and any badge or leaderboard position that follows " +
                    "from them, exist to recognise work publicly. They " +
                    "carry no monetary value, are not wages or " +
                    "consideration, cannot be redeemed, transferred or " +
                    "exchanged, and may be adjusted where a cleanup is " +
                    "later found not to have happened.",
            },
            {
                heading: "We host what users submit - our status as an intermediary",
                body:
                    "In accordance with Section 79 of the Information " +
                    "Technology Act, 2000 and the Information Technology " +
                    "(Intermediary Guidelines and Digital Media Ethics " +
                    "Code) Rules, 2021, this platform operates as an " +
                    "intermediary hosting content submitted by its users. " +
                    "We do not claim ownership of user-submitted " +
                    "photographs or comments, and we do not initiate, " +
                    "select or modify the substance of what is filed. " +
                    "Responsibility for a submission rests with the person " +
                    "who made it.",
            },
            {
                heading: "Notice and takedown",
                body:
                    "If you own a copyright or trademark and believe " +
                    "material here infringes it, or if content concerning " +
                    "you is unlawful, write to the Grievance Officer named " +
                    "at the end of this page with: identification of the " +
                    "work or right concerned; the exact address of the " +
                    "material complained of; your contact details; and a " +
                    "statement of your good-faith belief that the use is " +
                    "unauthorised. A valid complaint is acknowledged within " +
                    "the period stated below, and material found to be " +
                    "infringing or unlawful is removed or disabled " +
                    "promptly.",
            },
            {
                heading: "Third-party technology, and their trademarks",
                body:
                    "Automated image checking on this platform uses " +
                    "third-party services, including Google Gemini for " +
                    "examining photographs and Cloudinary for storing and " +
                    "delivering them. \"Google\" and \"Gemini\" are " +
                    "trademarks of Google LLC and \"Cloudinary\" is a " +
                    "trademark of Cloudinary Ltd. They are named here to " +
                    "explain honestly how the platform works and where " +
                    "your material goes, not as an endorsement by, " +
                    "sponsorship of, or affiliation with those companies.",
            },
            {
                heading: "Suspension and removal",
                body:
                    "An account may be suspended or removed, and a report " +
                    "or comment taken down, where these terms have been " +
                    "broken - repeated false reporting, fabricated cleanup " +
                    "proof, abuse of another user, or any unlawful use. " +
                    "Where a report is removed after discussion has formed " +
                    "under it, that discussion goes with it.",
            },
            {
                heading: "Limits of our liability",
                body:
                    "The platform is provided as it stands, without any " +
                    "warranty that it will be uninterrupted, error-free, or " +
                    "that its automated checks will be correct in every " +
                    "case. To the extent permitted by law, we are not " +
                    "liable for indirect or consequential loss arising from " +
                    "use of the platform, from reliance on anything " +
                    "published here, or from a report not being acted on. " +
                    "Nothing in these terms limits a liability that cannot " +
                    "lawfully be limited.",
            },
            {
                heading: "Governing law",
                body:
                    "These terms are governed by the laws of India, and " +
                    "disputes arising from them are subject to the " +
                    "jurisdiction of the competent courts in India.",
            },
            {
                heading: "Changes to these terms",
                body:
                    "These terms may be revised as the platform changes. " +
                    "The review date shown with this document is the date " +
                    "of the wording you are reading. Continuing to use the " +
                    "platform after a revision means you accept it.",
            },
        ],

        /*
          The honest limit, in the same spirit as the closing note on
          AboutSafeguardsSection. A terms page that reads as though it
          were drafted by counsel, when it was not, misleads about its
          own standing.
        */
        note:
            "These documents are written in plain language by the people " +
            "who built the platform, and describe how it actually behaves. " +
            "They have not been drafted or reviewed by a legal " +
            "practitioner, and are not legal advice.",
    },

    /* ==================================================================
       2. Privacy Policy
       ================================================================== */
    {
        id: "privacy",
        eyebrow: "Your Data",
        title: "Privacy Policy",
        hi: "गोपनीयता नीति",

        summary:
            "Exactly what is collected, what is published, who else sees " +
            "it, and what is kept in your browser.",

        intro:
            "This platform is a public register, so a great deal of what " +
            "it holds is meant to be read by anyone. That makes it more " +
            "important, not less, to be precise about which parts those " +
            "are. Everything below describes the platform as it is built " +
            "today.",

        clauses: [
            {
                heading: "Who is responsible for this data",
                body:
                    "Clean Bharat is an independent project, not a " +
                    "government body or registered company. Questions " +
                    "about your data, and requests concerning it, go to " +
                    "the Grievance Officer named at the end of this page.",
            },
            {
                heading: "What you give us when you register",
                body:
                    "An account holds your name, your email address, your " +
                    "password, your role, and the state and city you " +
                    "selected. A cleaner account additionally holds the " +
                    "cleaner category, an organisation name where given, " +
                    "and the reward points earned. Your password is stored " +
                    "only as a bcrypt hash - it is not stored in a form " +
                    "anybody, including us, can read.",
            },
            {
                heading: "What a report holds",
                body:
                    "A report holds the title and description you wrote, " +
                    "the photograph you uploaded, the latitude and " +
                    "longitude of the site, the address, landmark, city, " +
                    "state and pincode, the account that filed it, the " +
                    "time it was filed, its status, and the urgency and " +
                    "engagement scores the community produces. A cleanup " +
                    "additionally holds the cleaner who claimed it, the " +
                    "photograph they uploaded, and the times they started " +
                    "and finished.",
            },
            {
                heading: "Where the location comes from",
                body:
                    "Coordinates are read from your device through your " +
                    "browser's location permission at the moment you file " +
                    "a report, and only if you allow it. They are not " +
                    "extracted from the photograph. The platform does not " +
                    "read metadata embedded in your images, and equally " +
                    "does not remove it: a photograph is stored and served " +
                    "as you uploaded it, so if your camera wrote " +
                    "coordinates or a timestamp into the file, those " +
                    "remain inside the file that is published. If that " +
                    "matters to you, strip the metadata before uploading. " +
                    "By filing a report you consent to the location of the " +
                    "reported site being displayed publicly.",
            },
            {
                heading: "Where your photographs are stored",
                body:
                    "Images are not kept on our own server or in our " +
                    "database. They are uploaded to Cloudinary, which " +
                    "stores them and serves them from its content delivery " +
                    "network; the database holds only the resulting " +
                    "address. Anyone holding that address can view the " +
                    "image, whether or not they came through this site.",
            },
            {
                heading: "What the AI receives",
                body:
                    "To check a report, and again to verify a cleanup, the " +
                    "photographs concerned are sent to Google Gemini and " +
                    "examined there. For a cleanup check both the original " +
                    "and the after photograph are sent together, so they " +
                    "can be compared. The images are what is sent - not " +
                    "your name, email or account details. That processing " +
                    "happens on Google's infrastructure and is subject to " +
                    "Google's own terms.",
            },
            {
                heading: "What is public, and what is not",
                body:
                    "Public, readable without an account: reports and their " +
                    "photographs, locations and addresses, statuses, " +
                    "urgency and engagement scores, comments and replies, " +
                    "completed cleanups with their before and after " +
                    "photographs, and the display names of the people who " +
                    "filed, commented on or cleared a site - including on " +
                    "the city, state and national leaderboards. Not " +
                    "public: your email address, your password hash, and " +
                    "your exact rating on a particular report, which is " +
                    "counted into an average rather than shown beside your " +
                    "name. Your email is visible to you, and to " +
                    "administrators through the admin portal.",
            },
            {
                heading: "What is kept in your browser",
                body:
                    "Signing in stores two items in your browser's local " +
                    "storage: the session token that authenticates your " +
                    "requests, and the name, role and email of your " +
                    "account so the interface can greet you without asking " +
                    "the server again. Your language choice is stored the " +
                    "same way, as is a record of which reports you have " +
                    "rated or commented on, kept per account so those " +
                    "controls show the right state when you return. All of " +
                    "it is local storage rather than cookies, all of it " +
                    "stays on your device, and signing out removes the " +
                    "session items. Clearing your browser data removes the " +
                    "rest.",
            },
            {
                heading: "No advertising, analytics or tracking",
                body:
                    "The platform sets no advertising or analytics " +
                    "cookies, embeds no third-party trackers, builds no " +
                    "profile of your browsing, and sells or rents your " +
                    "data to nobody. View and like counts on a published " +
                    "cleanup are counts against that cleanup, not a record " +
                    "of who looked at it.",
            },
            {
                heading: "How long it is kept",
                body:
                    "Because this is a public record, reports and cleanups " +
                    "are kept indefinitely - a register that quietly " +
                    "deleted its own history would not be worth reading. " +
                    "Account details are kept while the account exists.",
            },
            {
                heading: "Correcting or deleting your data",
                body:
                    "There is no self-service delete button today, and it " +
                    "would be dishonest to imply otherwise. Removal of an " +
                    "account is carried out by an administrator on " +
                    "request: write to the Grievance Officer below and say " +
                    "what you want corrected or removed. Where a report is " +
                    "deleted, the votes, comments, cleanup record and " +
                    "reward entry attached to it are deleted with it.",
            },
            {
                heading: "How it is protected",
                body:
                    "Passwords are hashed with bcrypt. Sessions are " +
                    "stateless signed tokens that expire, and every " +
                    "protected endpoint checks both the token and the role " +
                    "behind it before answering. Administrative material " +
                    "is restricted to administrator accounts. No system is " +
                    "perfectly secure, and a session token held in local " +
                    "storage can be read by anything else running in your " +
                    "browser, so sign out on a shared device.",
            },
            {
                heading: "Children",
                body:
                    "The platform is not intended for children, and " +
                    "accounts should be created by adults. If you believe a " +
                    "child has registered, tell us and the account will be " +
                    "removed.",
            },
            {
                heading: "Changes to this policy",
                body:
                    "This policy changes when the platform does - if a new " +
                    "feature collects something new, this page is updated " +
                    "in the same breath. The review date shown with this " +
                    "document is the date of the wording you are reading.",
            },
        ],

        note:
            "If any statement on this page does not match what the " +
            "platform actually does, treat it as a fault worth reporting, " +
            "and tell the Grievance Officer.",
    },

    /* ==================================================================
       3. Accessibility Statement
       ================================================================== */
    {
        id: "accessibility",
        eyebrow: "Access for Everyone",
        title: "Accessibility Statement",
        hi: "सुगम्यता कथन",

        summary:
            "What has been built for accessibility, and - just as " +
            "importantly - what has not yet been tested.",

        intro:
            "A public record is only public if people can actually read " +
            "it. This statement sets out what has been done, and is " +
            "candid about what remains, because a claim of full " +
            "compliance is the one nobody believes.",

        clauses: [
            {
                heading: "What we are aiming at",
                body:
                    "The intent is that anybody can read this record and " +
                    "take part in it, using a keyboard alone, at a large " +
                    "text size, or with a screen reader. The Web Content " +
                    "Accessibility Guidelines are the reference being " +
                    "worked towards.",
            },
            {
                heading: "Getting past the navigation",
                body:
                    "Every page begins with a skip link that takes a " +
                    "keyboard or screen-reader user straight to the main " +
                    "content, so the navigation does not have to be " +
                    "traversed on each page.",
            },
            {
                heading: "Structure a screen reader can follow",
                body:
                    "Pages are built from real landmarks - header, " +
                    "navigation, main, footer - with one first-level " +
                    "heading and headings below it in order. Lists are " +
                    "marked up as lists, and the clauses on this page are " +
                    "a numbered list rather than styled paragraphs, so " +
                    "their numbering is announced rather than merely seen.",
            },
            {
                heading: "Two languages, correctly labelled",
                body:
                    "English and Hindi appear side by side in headings and " +
                    "navigation, and each is marked with its own language " +
                    "attribute. That is what lets a screen reader switch " +
                    "pronunciation instead of reading Devanagari as though " +
                    "it were English.",
            },
            {
                heading: "Keyboard operation and visible focus",
                body:
                    "Interactive controls are real buttons and links, " +
                    "reachable and operable by keyboard, and the focused " +
                    "element is always visibly outlined. A control that " +
                    "opens a dialog rather than navigating is a button, " +
                    "not a link dressed as one, so it does not promise a " +
                    "page it will not deliver.",
            },
            {
                heading: "Decoration kept quiet",
                body:
                    "Icons that merely accompany a label are hidden from " +
                    "assistive technology, so a heading is announced once " +
                    "rather than twice. Meaning is carried by text, with " +
                    "icons and colour reinforcing it.",
            },
            {
                heading: "Landing where you were sent",
                body:
                    "Links into a section of a page - including the three " +
                    "documents on this page - allow for the fixed " +
                    "navigation bar, so the heading you asked for arrives " +
                    "below the bar rather than hidden behind it, even while " +
                    "the rest of the page is still loading.",
            },
            {
                heading: "Text size and small screens",
                body:
                    "The layout reflows down to a phone and tolerates " +
                    "browser zoom and enlarged text without content being " +
                    "cut off or overlapping.",
            },
            {
                heading: "What has not been tested",
                body:
                    "No formal accessibility audit has been carried out, " +
                    "and the interface has not been tested end to end with " +
                    "screen readers such as NVDA, JAWS, VoiceOver or " +
                    "TalkBack. Some status information leans on colour " +
                    "alongside its label, and colour contrast has not been " +
                    "measured across every combination. Hindi covers " +
                    "headings and navigation rather than the whole " +
                    "interface, so much of the detail is English only. " +
                    "Photographs uploaded by users have no descriptive " +
                    "alternative text, because the person uploading is not " +
                    "asked for one.",
            },
            {
                heading: "Tell us where it fails",
                body:
                    "If something here blocks you, please say so, naming " +
                    "the page and what happened, and what you were using " +
                    "at the time. Reports of specific barriers are the " +
                    "most useful thing we can receive, and they are what " +
                    "this list gets shortened by. Write to the Grievance " +
                    "Officer below.",
            },
        ],

        note:
            "This statement describes the platform as built and will be " +
            "revised as the gaps above are closed - including when a " +
            "formal audit is carried out.",
    },
];
