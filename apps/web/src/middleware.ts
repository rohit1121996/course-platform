import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value;

  // If logged in, don't allow access to /login page
  if (request.nextUrl.pathname === "/login" && userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect root / and /saved paths
  if (request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/saved")) {
    if (!userId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/saved/:path*", "/login"],
};
