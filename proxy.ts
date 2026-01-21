import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = request.cookies.get("vero_authed")?.value === "1";
  const verification = request.cookies.get("vero_verification")?.value;
  const isAdmin = request.cookies.get("vero_admin")?.value === "1";

  const isProtected =
    pathname.startsWith("/feed") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/dm") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/promocoes") ||
    pathname.startsWith("/subscricao");
  const isVerify = pathname.startsWith("/verify");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isProtected) {
    if (!authed) return NextResponse.redirect(new URL("/login", request.url));
    if (verification !== "approved") return NextResponse.redirect(new URL("/verify", request.url));
  }

  if (isVerify) {
    if (!authed) return NextResponse.redirect(new URL("/login", request.url));
    if (verification === "approved") return NextResponse.redirect(new URL("/feed", request.url));
  }

  if (isAdminRoute) {
    if (!authed) return NextResponse.redirect(new URL("/feed", request.url));
    if (!isAdmin) return NextResponse.redirect(new URL("/feed", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/feed/:path*",
    "/profile/:path*",
    "/dm/:path*",
    "/settings/:path*",
    "/promocoes/:path*",
    "/subscricao/:path*",
    "/verify/:path*",
    "/admin/:path*",
  ],
};
