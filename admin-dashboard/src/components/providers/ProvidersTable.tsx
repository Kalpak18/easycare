"use client"

import { Provider } from "../../types/provider"
import {
  useVerifyProvider,
  useBlockProvider,
  useUnblockProvider
} from "../../hooks/useProviders"

export default function ProvidersTable({ providers }: { providers: Provider[] }) {
  const verify = useVerifyProvider()
  const block = useBlockProvider()
  const unblock = useUnblockProvider()

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {providers?.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-2">{p.name}</td>
              <td>{p.email}</td>
              <td>{p.phone}</td>

              <td>
                {p.blocked
                  ? "Blocked"
                  : p.verified
                  ? "Verified"
                  : "Pending"}
              </td>

              <td className="flex gap-2">
                <a
                  href={`/providers/${p.id}`}
                  className="px-3 py-1 bg-gray-800 text-white rounded"
                >
                  View
                </a>

                {!p.verified && (
                  <button
                    onClick={() => verify.mutate(p.id)}
                    className="px-3 py-1 bg-green-600 text-white rounded"
                  >
                    Verify
                  </button>
                )}

                {!p.blocked ? (
                  <button
                    onClick={() => block.mutate(p.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Block
                  </button>
                ) : (
                  <button
                    onClick={() => unblock.mutate(p.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Unblock
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