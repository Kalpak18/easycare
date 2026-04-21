// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function RecentRequests({ requests }: { requests: any[] }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="font-semibold mb-4">Recent Requests</h2>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th>User</th>
            <th>Service</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {requests?.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="py-2">{r.userName}</td>
              <td>{r.service}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}