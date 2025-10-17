import { type NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("sb-auth-token")?.value
  const pathname = request.nextUrl.pathname

  console.log("[v0] Middleware - Path:", pathname, "Has token:", !!authToken)

  // Allow auth pages without token
  if (pathname.startsWith("/auth")) {
    return NextResponse.next()
  }

  // Redirect to login if no token
  if (!authToken) {
    console.log("[v0] Middleware - No token, redirecting to login")
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  console.log("[v0] Middleware - Token found, allowing access")
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
