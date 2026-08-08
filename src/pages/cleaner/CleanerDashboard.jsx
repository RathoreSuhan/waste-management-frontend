import StatCard from "@/components/common/StatCard";

export default function CleanerDashboard() {
    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Open Tasks"
                    value="7"
                    description="Cleanup jobs waiting in your assigned area."
                    accent="amber"
                />
                <StatCard
                    title="Completed Today"
                    value="4"
                    description="Great progress for the current shift."
                    accent="emerald"
                />
                <StatCard
                    title="Efficiency"
                    value="89%"
                    description="Your completion rate is above average."
                    accent="blue"
                />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Today’s Assignments</h2>
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="font-medium text-slate-800">Street cleanup near Sector 12</p>
                        <p className="mt-1 text-sm text-slate-500">Priority: High • Due in 2 hours</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                        <p className="font-medium text-slate-800">Drain clearance in local market</p>
                        <p className="mt-1 text-sm text-slate-500">Priority: Medium • Due later today</p>
                    </div>
                </div>
            </section>
        </div>
    );
}