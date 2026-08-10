import { Building2, Phone, Mail } from "lucide-react";

/**
 * ============================================================================
 * Municipal Contact Panel
 * ============================================================================
 *
 * The municipal corporation responsible for the city a report was filed in,
 * with the phone number and email a citizen can chase it on.
 *
 * ----------------------------------------------------------------------------
 * Why this reads the report defensively
 * ----------------------------------------------------------------------------
 *
 * At the time of writing the backend does NOT send these details:
 *
 *   - `ReportResponse` carries no municipal corporation fields at all. It
 *     stops at city/state/pincode.
 *   - `/api/municipal-corporations/**` is `hasRole("ADMIN")` in
 *     SecurityConfig, GET included, so the frontend cannot fetch them as a
 *     second request either - a citizen would get 403.
 *
 * The data exists (`MunicipalCorporationResponse` has organizationName,
 * phone and email, keyed by city) and a report knows its city, so this is
 * purely a question of the API exposing it. Rather than leave the page with
 * nothing, this component reads whatever shape the report arrives in and
 * renders as soon as the fields appear - no further frontend change needed
 * once the backend sends them.
 *
 * Two shapes are accepted, because either is a reasonable thing for the
 * backend to settle on:
 *
 *   1. Nested:  report.municipalCorporation = { organizationName, phone, email }
 *   2. Flat:    report.municipalCorporationName / ...Phone / ...Email
 *
 * The flat spelling matches `PublicFeedResponse.municipalCorporationName`,
 * which is the one precedent already in the codebase.
 *
 * ----------------------------------------------------------------------------
 * Why it renders an empty state instead of hiding
 * ----------------------------------------------------------------------------
 *
 * Many cities will simply have no record - the corporation list is
 * maintained by hand by administrators, and the city lookup returns 404
 * rather than an empty body for anything missing. Silently hiding the
 * section would leave a citizen wondering whether nobody is responsible for
 * their report. Naming the gap is more honest, and tells the reader the
 * report is still logged regardless.
 * ============================================================================
 */

/**
 * Pull the corporation details off a report, whichever shape it arrives in.
 *
 * Returns null when nothing usable is present, so the caller can tell
 * "no record for this city" apart from "record with a missing phone".
 *
 * @param {Object} report - a ReportResponse
 * @returns {{organizationName?: string, phone?: string, email?: string}|null}
 */
function readCorporation(report) {

    if (!report) return null;

    // Preferred shape: a nested object
    const nested = report.municipalCorporation;

    if (nested && typeof nested === "object") {

        // An object with every field blank is no more use than no object
        const hasAnything =
            nested.organizationName || nested.phone || nested.email;

        return hasAnything ? nested : null;
    }

    // Fallback shape: flat fields, as PublicFeedResponse already spells them
    const flat = {
        organizationName: report.municipalCorporationName,
        phone: report.municipalCorporationPhone,
        email: report.municipalCorporationEmail,
    };

    const hasAnything = flat.organizationName || flat.phone || flat.email;

    return hasAnything ? flat : null;
}

/**
 * One contact line - an icon, a label and a value that can be acted on.
 *
 * Phone and email are rendered as tel: and mailto: links, since the whole
 * point of showing them is that the reader gets in touch. Anything without
 * a value is skipped by the caller rather than printed as a blank row.
 */
function ContactRow({ icon: Icon, label, value, href }) {

    return (
        <div className="flex items-start gap-2.5">
            <Icon
                size={14}
                className="mt-0.5 shrink-0 text-ink-muted"
                aria-hidden="true"
            />

            <div className="min-w-0">
                <dt className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
                    {label}
                </dt>

                <dd className="mt-0.5 text-sm break-words text-ink">
                    {href ? (
                        <a
                            href={href}
                            className="font-medium text-gov-blue hover:underline"
                        >
                            {value}
                        </a>
                    ) : (
                        value
                    )}
                </dd>
            </div>
        </div>
    );
}

/**
 * @param report  the loaded ReportResponse
 */
export default function MunicipalContactPanel({ report }) {

    const corporation = readCorporation(report);

    // No record for this city, or the API is not sending the details yet
    if (!corporation) {
        return (
            <div className="rounded-gov border border-rule bg-paper p-4">
                <p className="text-sm leading-relaxed text-ink-muted">
                    No municipal contact is registered for
                    {report?.city ? (
                        <> <span className="font-semibold text-ink">{report.city}</span></>
                    ) : (
                        " this city"
                    )}
                    {" "}yet. The report is still logged and will be assigned to a
                    cleanup team in the usual way.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-gov border border-rule bg-white p-4">

            {/*
              The corporation's name leads, because it answers the reader's
              first question - who is actually responsible for this.
            */}
            {corporation.organizationName && (
                <div className="flex items-start gap-2.5 border-b border-rule pb-3">
                    <Building2
                        size={16}
                        className="mt-0.5 shrink-0 text-india-green"
                        aria-hidden="true"
                    />

                    <div className="min-w-0">
                        <p className="font-serif text-base leading-snug font-bold text-gov-navy">
                            {corporation.organizationName}
                        </p>

                        {report?.city && (
                            <p className="mt-0.5 text-xs text-ink-muted">
                                Responsible for {report.city}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Ways to chase it up */}
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">

                {corporation.phone && (
                    <ContactRow
                        icon={Phone}
                        label="Phone"
                        value={corporation.phone}
                        /*
                          Spaces and dashes are fine for a human to read but
                          break a tel: link on some dialers, so they are
                          stripped from the href only.
                        */
                        href={`tel:${String(corporation.phone).replace(/[\s-]/g, "")}`}
                    />
                )}

                {corporation.email && (
                    <ContactRow
                        icon={Mail}
                        label="Email"
                        value={corporation.email}
                        href={`mailto:${corporation.email}`}
                    />
                )}
            </dl>

            {/*
              A citizen who rings the corporation will be asked which report
              they mean, so the reference is worth repeating here rather than
              leaving them to scroll back up for it.
            */}
            <p className="mt-3 border-t border-rule pt-3 text-xs leading-relaxed text-ink-muted">
                Quote the report reference above when you contact them.
            </p>
        </div>
    );
}
