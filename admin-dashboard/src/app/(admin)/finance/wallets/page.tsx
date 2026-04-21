"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../../services/api";
import { useState } from "react";

export default function FinanceWalletsPage() {
  const qc = useQueryClient();
  const [commissionCategoryId, setCommissionCategoryId] = useState("");
  const [commissionRate, setCommissionRate] = useState("");

  const { data: wallets, isLoading } = useQuery({
    queryKey: ["admin-wallets"],
    queryFn: async () => {
      const res = await api.get("/admin/finance/wallets");
      return res.data as any[];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await api.get("/admin/categories");
      return res.data as any[];
    },
  });

  const commissionMutation = useMutation({
    mutationFn: async ({ categoryId, percentage }: { categoryId: string; percentage: number }) => {
      const res = await api.post("/admin/finance/commission", { categoryId, percentage });
      return res.data;
    },
    onSuccess: () => {
      setCommissionCategoryId("");
      setCommissionRate("");
      alert("Commission updated");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Finance & Wallets</h1>

      {/* Commission settings */}
      <div className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Set Commission Rate</h2>
        <div className="flex gap-3">
          <select
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={commissionCategoryId}
            onChange={(e) => setCommissionCategoryId(e.target.value)}
          >
            <option value="">Select category…</option>
            {(categories ?? []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="% (e.g. 15)"
            className="w-32 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
          />
          <button
            onClick={() =>
              commissionMutation.mutate({
                categoryId: commissionCategoryId,
                percentage: parseFloat(commissionRate),
              })
            }
            disabled={commissionMutation.isPending || !commissionCategoryId || !commissionRate}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Wallets table */}
      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Total Earned</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(wallets ?? []).map((w: any) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{w.provider?.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{w.provider?.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{w.balance?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">₹{w.totalEarned?.toFixed(2) ?? "0.00"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${w.blocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {w.blocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
