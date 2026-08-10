import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, AlertTriangle, FilePlus2 } from "lucide-react";

import EnvPhotoBand from "@/components/environment/EnvPhotoBand";
import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";

import { useAuthContext } from "@/hooks/useAuthContext";
import { ENV_BINS } from "@/constants/environmentContent";

/**
 * ============================================================================
 * Segregation Section
 * ============================================================================
 *
 * The wm1 band, then the three-bin standard as one card per stream.
 *
 * This is the part of the page that changes behaviour, so it is also where
 * the platform's own action belongs: someone who has just read what should
 * go where is exactly the person who notices the pile that should not be
 * there. The button files a report.
 *
 * Bin colours are held as explicit hex values in environmentContent, not
 * theme tokens - they describe physical bins and must not shift if the
 * palette is retuned. Each bin also carries onSwatch, which decides whether
 * its header strip takes white or navy text; yellow will not hold white.
 * ============================================================================
 */

export default function EnvSegregationSection({ image }) {

    const { user } = useAuthContext();
    const navigate = useNavigate();

    // Why the visitor cannot file a report yet, or null
    const [prompt, setPrompt] = useState(null);

    /**
     * Same guard the primary navigation uses.
     *
     * /citizen/report sits behind RoleRoute allowedRole="ROLE_CITIZEN", so
     * a guest or a cleaner pressing this would otherwise be redirected with
     * no explanation. Duplicating the check here is deliberate: the reason
     * has to be given at the point the button is pressed.
     */
    function handleFileReport() {

        if (!user) {
            setPrompt({ action: "file a waste report", citizenOnly: false });
            return;
        }

        if (user.role !== "ROLE_CITIZEN") {
            setPrompt({ action: "file a waste report", citizenOnly: true });
            return;
        }

        navigate("/citizen/report");
    }

    return (
        <>
            <EnvPhotoBand
                image={image}
                alt="Separate waste containers for different types of household waste"
                eyebrow="Segregation"
                title="Three Bins, One Decision Each"
                body="Sorting waste takes a household about ten seconds a day. Nothing else on this page saves as much for as little effort - and once streams are mixed, no amount of work downstream fully separates them again."
            />

            <section className="border-b border-rule bg-white">
                <div className="mx-auto max-w-7xl px-4 py-12">

                    <div className="border-b border-rule pb-3">
                        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                            <Trash2 size={12} aria-hidden="true" />
                            What Goes Where
                        </p>

                        <h2 className="mt-1 font-serif text-2xl font-bold text-gov-navy md:text-3xl">
                            Sorting by Colour
                        </h2>

                        <div className="mt-1.5 h-0.5 w-12 bg-saffron" />

                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-muted">
                            The Solid Waste Management Rules, 2016 set three
                            streams for household waste across India - wet, dry
                            and domestic hazardous. The colours below are the
                            ones many corporations use for them. Each card lists
                            what belongs in that bin, and the one mistake that
                            undoes the effort.
                        </p>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {ENV_BINS.map((bin) => {

                            // Light swatches need dark type over them. Yellow
                            // is the case in point: white on it reads at about
                            // 1.9:1, navy at over 8:1.
                            const dark = bin.onSwatch === "dark";

                            return (
                            <article
                                key={bin.name}
                                className="flex flex-col overflow-hidden rounded-gov border border-rule bg-paper"
                            >
                                {/*
                                  The bin's own colour as a header strip, so
                                  the card is identifiable before it is read.
                                  Type colour follows onSwatch so every header
                                  clears the contrast minimum.
                                */}
                                <header
                                    className={`px-5 py-3 ${dark ? "text-gov-navy" : "text-white"}`}
                                    style={{ backgroundColor: bin.swatch }}
                                >
                                    <p className="font-serif text-lg font-bold">
                                        {bin.name} Bin
                                    </p>

                                    <p className={`text-xs ${dark ? "text-gov-navy/80" : "text-white/85"}`}>
                                        {bin.stream}
                                    </p>
                                </header>

                                <div className="flex flex-1 flex-col p-5">
                                    <p className="text-sm leading-relaxed text-ink">
                                        {bin.summary}
                                    </p>

                                    <ul className="mt-4 space-y-1.5 text-sm text-ink-muted">
                                        {bin.accepts.map((item) => (
                                            <li key={item} className="flex gap-2">
                                                {/*
                                                  A dot in the bin's colour
                                                  ties each line back to the
                                                  header without repeating it.
                                                */}
                                                <span
                                                    aria-hidden="true"
                                                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                                                    style={{ backgroundColor: bin.swatch }}
                                                />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    {/*
                                      mt-auto keeps the three mistake notes
                                      aligned along the bottom even though
                                      the lists above differ in length.
                                    */}
                                    <div className="mt-auto pt-4">
                                        <div className="flex gap-2 rounded-gov border border-rule bg-white p-3">
                                            <AlertTriangle
                                                size={14}
                                                className="mt-0.5 shrink-0 text-civic-amber"
                                                aria-hidden="true"
                                            />

                                            <p className="text-xs leading-relaxed text-ink-muted">
                                                <span className="font-semibold text-ink">
                                                    Common mistake:{" "}
                                                </span>
                                                {bin.mistake}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </article>
                            );
                        })}
                    </div>

                    {/*
                      An honest caveat. Corporations genuinely differ on which
                      colour carries which stream - blue and black are as
                      common as the yellow and red shown here - and telling a
                      reader their city's scheme is wrong would be worse than
                      telling them to check it.
                    */}
                    <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                        Bin colours vary between municipal corporations. Many
                        use blue for dry recyclable waste and black for domestic
                        hazardous waste, and some add a fourth bin for sanitary
                        waste alone. Where your corporation publishes its own
                        scheme, follow that.
                    </p>

                    {/* Where reading turns into reporting */}
                    <div className="mt-8 flex flex-wrap items-center gap-4 rounded-gov border border-rule bg-saffron-soft p-5">
                        <div className="flex-1">
                            <p className="font-serif text-lg font-bold text-gov-navy">
                                Waste that never reaches a bin
                            </p>

                            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                                Segregation only covers what gets collected. For
                                the pile on the corner that nobody has come for,
                                the platform has a different answer - report it,
                                and a cleaner can claim it.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleFileReport}
                            className="inline-flex items-center gap-1.5 rounded-gov border border-saffron bg-saffron px-4 py-2 text-sm font-semibold text-gov-navy transition hover:bg-saffron/85"
                        >
                            <FilePlus2 size={15} aria-hidden="true" />
                            File a Report
                        </button>
                    </div>
                </div>
            </section>

            <LoginRequiredDialog
                open={Boolean(prompt)}
                onClose={() => setPrompt(null)}
                action={prompt?.action}
                citizenOnly={prompt?.citizenOnly}
                currentRole={user?.role}
                redirectTo="/citizen/report"
            />
        </>
    );
}
