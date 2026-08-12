/**
 * ============================================================================
 * Route Fallback
 * ============================================================================
 *
 * Shown while a lazily loaded page is being fetched.
 *
 * Pages are split into separate chunks in AppRoutes, so on a slow connection
 * there is a gap between the click and the page appearing. Rendering nothing
 * in that gap looks like a broken link, so this occupies the space instead.
 *
 * Deliberately plain: the header, breadcrumbs and footer are already on
 * screen by this point, since only the page inside the layout is lazy. A
 * full-page skeleton would replace furniture that has not gone anywhere.
 *
 * role="status" rather than a spinner alone, so a screen reader is told the
 * page is on its way instead of meeting silence.
 * ============================================================================
 */

export default function RouteFallback() {

    return (
        <div
            role="status"
            aria-live="polite"
            className="flex min-h-[50vh] items-center justify-center px-4 py-16"
        >
            <div className="flex flex-col items-center gap-3">

                {/*
                  Border-based ring rather than an SVG: nothing extra to
                  download at the exact moment the network is already busy.
                */}
                <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-rule border-t-gov-blue"
                    aria-hidden="true"
                />

                <p className="text-sm text-ink-muted">Loading…</p>
            </div>
        </div>
    );
}
