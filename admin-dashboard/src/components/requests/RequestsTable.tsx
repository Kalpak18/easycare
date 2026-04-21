"use client"

import { Request } from "../../types/request"
import { useCancelRequest } from "../../hooks/useRequests"

export default function RequestsTable({ requests }: { requests: Request[] }) {
  const cancel = useCancelRequest()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600"
      case "assigned":
        return "text-blue-600"
      case "started":
        return "text-purple-600"
      case "completed":
        return "text-green-600"
      case "cancelled":
        return "text-red-600"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th>User</th>
            <th>Service</th>
            <th>Status</th>
            <th>Provider</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {requests?.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.userName}</td>
              <td>{r.service}</td>

              <td className={getStatusColor(r.status)}>
                {r.status}
              </td>

              <td>{r.providerName || "-"}</td>

              <td>
                {r.status !== "completed" && r.status !== "cancelled" && (
                  <button
                    onClick={() => cancel.mutate(r.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}