import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session-cookie";

const PUBLIC_PATHS = ["/session-expired"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname === "/login" || pathname === "/p" || pathname.startsWith("/p/");
}

/** Optimistic guard: cookie presence only. The API validates the token on every call. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (pathname === "/login") {
    // Only GET: Server Action POSTs to /login must pass through.
    if (hasSession && request.method === "GET") return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }
  if (isPublic(pathname)) return NextResponse.next();
  if (!hasSession) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
