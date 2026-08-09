/**
 * ============================================================================
 * Page Container
 * ============================================================================
 *
 * Standard width and gutters for pages that do not carry their own layout.
 *
 * PublicLayout deliberately does not constrain its <main>, so that pages
 * built around a full-bleed hero band can run edge to edge. The trade-off
 * is that any page without its own wrapper sits flush against the viewport.
 * This component is that wrapper.
 *
 * Use it for plain content pages. Pages with a hero band should keep their
 * own inner containers instead, so the band itself stays full width.
 * ============================================================================
 */

export default function PageContainer({
    children,
    // Passed as a prop rather than through className: two max-w utilities on
    // one element are resolved by CSS source order, not by the order they are
    // written, so a narrower override would not reliably win.
    maxWidth = "max-w-7xl",
    className = "",
}) {
    return (
        <div className={`mx-auto w-full ${maxWidth} px-4 py-8 ${className}`}>
            {children}
        </div>
    );
}
