import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const valid = token ? await verifyToken(token) : null;

  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/traderoom/:path*", "/withdraw/:path*"],
};
