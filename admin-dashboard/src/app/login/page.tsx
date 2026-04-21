/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { adminAuthService } from "../../services/adminAuth.service";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
  try {
    const res = await adminAuthService.login({ email, password })

    // Save in localStorage
    localStorage.setItem("admin_token", res.accessToken)

    // ✅ ALSO save in cookie (for middleware)
    document.cookie = `admin_token=${res.accessToken}; path=/`

    router.push("/dashboard")
  } catch (err) {
    alert("Invalid credentials")
  }
}

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white p-6 rounded shadow w-80 space-y-4">
        <h1 className="text-lg font-semibold">Admin Login</h1>

        <input
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-black text-white py-2 rounded"
        >
          Login
        </button>
      </div>
    </div>
  );
}