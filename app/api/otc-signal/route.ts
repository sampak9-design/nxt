import { NextRequest, NextResponse } from "next/server";

export type OtcSignal = {
  assetId: string;
  direction: "up" | "down";
  strength: number;   // 0.1 – 1.0
  expiresAt: number;  // ms timestamp
  createdAt: number;
};

// In-memory store — persists for the lifetime of the server process
const signals = new Map<string, OtcSignal>();

// Purge expired signals on each request
function purge() {
  const now = Date.now();
  for (const [id, s] of signals) {
    if (s.expiresAt <= now) signals.delete(id);
  }
}

// GET /api/otc-signal              → all active signals
// GET /api/otc-signal?assetId=XXX  → single signal for asset
export async function GET(req: NextRequest) {
  purge();
  const assetId = req.nextUrl.searchParams.get("assetId");
  if (assetId) {
    const s = signals.get(assetId) ?? null;
    return NextResponse.json({ signal: s });
  }
  return NextResponse.json({ signals: Array.from(signals.values()) });
}

// POST /api/otc-signal
// body: { assetId, direction, strength, durationMs }
export async function POST(req: NextRequest) {
  purge();
  const body = await req.json();
  const { assetId, direction, strength = 0.5, durationMs = 60_000 } = body;
  if (!assetId || !direction) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const signal: OtcSignal = {
    assetId,
    direction,
    strength: Math.min(1, Math.max(0.05, strength)),
    expiresAt: Date.now() + durationMs,
    createdAt: Date.now(),
  };
  signals.set(assetId, signal);
  return NextResponse.json({ signal });
}

// DELETE /api/otc-signal?assetId=XXX
export async function DELETE(req: NextRequest) {
  const assetId = req.nextUrl.searchParams.get("assetId");
  if (assetId) signals.delete(assetId);
  else signals.clear();
  return NextResponse.json({ ok: true });
}
