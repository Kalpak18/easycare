"use client";

import StatsCard from "../../../components/dashboard/StatsCard";
import RevenueChart from "../../../components/dashboard/RevenueChart";
import SocketListener from "../../../components/realtime/SocketListener";
import { useSocketStore } from "../../../store/socketStore";
import { useDashboardStats, useRevenueStats, useRecentRequests } from "../../../hooks/useDashboard";

const STATUS_COLOR: Record<string, string> = {
  OPEN: "text-yellow-600",
  ASSIGNED: "text-blue-600",
  IN_PROGRESS: "text-purple-600",
  AWAITING_CONFIRMATION: "text-orange-500",
  COMPLETED: "text-green-600",
  CANCELLED: "text-red-500",
  EXPIRED: "text-gray-400",
};

function fmt(n: number) {
  return n?.toLocaleString("en-IN") ?? "0";
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: revenue } = useRevenueStats();
  const { data: recent } = useRecentRequests();
  const activeJobs = useSocketStore((s) => s.activeJobs);
  const onlineProviders = useSocketStore((s) => s.onlineProviders);

  return (
    <>
      <SocketListener />

      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats grid */}
        {statsLoading ? (
          <div className="text-gray-400">Loading stats…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="Active Jobs"
              value={activeJobs || stats?.activeJobs || 0}
            />
            <StatsCard
              title="Online Providers"
              value={onlineProviders || stats?.onlineProviders || 0}
            />
            <StatsCard title="Total Providers" value={fmt(stats?.totalProviders)} />
            <StatsCard title="Total Users" value={fmt(stats?.totalUsers)} />
            <StatsCard title="Today's Requests" value={fmt(stats?.todayRequests)} />
            <StatsCard title="Today Completed" value={fmt(stats?.todayCompleted)} />
            <StatsCard title="Pending KYC" value={fmt(stats?.pendingKyc)} />
            <StatsCard
              title="Today Revenue"
              value={`₹${fmt(stats?.todayRevenue)}`}
            />
          </div>
        )}

        {/* Revenue chart */}
        {revenue && revenue.length > 0 && (
          <RevenueChart data={revenue} />
        )}

        {/* Recent requests */}
        {recent && recent.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold mb-4 text-gray-900">Recent Requests</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Service</th>
                  <th className="pb-2">Provider</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r: { id: string; user?: { name?: string }; category?: { name?: string }; provider?: { name?: string }; status: string; totalAmount?: number }) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.user?.name ?? "—"}</td>
                    <td>{r.category?.name ?? "—"}</td>
                    <td>{r.provider?.name ?? "—"}</td>
                    <td className={STATUS_COLOR[r.status] ?? "text-gray-500"}>
                      {r.status}
                    </td>
                    <td>{r.totalAmount ? `₹${r.totalAmount}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
