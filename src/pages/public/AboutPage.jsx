import { Info } from "lucide-react";

import PageIntro from "@/components/layout/PageIntro";

import AboutProblemSection from "@/components/about/AboutProblemSection";
import AboutApproachSection from "@/components/about/AboutApproachSection";
import AboutSafeguardsSection from "@/components/about/AboutSafeguardsSection";
import AboutCapabilitiesSection from "@/components/about/AboutCapabilitiesSection";

import HomeProcessSection from "@/components/home/HomeProcessSection";

/**
 * ============================================================================
 * About Page
 * ============================================================================
 *
 * What this platform is, and how a report travels through it.
 *
 * Both footer links under "About the Platform" land here - About the
 * Project at the top, How It Works at the #how-it-works anchor. They are
 * one page rather than two because they are one argument: "how it works"
 * is the answer to "what is it", and a page holding only the five stages
 * would be a heading and a rail.
 *
 * The page reads in one arc:
 *
 *   1. The problem      - why reporting waste usually fails
 *   2. The approach     - what this is instead, and the creator's line
 *   3. How it works     - the five stages a report passes
 *   4. The checks       - what stops the record being wrong
 *   5. What you can do  - the working capabilities, then the public record
 *
 * Content lives in constants/aboutContent.js, so the wording can be
 * revised without touching layout. Same split as the Environment page.
 *
 * Editorial, not data-driven: no API calls. There is no "about" endpoint,
 * and the platform-wide figures that might have filled one sit behind the
 * ROLE_ADMIN dashboard, where a public page has no business reaching.
 * ============================================================================
 */

export default function AboutPage() {
    return (
        <>
            <PageIntro
                icon={Info}
                eyebrow="About the Platform"
                en="About Clean Bharat"
                hi="स्वच्छ भारत के बारे में"
                description="A public register of neighbourhood waste - what it is for, how a report travels through it, and what is checked along the way."
            />

            <AboutProblemSection />

            <AboutApproachSection />

            {/*
              How It Works.

              HomeProcessSection is reused rather than reimplemented: the
              five stages, the connecting rail and the two AI badges are
              exactly what this part of the page has to say, and a second
              copy would be two things to keep in step. One component,
              mounted in two places - the same pattern AppRoutes uses for
              the /app duplicates of the community pages.

              The anchor lives on this wrapper instead of inside that
              component, so the homepage is not carrying an id that means
              nothing there.

              scroll-mt-20 clears the sticky navigation. ScrollManager
              honours location.hash with scrollIntoView, which respects
              scroll-margin-top, so arriving from the footer link lands
              with the heading below the bar rather than behind it.
            */}
            <div id="how-it-works" className="scroll-mt-20">
                {/*
                  Set white here rather than taking the component's
                  default. This page alternates white and paper down its
                  five sections, and the stages land on an odd step of
                  that run where the home page has them on an even one.
                */}
                <HomeProcessSection className="border-b border-rule bg-white" />
            </div>

            <AboutSafeguardsSection />

            <AboutCapabilitiesSection />
        </>
    );
}
