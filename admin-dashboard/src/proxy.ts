import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value

  const isLoginPage = request.nextUrl.pathname === "/login"

  // If NOT logged in → redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If logged in → prevent going back to login
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard",
    "/providers",
    "/kyc",
    "/requests",
    "/categories",
    "/finance/:path*",
    "/analytics",
  ],
}
