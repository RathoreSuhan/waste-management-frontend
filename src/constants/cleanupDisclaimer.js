import {
    CLEANUP_PROOF_RADIUS_METRES, // radius enforced when cleanup proof is uploaded
    INSPECTION_RADIUS_METRES, // radius enforced when a proposal is submitted
} from "@/constants/assignmentConstants";

/**
 * ============================================================================
 * Cleanup Presence Disclaimer
 * ============================================================================
 *
 * The notice a cleaner must acknowledge before acting on a cleanup site.
 *
 * The platform accepts location-bound evidence at two points in the municipal
 * workflow, so the notice is issued at both of them:
 *
 *   1. Submitting a cleanup proposal - the cleaner has to be standing at the
 *      site while recording the inspection.
 *   2. Starting the awarded work - the cleanup photograph is later matched
 *      against the citizen's reported location.
 *
 * The distance check is a Clean Bharat *platform verification rule*, adopted
 * so that proposals and proof can be trusted. It is deliberately described as
 * a platform rule and not as a legal or statutory requirement, because no law
 * prescribes it - it is how this platform validates presence.
 *
 * The notice also states the workflow plainly: submitting a proposal does not
 * award the work. The municipal corporation reviews the proposals it receives
 * and decides which cleaner carries out the cleanup.
 *
 * It closes by naming the activity log as optional. A cleanup that runs over
 * several days benefits from a running record, but a small one-day job does
 * not need one - saying so here prevents cleaners assuming entries are a
 * condition of being paid.
 *
 * Both languages carry the same obligation, with the English text first and
 * the formal Hindi translation directly below it, matching how notices are
 * issued on Indian government forms.
 *
 * The radii are interpolated from the shared constants so the wording can
 * never drift from the distances actually enforced.
 * ============================================================================
 */

/**
 * English notice.
 *
 * Worded as "before you proceed" rather than "before you claim", because the
 * same paragraph is issued on the proposal screen and on the start screen.
 */
export const CLEANUP_DISCLAIMER_EN = `Before you proceed, please note: this site is inspected and cleaned under the supervision of the municipal corporation. When you record a site inspection, your device location will be captured and must fall within ${INSPECTION_RADIUS_METRES} metres of the citizen's reported location. The same check applies to the cleanup photograph you upload later, which is accepted only from within ${CLEANUP_PROOF_RADIUS_METRES} metres of that location. Manual entry of coordinates is not permitted. This distance check is a Clean Bharat platform verification rule for confirming your presence on site - it is not a legal requirement. Submitting a proposal does not award you the work; the municipal corporation reviews all proposals received and decides which cleaner is assigned the cleanup. Once work has begun you may record activity entries as the cleanup proceeds; these entries are optional and are useful mainly for cleanups carried out over more than one day.`;

/**
 * Formal Hindi translation of the same notice (शुद्ध औपचारिक हिंदी).
 */
export const CLEANUP_DISCLAIMER_HI = `आगे बढ़ने से पूर्व कृपया ध्यान दें: इस स्थल का निरीक्षण एवं सफाई कार्य नगर निगम के पर्यवेक्षण में किया जाता है। स्थल-निरीक्षण दर्ज करते समय आपके उपकरण की वर्तमान अवस्थिति प्राप्त की जाएगी, जो नागरिक द्वारा दर्ज स्थान की ${INSPECTION_RADIUS_METRES} मीटर परिधि के भीतर होनी अनिवार्य है। यही जाँच आगे अपलोड किए जाने वाले सफाई प्रमाण-चित्र पर भी लागू होती है, जो उक्त स्थान की ${CLEANUP_PROOF_RADIUS_METRES} मीटर परिधि के भीतर से ही स्वीकार किया जाएगा। अक्षांश एवं देशांतर स्वयं भरने की अनुमति नहीं है। यह दूरी-सम्बन्धी जाँच स्थल पर आपकी उपस्थिति की पुष्टि हेतु क्लीन भारत मंच का सत्यापन नियम है - यह कोई विधिक अनिवार्यता नहीं है। प्रस्ताव प्रस्तुत करने मात्र से कार्य आपको आवंटित नहीं होता; नगर निगम प्राप्त समस्त प्रस्तावों की समीक्षा कर यह निर्णय लेता है कि सफाई कार्य किस सफाईकर्मी को सौंपा जाए। कार्य प्रारम्भ करने के उपरान्त आप सफाई की प्रगति से सम्बन्धित विवरण दर्ज कर सकते हैं; ये विवरण वैकल्पिक हैं तथा मुख्यतः एक से अधिक दिन तक चलने वाले सफाई कार्यों हेतु उपयोगी हैं।`;

/**
 * Dialog headings, in both languages.
 */
export const CLEANUP_DISCLAIMER_TITLE = "Location Verification For Cleanup Work";

export const CLEANUP_DISCLAIMER_TITLE_HI = "सफाई कार्य हेतु अवस्थिति सत्यापन";

/**
 * Action labels, kept here so the proposal and start screens read identically.
 */
export const CLEANUP_DISCLAIMER_ACCEPT = "I Understand - Proceed";

export const CLEANUP_DISCLAIMER_CANCEL = "Cancel";