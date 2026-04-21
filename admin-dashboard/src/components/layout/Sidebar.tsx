"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Briefcase,
  Folder,
  ListChecks,
  AlertTriangle,
  Wallet,
  BarChart3,
} from "lucide-react";

const menu = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Providers", href: "/providers", icon: Users },
  { name: "KYC", href: "/kyc", icon: ShieldCheck },
  { name: "Workers", href: "/workers", icon: Briefcase },
  { name: "Categories", href: "/categories", icon: Folder },
  { name: "Requests", href: "/requests", icon: ListChecks },
  { name: "Disputes", href: "/disputes", icon: AlertTriangle },
  { name: "Finance", href: "/finance/wallets", icon: Wallet },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white border-r">
      <div className="p-6 text-xl font-bold">EasyCare Admin</div>

      <nav className="flex flex-col gap-1 px-3">
        {menu.map((item) => {
          const Icon = item.icon;

          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition",
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}