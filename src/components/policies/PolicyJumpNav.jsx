/**
 * ============================================================================
 * Policy Jump Navigation
 * ============================================================================
 *
 * The contents strip at the top of the Policies page.
 *
 * Three documents live on one route, which means a reader arriving from the
 * footer needs to see immediately that the other two are here as well -
 * otherwise landing at #privacy looks like landing on a privacy page, and
 * the terms appear to be missing.
 *
 * Plain <a href="#id"> rather than react-router <Link>. These are positions
 * within the page already on screen: an anchor moves the window without a
 * navigation, whereas a Link pushes a new history entry, so three clicks
 * here would mean three presses of Back to leave. Native anchors also give
 * the browser's own find-on-page and open-in-new-tab behaviour for free.
 *
 * Note this is a <nav> with a label, so a screen reader can find it as the
 * contents list rather than meeting three unexplained links.
 * ============================================================================
 */

import { ChevronRight } from "lucide-react";

import { POLICY_DOCUMENTS } from "@/constants/policyContent";

export default function PolicyJumpNav({ icons = {} }) {

    return (
        <nav
            aria-label="Policy documents on this page"
            className="border-b border-rule bg-white"
        >
            <div className="mx-auto max-w-7xl px-4 py-6">

                <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
                    On This Page
                </p>

                <ul className="mt-3 grid gap-3 sm:grid-cols-3">
                    {POLICY_DOCUMENTS.map((doc) => {

                        const DocIcon = icons[doc.id];

                        return (
                            <li key={doc.id}>
                                <a
                                    href={`#${doc.id}`}
                                    className="group flex h-full items-start gap-3 rounded-gov border border-rule bg-paper p-4 transition hover:border-gov-blue hover:bg-white"
                                >
                                    {DocIcon && (
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gov-blue/10 text-gov-blue">
                                            <DocIcon size={16} aria-hidden="true" />
                                        </span>
                                    )}

                                    <span className="min-w-0">
                                        <span className="flex items-center gap-1 font-serif text-sm font-bold text-gov-navy">
                                            {doc.title}

                                            <ChevronRight
                                                size={13}
                                                aria-hidden="true"
                                                className="text-gov-blue transition group-hover:translate-x-0.5"
                                            />
                                        </span>

                                        <span className="mt-1 block text-xs leading-relaxed text-ink-muted">
                                            {doc.summary}
                                        </span>
                                    </span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
