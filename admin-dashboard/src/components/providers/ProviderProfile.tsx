import { Provider } from "../../types/provider"

export default function ProviderProfile({ provider }: { provider: Provider }) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Provider Profile</h2>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Name:</span>
          <div>{provider.name}</div>
        </div>

        <div>
          <span className="text-gray-500">Email:</span>
          <div>{provider.email}</div>
        </div>

        <div>
          <span className="text-gray-500">Phone:</span>
          <div>{provider.phone}</div>
        </div>

        <div>
          <span className="text-gray-500">Status:</span>
          <div>
            {provider.blocked
              ? "Blocked"
              : provider.verified
              ? "Verified"
              : "Pending"}
          </div>
        </div>
      </div>
    </div>
  )
}