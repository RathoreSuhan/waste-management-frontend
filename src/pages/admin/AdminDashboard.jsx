import StatCard from "@/components/common/StatCard";

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Total Users"
                    value="1,284"
                    description="Citizens, cleaners, and admins across the platform."
                    accent="blue"
                />
                <StatCard
                    title="Pending Requests"
                    value="42"
                    description="New reports awaiting review."
                    accent="amber"
                />
                <StatCard
                    title="Resolution Rate"
                    value="94%"
                    description="Strong operational performance this week."
                    accent="emerald"
                />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Platform Overview</h2>
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="font-medium text-slate-800">New waste reports are increasing steadily</p>
                        <p className="mt-1 text-sm text-slate-500">Daily volume has risen by 12% compared to last week.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="font-medium text-slate-800">Cleaner assignments are being distributed effectively</p>
                        <p className="mt-1 text-sm text-slate-500">Coverage remains balanced across all active zones.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}