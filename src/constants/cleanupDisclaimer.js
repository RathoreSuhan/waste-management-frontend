import { CLEANUP_PROOF_RADIUS_METRES } from "@/constants/assignmentConstants";

/**
 * ============================================================================
 * Cleanup Presence Disclaimer (Phase 15)
 * ============================================================================
 *
 * The notice a cleaner must acknowledge before taking on work.
 *
 * Cleanup proof is only accepted from inside a fixed radius of the citizen's
 * reported location, so the cleaner has to learn that *before* travelling and
 * photographing - not when an upload is refused. The notice is therefore shown
 * at both decision points: claiming a task and starting work on it.
 *
 * Both languages carry the same obligation, with the English text first and
 * the formal Hindi translation directly below it, matching how notices are
 * issued on Indian government forms.
 *
 * The radius is interpolated from the shared constant so the wording can never
 * drift from the distance actually enforced.
 * ============================================================================
 */

/**
 * English notice.
 *
 * Worded as "before you proceed" rather than "before you claim", because the
 * same paragraph is issued on the claim screen and on the start screen.
 */
export const CLEANUP_DISCLAIMER_EN = `Before you proceed, please note: when you upload the cleanup photograph, your device location will be captured and matched against the location of the original citizen report. Your proof will be accepted only if you are physically present within a ${CLEANUP_PROOF_RADIUS_METRES} metre radius of the reported location. Manual entry of coordinates is not permitted.`;

/**
 * Formal Hindi translation of the same notice (शुद्ध औपचारिक हिंदी).
 */
export const CLEANUP_DISCLAIMER_HI = `आगे बढ़ने से पूर्व कृपया ध्यान दें: सफाई का प्रमाण-चित्र अपलोड करते समय आपके उपकरण की वर्तमान अवस्थिति प्राप्त की जाएगी तथा नागरिक द्वारा दर्ज मूल शिकायत की अवस्थिति से उसका मिलान किया जाएगा। आपका प्रमाण केवल तभी स्वीकार किया जाएगा जब आप दर्ज स्थान की ${CLEANUP_PROOF_RADIUS_METRES} मीटर परिधि के भीतर भौतिक रूप से उपस्थित होंगे। अक्षांश एवं देशांतर स्वयं भरने की अनुमति नहीं है।`;

/**
 * Dialog headings, in both languages.
 */
export const CLEANUP_DISCLAIMER_TITLE = "Location Requirement For Cleanup Proof";

export const CLEANUP_DISCLAIMER_TITLE_HI = "सफाई प्रमाण हेतु अवस्थिति की अनिवार्यता";

/**
 * Action labels, kept here so the claim and start screens read identically.
 */
export const CLEANUP_DISCLAIMER_ACCEPT = "I Understand - Proceed";

export const CLEANUP_DISCLAIMER_CANCEL = "Cancel";