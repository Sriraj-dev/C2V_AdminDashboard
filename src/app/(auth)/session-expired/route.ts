import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/** Server Components can't clear cookies, so an expired session lands here, then goes to /login. */
export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login?expired=1", request.url), 307);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
