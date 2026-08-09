import { createContext } from "react";

/**
 * ============================================================================
 * Layout Mode Context
 * ============================================================================
 *
 * Tells a page which shell it is being rendered inside.
 *
 * Four pages - all reports, trending, success stories and the leaderboard -
 * are reachable two ways: from the public navigation, where they stand alone
 * and open with a full-bleed hero band, and from the signed-in sidebar,
 * where they sit in a 288px-narrower column beside it. Same component, two
 * surroundings.
 *
 * A page cannot work this out for itself. The URL is the obvious candidate,
 * but a page does not own its own path, and reading window.location inside a
 * component means it stops matching after a client-side navigation. The
 * layout knows, so the layout says.
 *
 * basePath keeps links inside whichever shell they were followed from: a
 * report card under /app/reports points at /app/reports/5, so following it
 * does not drop a signed-in user out of their sidebar and onto the public
 * site mid-task.
 * ============================================================================
 */

/* Inside MainLayout: sidebar present, paths carry the /app prefix. */
export const APP_LAYOUT = Object.freeze({
    inApp: true,
    basePath: "/app",
});

/* Inside PublicLayout: no sidebar, paths sit at the site root. */
export const PUBLIC_LAYOUT = Object.freeze({
    inApp: false,
    basePath: "",
});

/*
  Defaults to the public shell. A page rendered outside either layout - in a
  test, or a route someone adds without a layout - then reads as the plain
  standalone version rather than an in-app fragment with no sidebar.
*/
const LayoutModeContext = createContext(PUBLIC_LAYOUT);

export default LayoutModeContext;
