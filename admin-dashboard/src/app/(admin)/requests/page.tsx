"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../services/api";

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  AWAITING_CONFIRMATION: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-gray-100 text-gray-500",
  DISPUTED: "bg-red-200 text-red-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RequestsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-requests", page],
    queryFn: async () => {
      const res = await api.get(`/admin/dashboard/requests?page=${page}&limit=20`);
      return res.data;
    },
  });

  const requests = data?.requests ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All Requests</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r: { id: string; user?: { name?: string; phone?: string }; category?: { name?: string }; provider?: { name?: string }; status: string; totalAmount?: number; payment?: { mode: string; status: string }; createdAt: string }) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.user?.name ?? "—"}</div>
                    <div className="text-xs text-gray-400">{r.user?.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">{r.provider?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLE[r.status] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.totalAmount ? `₹${r.totalAmount}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.payment ? `${r.payment.mode} · ${r.payment.status}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {formatDate(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
