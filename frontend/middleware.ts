import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token");

  // Allow access to public routes like /login and /register
  if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")) {
    return NextResponse.next();
  }

  // If no token is present, redirect to the login page
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to proceed for authenticated routes
  return NextResponse.next();
}
