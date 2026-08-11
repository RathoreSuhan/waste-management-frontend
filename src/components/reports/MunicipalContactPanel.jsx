import { useEffect, useState } from "react";
import { Building2, Phone, Mail, Loader2 } from "lucide-react";
import { getMunicipalCorporationByCity } from "@/services/municipalCorporationService";

/**
 * ============================================================================
 * Municipal Contact Panel
 * ============================================================================
 *
 * The municipal corporation answerable for the city a report was filed in,
 * with the phone number and email a citizen can chase it on.
 *
 * Calls GET /api/municipal-corporations/city/{city} through the existing
 * service. The backend resolves the city with findByCityIgnoreCase, so
 * "Mohali", "mohali" and "MOHALI" all reach the same record.
 *
 * ----------------------------------------------------------------------------
 * The four outcomes are kept distinct on purpose
 * ----------------------------------------------------------------------------
 *
 *   found     - render the contact card
 *   notFound  - a real 404: no corporation registered for this city. Many
 *               cities have no row, since the list is maintained by hand by
 *               administrators, so this is an ordinary outcome and is said
 *               plainly.
 *   error     - network, timeout or permission failure. Renders nothing.
 *               Claiming "no contact is registered" here would be a lie
 *               about the data when the truth is we could not ask.
 *   idle      - never asked (see the anonymous-visitor note below).
 *
 * ----------------------------------------------------------------------------
 * Why anonymous visitors are not asked at all
 * ----------------------------------------------------------------------------
 *
 * The endpoint is .authenticated(), but report pages are public
 * (GET /api/reports/* is permitAll), so this component renders for
 * logged-out visitors too. Spring answers an anonymous request with 401,
 * and the global axios response interceptor clears the stored token and
 * user on any 401. Firing this request while logged out would therefore
 * be a self-inflicted logout on a page the visitor is entitled to read.
 *
 * So the token is checked first and the request is skipped when absent.
 * ============================================================================
 */

/** Request outcomes, kept as names rather than loose booleans. */
const STATUS = {
    IDLE: "idle",
    LOADING: "loading",
    FOUND: "found",
    NOT_FOUND: "notFound",
    ERROR: "error",
};

/**
 * Has the login flow stored a usable JWT?
 *
 * Mirrors the check the axios request interceptor makes before attaching
 * the header, so this component's idea of "signed in" cannot drift from
 * whether the token would actually be sent.
 */
function hasStoredToken() {

    const token = localStorage.getItem("token");

    return Boolean(token && token.trim() && token.trim().startsWith("eyJ"));
}

/**
 * One contact line - an icon, a label, and a value that can be acted on.
 *
 * Phone and email are links, since the only reason to show them is that
 * the reader gets in touch.
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
                    <a href={href} className="font-medium text-gov-blue hover:underline">
                        {value}
                    </a>
                </dd>
            </div>
        </div>
    );
}

/**
 * @param report  the loaded ReportResponse - only `city` is used
 */
export default function MunicipalContactPanel({ report }) {

    const city = report?.city?.trim() || "";

    // Whether this render is even allowed to ask the API
    const canLookup = Boolean(city) && hasStoredToken();

    /*
      `city` is recorded alongside the result so a response can be matched
      to the city it was fetched for. Comparing during render is what keeps
      a previous city's contact off screen without a setState in the effect
      body, which React now warns about as a cascading render.
    */
    const [result, setResult] = useState({
        status: canLookup ? STATUS.LOADING : STATUS.IDLE,
        data: null,
        city,
    });

    useEffect(() => {

        // Nothing to ask for, or not permitted to ask
        if (!canLookup) {
            return;
        }

        // Guards against a slow reply for a city we have since navigated away from
        let active = true;

        getMunicipalCorporationByCity(city)
            .then((data) => {
                if (!active) return;

                setResult({ status: STATUS.FOUND, data, city });
            })
            .catch((err) => {
                if (!active) return;

                /*
                  404 is the backend's way of saying no corporation is
                  registered for this city - a legitimate state worth
                  telling the reader about. Every other failure is a
                  problem on our side, and is kept quiet.
                */
                const status =
                    err?.response?.status === 404
                        ? STATUS.NOT_FOUND
                        : STATUS.ERROR;

                setResult({ status, data: null, city });
            });

        return () => {
            active = false;
        };
    }, [city, canLookup]);

    // A result for a different city is stale until the effect refetches
    const status = result.city === city ? result.status : STATUS.LOADING;

    // ---- Report has no city, so there is nothing to look up ----
    if (!city) {
        return (
            <div className="rounded-gov border border-rule bg-paper p-4">
                <p className="text-sm leading-relaxed text-ink-muted">
                    No city was recorded against this report, so the responsible
                    municipal corporation cannot be identified.
                </p>
            </div>
        );
    }

    /*
      ---- Not asked, or asked and failed ----

      Both render nothing. An anonymous visitor is not told a contact is
      missing when it was never looked up, and a failed request does not
      get dressed up as an answer.
    */
    if (status === STATUS.IDLE || status === STATUS.ERROR) {
        return null;
    }

    // ---- Waiting on the lookup ----
    if (status === STATUS.LOADING) {
        return (
            <div className="rounded-gov border border-rule bg-paper p-4">
                <p className="flex items-center gap-2 text-xs text-ink-muted">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Looking up the municipal corporation for {city}...
                </p>
            </div>
        );
    }

    // ---- No corporation registered for this city ----
    if (status === STATUS.NOT_FOUND) {
        return (
            <div className="rounded-gov border border-rule bg-paper p-4">
                <p className="text-sm leading-relaxed text-ink-muted">
                    No municipal contact is registered for{" "}
                    <span className="font-semibold text-ink">{city}</span>{" "}
                    yet. The report is still logged and will be assigned to a
                    cleanup team in the usual way.
                </p>
            </div>
        );
    }

    // ---- Found ----
    const corporation = result.data;

    return (
        <div className="rounded-gov border border-rule bg-white p-4">

            {/*
              The name leads, because it answers the reader's first
              question: who is actually answerable for this.
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

                        <p className="mt-0.5 text-xs text-ink-muted">
                            Responsible for {city}
                        </p>
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
                          Spaces and dashes read well but break a tel: link
                          on some dialers, so they are stripped from the
                          href while the displayed value keeps them.
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
              Anyone ringing the corporation will be asked which report they
              mean, so the reference is repeated rather than leaving them to
              scroll back up the page for it.
            */}
            <p className="mt-3 border-t border-rule pt-3 text-xs leading-relaxed text-ink-muted">
                Quote the report reference above when you contact them.
            </p>
        </div>
    );
}
