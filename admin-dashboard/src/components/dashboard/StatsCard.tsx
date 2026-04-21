import { ReactNode } from "react";

export default function StatsCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number | string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center">
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </div>

      <div className="text-gray-400">{icon}</div>
    </div>
  );
}