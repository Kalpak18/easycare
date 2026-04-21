"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api";

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-yellow-100 text-yellow-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  RESOLVED_USER: "bg-green-100 text-green-700",
  RESOLVED_PROVIDER: "bg-green-100 text-green-700",
  REJECTED: "bg-gray-100 text-gray-500",
};

const isOpen = (status: string) => status === "OPEN" || status === "UNDER_REVIEW";

export default function DisputesPage() {
  const qc = useQueryClient();
  const [resolving, setResolving] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const res = await api.get("/admin/dashboard/disputes");
      return res.data as any[];
    },
  });

  const resolve = async (id: string, resolution: string) => {
    await api.patch(`/admin/dashboard/disputes/${id}/resolve`, { resolution, note });
    setResolving(null);
    setNote("");
    qc.invalidateQueries({ queryKey: ["admin-disputes"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
        <span className="text-sm text-gray-500">{data?.length ?? 0} total</span>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-2">✅</div>
          <div className="font-semibold">No disputes</div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Raised By</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((d: any) => (
                <>
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{d.requestId.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-gray-700">{d.request?.user?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{d.request?.provider?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.raisedBy}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{d.reason ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_STYLE[d.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(d.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {isOpen(d.status) && (
                        <button
                          onClick={() => setResolving(resolving === d.id ? null : d.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                  {resolving === d.id && (
                    <tr key={`${d.id}-resolve`} className="bg-blue-50">
                      <td colSpan={8} className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          <input
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            placeholder="Resolution note…"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                          <button onClick={() => resolve(d.id, "RESOLVED_USER")} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Favour User</button>
                          <button onClick={() => resolve(d.id, "RESOLVED_PROVIDER")} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Favour Provider</button>
                          <button onClick={() => resolve(d.id, "REJECTED")} className="text-xs bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500">Reject</button>
                          <button onClick={() => setResolving(null)} className="text-xs text-gray-400 hover:underline">Cancel</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
