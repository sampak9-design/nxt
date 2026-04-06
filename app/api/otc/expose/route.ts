import { NextRequest, NextResponse } from "next/server";
import { addExposure, removeExposure, getExposureStats } from "@/lib/otc/manipulation";
import { verifyToken, COOKIE } from "@/lib/auth";
import { isOtcAsset } from "@/lib/otc/replayer";

// POST /api/otc/expose — register an open trade for manipulation tracking
// body: { id, asset, direction, amount, entryPrice, expiresAt, vip? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  const asset = (body.asset || "").replace("-OTC", "");
  if (!isOtcAsset(asset)) {
    return NextResponse.json({ ok: true, skipped: "not-otc" });
  }

  addExposure({
    id:         String(body.id),
    userId:     payload?.userId ?? null,
    vip:        !!body.vip,
    asset,
    direction:  body.direction === "down" ? "down" : "up",
    amount:     Number(body.amount) || 0,
    entryPrice: Number(body.entryPrice) || 0,
    expiresAt:  Number(body.expiresAt) || Date.now() + 60_000,
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/otc/expose?id=... — remove a trade (e.g. resolved)
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id") || "";
  removeExposure(id);
  return NextResponse.json({ ok: true });
}

// GET /api/otc/expose — stats for admin
export async function GET() {
  return NextResponse.json({ stats: getExposureStats() });
}
