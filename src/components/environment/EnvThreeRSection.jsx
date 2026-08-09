import { Link } from "react-router-dom";
import { Recycle, ArrowRight } from "lucide-react";

import EnvPhotoBand from "@/components/environment/EnvPhotoBand";

import useLayoutMode from "@/hooks/useLayoutMode";
import { ENV_THREE_R } from "@/constants/environmentContent";

/**
 * ============================================================================
 * The Three R's
 * ============================================================================
 *
 * Opens on wm2, sets out Reduce / Reuse / Recycle, and closes on wm3.
 *
 * The two photographs bracket the section deliberately: wm2 introduces the
 * hierarchy and wm3 closes it with the line the hierarchy exists to make,
 * so the three cards sit inside a frame rather than trailing off into the
 * next heading.
 *
 * The cards are ordered by how much each actually prevents, which is not
 * the order people recite them in. Recycling is the one everybody
 * remembers and the weakest of the three, and the section says so.
 * ============================================================================
 */

export default function EnvThreeRSection({ openingImage, closingImage }) {

    /*
      Links follow the shell the page is rendering in, so a signed-in
      reader who arrived from the sidebar is not dropped out onto the
      public site mid-page.
    */
    const { basePath } = useLayoutMode();

    return (
        <>
            <EnvPhotoBand
                image={openingImage}
                alt="Recyclable materials sorted and gathered for collection"
                eyebrow="The Waste Hierarchy"
                title="Reduce, Reuse, Recycle - In That Order"
                body="They are not three equal options. They are a ranking, strongest first, and most of the attention goes to the weakest of the three."
            />

            <section className="border-b border-rule bg-white">
                <div className="mx-auto max-w-7xl px-4 py-12">

                    <div className="border-b border-rule pb-3">
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                            <Recycle size={12} aria-hidden="true" />
                            Three R's
                        </p>

                        <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                            Ranked by What They Prevent
                        </h2>

                        <div className="mt-1.5 h-0.5 w-12 bg-saffron" />
                    </div>

                    <ol className="mt-6 grid gap-4 md:grid-cols-3">
                        {ENV_THREE_R.map((item, index) => (
                            <li
                                key={item.title}
                                className="flex flex-col rounded-gov border border-rule bg-paper p-5"
                            >
                                <div className="flex items-baseline gap-3">
                                    {/*
                                      The rank, stated plainly. Numbering
                                      them is the whole point of ordering
                                      them.
                                    */}
                                    <span
                                        className="font-serif text-3xl font-bold text-saffron"
                                        aria-hidden="true"
                                    >
                                        {index + 1}
                                    </span>

                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-gov-navy">
                                            {item.title}
                                        </h3>

                                        <p className="text-xs tracking-wide text-ink-muted uppercase">
                                            {item.subtitle}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-3 text-sm leading-relaxed text-ink">
                                    {item.body}
                                </p>

                                <div className="mt-auto pt-4">
                                    <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted uppercase">
                                        In practice
                                    </p>

                                    <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                                        {item.practices.map((practice) => (
                                            <li key={practice} className="flex gap-2">
                                                <span
                                                    aria-hidden="true"
                                                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-india-green"
                                                />
                                                {practice}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/*
              wm3 closes the hierarchy. Shorter than the opening band -
              it carries one line, not an introduction.
            */}
            <EnvPhotoBand
                image={closingImage}
                alt="An open, clean landscape kept free of waste"
                title="The cheapest waste to manage is the waste never created."
                body="Everything after that first decision is damage control - useful, necessary, and still second best."
                height="short"
                focus="center 40%"
            >
                <Link
                    to={`${basePath}/success-stories`}
                    className="inline-flex items-center gap-1.5 rounded-gov border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                    See places already cleared
                    <ArrowRight size={15} aria-hidden="true" />
                </Link>
            </EnvPhotoBand>
        </>
    );
}
