"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api";
import Link from "next/link";

export default function WorkersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", categoryId: "", city: "", state: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () => {
      const res = await api.get("/admin/providers");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.categoryId) return;
    setSubmitting(true);
    try {
      await api.post("/admin/providers/company-worker", form);
      setForm({ name: "", phone: "", categoryId: "", city: "", state: "" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["admin-providers"] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Workers (Providers)</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Company Worker"}
        </button>
      </div>

      {/* Add Company Worker Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏢</span>
            <h2 className="font-semibold text-blue-800">Add Company Worker</h2>
            <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">Auto-verified · No KYC required</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                placeholder="Ravi Kumar"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Phone *</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Service Category *</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none bg-white"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                required
              >
                <option value="">Select category…</option>
                {(categories ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">City</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                placeholder="Bengaluru"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">State</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
                placeholder="Karnataka"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Creating…" : "Create Company Worker"}
          </button>
        </form>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Company Worker (auto-verified)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Independent (KYC required)</span>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Online</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Jobs</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(providers ?? []).map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.source === "COMPANY" ? (
                      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">🏢 Company</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-orange-100 text-orange-700">👤 Independent</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.isVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {p.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.isOnline ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isOnline ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.wallet ? `₹${p.wallet.balance?.toFixed(2)}` : "—"}
                    {p.wallet?.blocked && <span className="ml-1 text-xs text-red-500">(blocked)</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p._count?.assignedRequests ?? 0}</td>
                  <td className="px-4 py-3">
                    <Link href={`/providers/${p.id}`} className="text-xs text-blue-600 hover:underline">
                      View
                    </Link>
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
