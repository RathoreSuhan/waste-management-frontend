import { Leaf } from "lucide-react";

import PageIntro from "@/components/layout/PageIntro";

import EnvBenefitsSection from "@/components/environment/EnvBenefitsSection";
import EnvSegregationSection from "@/components/environment/EnvSegregationSection";
import EnvThreeRSection from "@/components/environment/EnvThreeRSection";
import EnvPledgeSection from "@/components/environment/EnvPledgeSection";

import segregationImage from "@/assets/wm1.jpg";
import hierarchyImage from "@/assets/wm2.jpg";
import preventionImage from "@/assets/wm3.jpg";
import pledgeImage from "@/assets/wm4.jpg";

/**
 * ============================================================================
 * Environment Page
 * ============================================================================
 *
 * The reference material behind everything else on the platform.
 *
 * The rest of the site deals with waste that has already been dumped:
 * report it, claim it, clear it, verify it. This page is the other half of
 * the problem - what a household can do so the pile never forms, and what
 * the waste means when it does.
 *
 * It reads in one arc:
 *
 *   1. Why it matters      (wm0) - the consequences of getting it wrong
 *   2. Segregation         (wm1) - the daily decision, and the report button
 *   3. The three R's  (wm2, wm3) - the hierarchy, strongest first
 *   4. The pledge          (wm4) - what it is all for
 *
 * Each section hands off to the next, and the last three end in the
 * platform's own actions - file a report, read the success stories, see
 * the leaderboard - so the page returns the reader to the system rather
 * than leaving them at the bottom of a leaflet.
 *
 * Mounted at both /environment and /app/environment. It holds no API
 * calls: there is no environment endpoint in the backend, and inventing
 * one, or reaching into the ROLE_ADMIN dashboard for figures, would be
 * the wrong answer to a page that is entirely editorial.
 *
 * Image assets are passed down from here rather than imported inside each
 * section, so which photograph appears where is answerable in one place.
 * ============================================================================
 */

export default function EnvironmentPage() {
    return (
        <>
            {/*
              PageIntro gives the navy band on the public site and an
              ordinary page heading inside the signed-in shell, where a
              full-bleed band would sit awkwardly in the constrained
              column beside the sidebar.
            */}
            <PageIntro
                icon={Leaf}
                eyebrow="Public Awareness"
                en="Environment"
                hi="पर्यावरण"
                description="What waste does when it is left alone, where it belongs when it is not, and the order in which the three R's actually matter."
            />

            <EnvBenefitsSection />

            <EnvSegregationSection image={segregationImage} />

            <EnvThreeRSection
                openingImage={hierarchyImage}
                closingImage={preventionImage}
            />

            <EnvPledgeSection image={pledgeImage} />
        </>
    );
}
