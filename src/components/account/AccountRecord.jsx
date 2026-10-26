import {
    Award,
    Building2,
    Calendar,
    FileText,
    Mail,
    MapPin,
    MessageSquare,
    Sparkles,
    ThumbsUp,
} from "lucide-react";

import RoleBadge from "@/components/admin/RoleBadge";
import { ROLES, getCleanerTypeLabel } from "@/constants/adminConstants";
import { formatDateTime } from "@/utils/formatters";

/**
 * Read-only identity and activity record used for an administrator's account
 * view and for a signed-in person's own profile. Administrative controls stay
 * with the admin page rather than being accepted by this component.
 */
export default function AccountRecord({ user, compact = false }) {
    const isCleaner = user?.role === ROLES.CLEANER;
    const recordGridClass = compact ? "grid" : "grid sm:grid-cols-2";
    const activityGridClass = compact
        ? "grid grid-cols-2 divide-x divide-y divide-rule"
        : "grid grid-cols-2 divide-x divide-y divide-rule sm:grid-cols-4 sm:divide-y-0";

    return (
        <div className="overflow-hidden rounded-gov border border-rule bg-white">
            <div className="border-b border-rule bg-paper px-5 py-4">
                <h2 className="font-serif text-lg font-bold text-gov-navy">Identity</h2>
                <p className="mt-1 text-sm text-ink-muted">
                    Registered account details and role on Clean Bharat.
                </p>
            </div>

            <dl className={recordGridClass}>
                <RecordField icon={Mail} label="Email" value={user.email} />
                <RecordField icon={MapPin} label="Location" value={[user.city, user.state].filter(Boolean).join(", ") || "—"} />
                <RecordField icon={Calendar} label="Account Created" value={formatDateTime(user.createdAt)} />
                <RecordField icon={Building2} label="Organisation" value={user.organizationName || "—"} />
                <div className={`border-t border-rule p-4 ${compact ? "" : "sm:border-r"}`}>
                    <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Role</dt>
                    <dd className="mt-1.5"><RoleBadge role={user.role} /></dd>
                </div>
                {isCleaner && (
                    <RecordField icon={Building2} label="Cleaner Type" value={getCleanerTypeLabel(user.cleanerType)} />
                )}
            </dl>

            <div className="border-t border-rule">
                <div className="bg-paper px-5 py-3">
                    <h2 className="text-xs font-semibold tracking-[0.15em] text-ink-muted uppercase">
                        Platform Activity
                    </h2>
                </div>

                <div className={activityGridClass}>
                    <ActivityFigure icon={FileText} label="Reports Filed" value={user.reportsCreated ?? 0} />
                    <ActivityFigure icon={MessageSquare} label="Comments" value={user.comments ?? 0} />
                    <ActivityFigure icon={ThumbsUp} label="Urgency Ratings" value={user.votes ?? 0} />
                    <ActivityFigure
                        icon={isCleaner ? Sparkles : Award}
                        label={isCleaner ? "Cleanups Completed" : "Reward Points"}
                        value={isCleaner ? (user.completedCleanups ?? 0) : (user.rewardPoints ?? 0)}
                    />
                </div>

                {isCleaner && (
                    <div className="flex items-center justify-between border-t border-rule bg-paper px-5 py-3">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                            <Award size={15} className="text-saffron" aria-hidden="true" />
                            Reward Points Earned
                        </span>
                        <span className="text-lg font-bold text-gov-navy">{user.rewardPoints ?? 0}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function RecordField({ icon: Icon, label, value }) {
    return (
        <div className="min-w-0 border-t border-rule p-4 sm:border-r">
            <dt className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                <Icon size={14} aria-hidden="true" /> {label}
            </dt>
            <dd className="mt-1 break-words text-sm font-medium text-ink">{value}</dd>
        </div>
    );
}

function ActivityFigure({ icon: Icon, label, value }) {
    return (
        <div className="p-4 text-center">
            <Icon size={16} className="mx-auto text-ink-muted" aria-hidden="true" />
            <p className="mt-1.5 text-xl font-bold text-gov-navy">{value}</p>
            <p className="mt-0.5 break-words text-[11px] leading-snug tracking-wide text-ink-muted uppercase">{label}</p>
        </div>
    );
}