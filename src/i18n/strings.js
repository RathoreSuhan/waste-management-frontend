/**
 * ============================================================================
 * Interface Strings
 * ============================================================================
 *
 * Bilingual wording for the shared furniture: the masthead, navigation,
 * sidebar and account controls.
 *
 * Each entry is an { en, hi } pair meant to be spread straight into BiText:
 *
 *     <BiText {...UI.nav.trending} />
 *
 * Only interface copy belongs here. Report titles, descriptions, comments
 * and messages returned by the backend are data written by people, and are
 * shown in whatever language they were written in - translating those would
 * need a translation service, which is a separate piece of work.
 *
 * Wording notes:
 * - The Hindi is the plain civic register used on state portals, not a
 *   literal word-for-word rendering. "Sign Out" is साइन आउट because that is
 *   what people actually look for, where a purer निर्गमन would read as odd.
 * - English technical terms in common use (रिपोर्ट, डैशबोर्ड) are kept in
 *   Devanagari rather than replaced with Sanskritised coinages nobody says.
 * ============================================================================
 */

export const UI = {

    /* ---------------- Masthead / utility strip ---------------- */
    site: {
        name: { en: "Clean Bharat", hi: "स्वच्छ भारत" },
        tagline: {
            en: "Community Waste Reporting Platform",
            hi: "सामुदायिक कचरा रिपोर्टिंग मंच",
        },
        builtBy: {
            en: "Built by citizens, for citizens",
            hi: "नागरिकों द्वारा, नागरिकों के लिए",
        },
        initiative: { en: "Citizen-Led Initiative", hi: "नागरिक-नेतृत्व पहल" },
        notGovernment: {
            en: "Independent • Not a Government Body",
            hi: "स्वतंत्र • अशासकीय निकाय",
        },
        communityRun: {
            en: "A community run initiative",
            hi: "एक सामुदायिक पहल",
        },
        textSize: { en: "Text Size", hi: "अक्षर आकार" },
        skipToContent: {
            en: "Skip to main content",
            hi: "मुख्य सामग्री पर जाएँ",
        },
    },

    /* ---------------- Account controls ---------------- */
    account: {
        loggedInAs: { en: "Logged in as", hi: "लॉग इन" },
        signOut: { en: "Sign Out", hi: "साइन आउट" },
        login: { en: "Login", hi: "लॉग इन" },
        register: { en: "Register", hi: "पंजीकरण" },
        myDashboard: { en: "My Dashboard", hi: "मेरा डैशबोर्ड" },
    },

    /* ---------------- Sign-in / registration ---------------- */
    /*
      Only the wording added by Google sign-in lives here. The rest of the two
      auth pages is long-form English prose set against the Devanagari title
      AuthShell renders, and rewriting all of it belongs to its own piece of
      work - but new user-facing text should not be added English-only.
    */
    auth: {
        or: { en: "or", hi: "या" },

        signingIn: { en: "Signing you in…", hi: "साइन इन किया जा रहा है…" },

        // Shown while Google's own script is still on its way
        preparingGoogle: {
            en: "Preparing Google sign-in…",
            hi: "Google साइन-इन तैयार हो रहा है…",
        },

        googleUnavailableExplain: {
            en: "Google sign-in could not load — it may be blocked by a browser extension. Use the form below instead.",
            hi: "Google साइन-इन लोड नहीं हो सका — इसे किसी ब्राउज़र एक्सटेंशन ने रोका हो सकता है। कृपया नीचे दिए गए फ़ॉर्म का उपयोग करें।",
        },

        googlePopupBlocked: {
            en: "The Google sign-in window could not open. Allow pop-ups for this site, then try again.",
            hi: "Google साइन-इन विंडो नहीं खुल सकी। कृपया इस साइट के लिए पॉप-अप अनुमति दें और पुनः प्रयास करें।",
        },

        googleFailed: {
            en: "Google sign-in could not be completed. Please try again.",
            hi: "Google साइन-इन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।",
        },

        /* ---- Email verification during sign-up ---- */

        checkYourEmail: {
            en: "Check your email",
            hi: "अपना ईमेल देखें",
        },

        codeSentTo: {
            en: "We sent a six-digit code to",
            hi: "हमने छह अंकों का कोड भेजा है",
        },

        codeExpiryNote: {
            en: "The code expires in 10 minutes. If it has not arrived, check your spam folder.",
            hi: "कोड 10 मिनट में समाप्त हो जाएगा। यदि यह नहीं आया है, तो अपना स्पैम फ़ोल्डर देखें।",
        },

        verificationCodeLabel: {
            en: "Verification code",
            hi: "सत्यापन कोड",
        },

        verifyAndCreate: {
            en: "Verify & Create Account",
            hi: "सत्यापित करें और खाता बनाएँ",
        },

        resendCode: {
            en: "Send a new code",
            hi: "नया कोड भेजें",
        },

        // {seconds} is filled in by the countdown
        resendIn: {
            en: "You can ask for a new code in {seconds}s",
            hi: "आप {seconds} सेकंड बाद नया कोड माँग सकते हैं",
        },

        useAnotherEmail: {
            en: "Use a different email address",
            hi: "दूसरा ईमेल पता उपयोग करें",
        },

        /* ---- Signing up with Google instead of a typed address ---- */

        verifiedWithGoogle: {
            en: "Verified with Google",
            hi: "Google द्वारा सत्यापित",
        },

        emailNotEditable: {
            en: "Taken from your Google account and cannot be changed here.",
            hi: "आपके Google खाते से लिया गया है और इसे यहाँ बदला नहीं जा सकता।",
        },

        useAnotherGoogleAccount: {
            en: "Use a different Google account",
            hi: "दूसरा Google खाता चुनें",
        },
    },

    /* ---------------- Primary navigation ---------------- */
    nav: {
        home: { en: "Home", hi: "मुख्य" },
        trending: { en: "Trending", hi: "चर्चित" },
        successStories: { en: "Success Stories", hi: "सफलता" },
        leaderboard: { en: "Leaderboard", hi: "अग्रणी सूची" },
        environment: { en: "Environment", hi: "पर्यावरण" },
        fileReport: { en: "File a Report", hi: "रिपोर्ट दर्ज करें" },
        menu: { en: "Menu", hi: "मेन्यू" },
    },


    /* ---------------- Sidebar ---------------- */
    sidebar: {
        services: { en: "Services", hi: "सेवाएँ" },
        helpdesk: { en: "Community Helpdesk", hi: "सहायता केंद्र" },
        replyTime: {
            en: "Replies usually within two working days",
            hi: "उत्तर सामान्यतः दो कार्यदिवसों में",
        },
        sections: { en: "Site sections", hi: "अनुभाग" },

        /* Menu entries, shared by all three roles */
        overview: { en: "Overview", hi: "अवलोकन" },
        manageReports: { en: "Manage Reports", hi: "शिकायत प्रबंधन" },
        manageUsers: { en: "Manage Users", hi: "उपयोगकर्ता" },
        municipalBodies: { en: "Municipal Bodies", hi: "नगर निगम" },
        allReports: { en: "All Reports", hi: "सभी रिपोर्ट" },
        publicReports: { en: "Public Reports", hi: "सार्वजनिक रिपोर्ट" },
        myReports: { en: "My Reports", hi: "मेरी रिपोर्ट" },
        availableTasks: { en: "Available Tasks", hi: "उपलब्ध कार्य" },

        // Proposals a cleaner has sent for municipal review
        myProposals: { en: "My Proposals", hi: "मेरे प्रस्ताव" },

        myTasks: { en: "My Tasks", hi: "मेरे कार्य" },
        myRewards: { en: "My Rewards", hi: "मेरे पुरस्कार" },

        /* Municipal officer console - scoped to one corporation's jurisdiction */
        municipalDashboard: { en: "Municipal Overview", hi: "निगम अवलोकन" },
        proposalQueue: { en: "Proposal Review", hi: "प्रस्ताव समीक्षा" },
        activeCleanups: { en: "Active Cleanups", hi: "चालू सफाई" },
        completionReview: { en: "Completion Review", hi: "पूर्णता समीक्षा" },
        cleanupHistory: { en: "Cleanup History", hi: "सफाई इतिहास" },
        assignmentReview: { en: "Assignment Review", hi: "कार्य समीक्षा" },

        changePassword: { en: "Change Password", hi: "पासवर्ड बदलें" },
    },

    /* ---------------- Backend warm-up notice ---------------- */
    /*
      Shown while the free-plan container is starting. The wording is shared by
      BackendWakeNotice and BackendWakeStrip so the auth pages and the header
      say exactly the same thing, and it lives here rather than in the
      components because both must exist in Hindi as well.
    */
    backend: {
        waking: { en: "Waking the server up", hi: "सर्वर शुरू हो रहा है" },

        explain: {
            en: "Clean Bharat runs on a free server that sleeps when nobody is using it. The first request after a quiet spell takes up to a minute.",
            hi: "स्वच्छ भारत एक निःशुल्क सर्वर पर चलता है जो उपयोग न होने पर निष्क्रिय हो जाता है। शांत अवधि के बाद पहला अनुरोध एक मिनट तक ले सकता है।",
        },

        reassure: {
            en: "Nothing is wrong — please stay on this page rather than pressing the button again.",
            hi: "कोई गड़बड़ी नहीं है — कृपया बटन दोबारा दबाने के बजाय इसी पृष्ठ पर रुके रहें।",
        },

        // Shown once the retry budget is spent, so this is no longer a cold start
        unreachable: {
            en: "Cannot reach the server",
            hi: "सर्वर से संपर्क नहीं हो पा रहा है",
        },

        unreachableExplain: {
            en: "The server did not answer after two minutes of trying. Please check your connection, or try again in a little while.",
            hi: "दो मिनट तक प्रयास के बाद भी सर्वर ने उत्तर नहीं दिया। कृपया अपना कनेक्शन जाँचें, या कुछ समय बाद पुनः प्रयास करें।",
        },

        retry: { en: "Try again", hi: "पुनः प्रयास करें" },

        dismiss: { en: "Dismiss", hi: "बंद करें" },
    },

    /* ---------------- API error wording ---------------- */
    /*
      Read by getErrorMessage rather than a component, because the rate-limit
      answer arrives from a security filter and has to be readable wherever an
      API call is made from. {seconds} is filled with the backend's Retry-After.
    */
    errors: {
        rateLimited: {
            en: "Slow down, retry in {seconds} s.",
            hi: "कृपया धीमे चलें, {seconds} सेकंड बाद पुनः प्रयास करें।",
        },
    },
};

export default UI;
