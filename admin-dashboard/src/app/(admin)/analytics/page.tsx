"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api";
import RevenueChart from "../../../components/dashboard/RevenueChart";

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/stats");
      return res.data;
    },
  });

  const { data: revenue } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/revenue");
      return res.data as any[];
    },
  });

  const fmt = (n: number) => n?.toLocaleString("en-IN") ?? "0";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Total Users" value={fmt(stats?.totalUsers)} />
        <StatBox label="Total Providers" value={fmt(stats?.totalProviders)} />
        <StatBox label="Total Requests" value={fmt(stats?.totalRequests ?? 0)} />
        <StatBox label="Completed" value={fmt(stats?.totalCompleted ?? 0)} />
        <StatBox label="Today's Requests" value={fmt(stats?.todayRequests)} />
        <StatBox label="Today Completed" value={fmt(stats?.todayCompleted)} />
        <StatBox label="Today Revenue" value={`₹${fmt(stats?.todayRevenue)}`} />
        <StatBox label="Pending KYC" value={fmt(stats?.pendingKyc)} />
      </div>

      {revenue && revenue.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">7-Day Revenue</h2>
          <RevenueChart data={revenue} />
        </div>
      )}
    </div>
  );
}
