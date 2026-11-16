import { NextResponse, type NextRequest } from "next/server";

// Cookie name duplicated from lib/auth (that module is server-only); keep in sync.
const SESSION_COOKIE = "c2v_session";
const PUBLIC_PATHS = ["/session-expired"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname === "/login" || pathname === "/p" || pathname.startsWith("/p/");
}

/** Optimistic guard: cookie presence only. The API validates the token on every call. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (pathname === "/login") {
    if (hasSession) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }
  if (isPublic(pathname)) return NextResponse.next();
  if (!hasSession) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
