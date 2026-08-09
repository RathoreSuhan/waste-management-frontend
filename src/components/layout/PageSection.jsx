import useLayoutMode from "@/hooks/useLayoutMode";

/**
 * ============================================================================
 * Page Section
 * ============================================================================
 *
 * Body wrapper for the four pages that serve both shells.
 *
 * On the public site these pages supply their own width and gutters, since
 * PublicLayout deliberately leaves <main> unconstrained so hero bands can
 * run edge to edge. Inside the signed-in shell MainLayout has already
 * applied max-w-7xl and its own padding, so repeating them here would
 * indent the content twice and narrow an already reduced column further.
 *
 * So: full wrapper on the public site, bare passthrough in-app.
 * ============================================================================
 */

export default function PageSection({ children, className = "" }) {

    const { inApp } = useLayoutMode();

    if (inApp) {
        /*
          Only vertical rhythm below the heading. Width and gutters belong
          to the layout here, not to the page.
        */
        return <div className={`mt-5 ${className}`}>{children}</div>;
    }

    return (
        <section className={`mx-auto max-w-7xl px-4 py-10 ${className}`}>
            {children}
        </section>
    );
}
