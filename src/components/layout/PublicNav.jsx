import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Flame, Sparkles, Trophy, FilePlus2 } from "lucide-react";

import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";
import BiText from "@/components/common/BiText";
import { useAuthContext } from "@/hooks/useAuthContext";

import { ROLE_LABELS } from "@/constants/roleLabels";
import { UI } from "@/i18n/strings";

/**
 * ============================================================================
 * Public Navigation
 * ============================================================================
 *
 * Primary site navigation, present on every page - public and private.
 *
 * Left:  the four pages anyone can reach.
 * Right: File a Report, then either login controls or the user's dashboard.
 *
 * The bar is sticky. Only this strip is pinned, not the masthead above it:
 * the utility strip and masthead together are around 140px tall, and
 * pinning all of that would take a third of a laptop screen. The nav on
 * its own stays reachable without crowding the page.
 * ============================================================================
 */

export default function PublicNav() {
    const { user } = useAuthContext();
    const navigate = useNavigate();

    /*
      Why a guest cannot file a report yet, or null when nothing is being
      asked. Also used for a signed-in user whose role cannot report.
    */
    const [prompt, setPrompt] = useState(null);

    // Dashboard path differs per role
    const dashboardPath =
        user?.role === "ROLE_ADMIN"
            ? "/admin/dashboard"
            : user?.role === "ROLE_CLEANER"
              ? "/cleaner/dashboard"
              : "/citizen/dashboard";

    /**
     * Send the user to the reporting form, if they are allowed to use it.
     *
     * /citizen/report sits behind RoleRoute allowedRole="ROLE_CITIZEN".
     * Without this check a cleaner or admin clicking the button would be
     * redirected away with no explanation, which reads as a broken link.
     */
    function handleFileReport() {

        // No account yet - invite them to sign in, remembering this page
        if (!user) {
            setPrompt({
                action: "file a waste report",
                citizenOnly: false,
            });
            return;
        }

        // Signed in, but reporting belongs to citizen accounts
        if (user.role !== "ROLE_CITIZEN") {
            setPrompt({
                action: "file a waste report",
                citizenOnly: true,
            });
            return;
        }

        navigate("/citizen/report");
    }

    return (
        <>
            <nav className="sticky top-0 z-40 border-b border-rule bg-white shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">

                    {/* Primary links - always visible */}
                    <div className="flex items-center gap-1">
                        <NavLink to="/" icon={Home} {...UI.nav.home} />

                        {/*
                          Labelled Trending rather than Engagement. The page
                          ranks reports by activity, and "trending" says that
                          without needing the scoring model explained first.
                        */}
                        <NavLink
                            to="/reports/trending"
                            icon={Flame}
                            {...UI.nav.trending}
                        />

                        <NavLink
                            to="/success-stories"
                            icon={Sparkles}
                            {...UI.nav.successStories}
                        />

                        <NavLink
                            to="/leaderboard"
                            icon={Trophy}
                            {...UI.nav.leaderboard}
                        />
                    </div>

                    <div className="flex items-center gap-2">

                        {/*
                          The reason the site exists, so it is set apart from
                          the browsing links and carries the saffron accent.
                        */}
                        <button
                            type="button"
                            onClick={handleFileReport}
                            className="flex items-center gap-1.5 rounded-gov border border-saffron bg-saffron px-3 py-1.5 text-xs font-semibold text-gov-navy transition hover:bg-saffron/85"
                        >
                            <FilePlus2 size={14} aria-hidden="true" />
                            <BiText {...UI.nav.fileReport} primaryOnly />
                        </button>

                        {user ? (
                            <>
                                {/* User summary */}
                                <div className="hidden text-right sm:block">
                                    <p className="text-[10px] tracking-wide text-ink-muted uppercase">
                                        {ROLE_LABELS[user.role] || "User"}
                                    </p>

                                    {/*
                                      Email, not name: the login response
                                      carries only token, email and role.
                                    */}
                                    <p className="text-xs font-medium text-ink">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Dashboard shortcut */}
                                <Link
                                    to={dashboardPath}
                                    className="rounded-gov border border-gov-blue bg-gov-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gov-blue-dark"
                                >
                                    <BiText {...UI.account.myDashboard} primaryOnly />
                                </Link>
                            </>
                        ) : (
                            <>
                                {/* Guest: login + register */}
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="rounded-gov border border-gov-blue bg-white px-3 py-1.5 text-xs font-semibold text-gov-blue transition hover:bg-gov-blue/5"
                                >
                                    <BiText {...UI.account.login} primaryOnly />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/register")}
                                    className="rounded-gov border border-gov-blue bg-gov-blue px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gov-blue-dark"
                                >
                                    <BiText {...UI.account.register} primaryOnly />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Raised when the visitor cannot file a report yet */}
            <LoginRequiredDialog
                open={Boolean(prompt)}
                onClose={() => setPrompt(null)}
                action={prompt?.action}
                citizenOnly={prompt?.citizenOnly}
                currentRole={user?.role}
                /*
                  Land on the form after signing in, not back on whichever
                  page the button happened to be pressed from.
                */
                redirectTo="/citizen/report"
            />

        </>
    );
}

/**
 * A single nav link with icon and bilingual label.
 *
 * Takes en / hi so a UI.nav entry can be spread straight in. Below the sm
 * breakpoint both labels are dropped and the icon carries the link on its
 * own - four entries in two languages will not fit a phone width.
 */
function NavLink({ to, icon: Icon, en, hi }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-1.5 rounded-gov px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-paper hover:text-gov-blue"
            // Icon alone is not a name, so the link keeps one for narrow screens
            aria-label={en}
        >
            <Icon size={14} aria-hidden="true" />

            <span className="hidden items-center sm:inline-flex">
                <BiText
                    en={en}
                    hi={hi}
                    glossClassName="text-[10px] text-ink-muted opacity-100"
                />
            </span>
        </Link>
    );
}
