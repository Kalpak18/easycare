"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../services/api";

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const res = await api.get("/admin/categories");
      return res.data as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post("/admin/categories", { name });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setNewName("");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/admin/categories/${id}/deactivate`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Categories</h1>

      {/* Add new */}
      <div className="bg-white rounded-xl shadow p-4 flex gap-3">
        <input
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="New category name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newName.trim()) createMutation.mutate(newName.trim());
          }}
        />
        <button
          onClick={() => newName.trim() && createMutation.mutate(newName.trim())}
          disabled={createMutation.isPending || !newName.trim()}
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data ?? []).map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive && (
                      <button
                        onClick={() => deactivateMutation.mutate(c.id)}
                        disabled={deactivateMutation.isPending}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    )}
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
