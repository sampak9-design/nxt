import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "zyro-default-secret-change-in-production"
);
const ADMIN_COOKIE = "zyro_admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip admin auth endpoints themselves
  if (pathname === "/api/admin/auth") return NextResponse.next();

  // Protect /admin page — redirect to /admin/login if no valid admin cookie
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    // Allow /admin/login page
    if (pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!payload.userId) throw new Error("no userId");
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // Protect /api/admin/* — return 401 if no valid admin cookie
  if (pathname.startsWith("/api/admin/")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!payload.userId) throw new Error("no userId");
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
