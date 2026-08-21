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
        assignmentReview: { en: "Assignment Review", hi: "कार्य समीक्षा" },

        changePassword: { en: "Change Password", hi: "पासवर्ड बदलें" },
    },
};

export default UI;
