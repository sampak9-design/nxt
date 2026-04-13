import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "zyro-default-secret-change-in-production"
);
const ADMIN_COOKIE = "zyro_admin";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin auth endpoint — always allow ──
  if (pathname === "/api/admin/auth") return NextResponse.next();

  // ── Admin login page — always allow ──
  if (pathname === "/admin/login") return NextResponse.next();

  // ── Protect /admin pages ──
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!payload.userId) throw new Error("no userId");
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // ── Protect /api/admin/* ──
  if (pathname.startsWith("/api/admin/")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const { payload } = await jwtVerify(token, SECRET);
      if (!payload.userId) throw new Error("no userId");
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Protect traderoom/withdraw — require user login ──
  if (pathname.startsWith("/traderoom") || pathname.startsWith("/withdraw") || pathname.startsWith("/history") || pathname.startsWith("/verify")) {
    const token = req.cookies.get(COOKIE)?.value;
    const valid = token ? await verifyToken(token) : null;
    if (!valid) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/traderoom/:path*", "/withdraw/:path*", "/history/:path*", "/verify/:path*", "/admin/:path*", "/api/admin/:path*"],
};
