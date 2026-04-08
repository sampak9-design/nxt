import { NextRequest, NextResponse } from "next/server";
import { addExposure, removeExposure, getExposureStats } from "@/lib/otc/manipulation";
import { isOtc } from "@/lib/otc/deriv-proxy";
import { verifyToken, COOKIE } from "@/lib/auth";

// POST /api/otc/expose — register an open trade
export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (!isOtc(String(body.asset || ""))) return NextResponse.json({ ok: true, skipped: "not-otc" });

  addExposure({
    id:         String(body.id),
    userId:     payload?.userId ?? null,
    vip:        !!body.vip,
    asset:      String(body.asset),
    direction:  body.direction === "down" ? "down" : "up",
    amount:     Number(body.amount) || 0,
    entryPrice: Number(body.entryPrice) || 0,
    expiresAt:  Number(body.expiresAt) || Date.now() + 60_000,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  removeExposure(new URL(req.url).searchParams.get("id") || "");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ stats: getExposureStats() });
}
