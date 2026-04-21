"use client";

import { Bell, LogOut, UserCircle } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useRouter } from "next/navigation";

export default function Header() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-lg">Admin Dashboard</h1>

      <div className="flex items-center gap-4">
        <Bell className="cursor-pointer" />
        <UserCircle className="cursor-pointer" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}
