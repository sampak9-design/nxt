import { NextRequest, NextResponse } from "next/server";
import { getCurrentCandle, isOtcAsset } from "@/lib/otc/replayer";
import { applyManipulation } from "@/lib/otc/manipulation";

// GET /api/otc/tick?symbol=EURUSD-OTC&tf=1m
// Returns the live forming candle with manipulation applied to `close`.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "";
  const tf     = searchParams.get("tf") || "1m";

  if (!isOtcAsset(symbol)) {
    return NextResponse.json({ error: "Unknown OTC symbol" }, { status: 400 });
  }

  const TF_SEC: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900 };
  const tfSec = TF_SEC[tf];
  if (!tfSec) return NextResponse.json({ error: "Unsupported timeframe" }, { status: 400 });

  const current = getCurrentCandle(symbol, tfSec);
  if (!current) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const base = symbol.replace("-OTC", "");
  const manipulatedClose = applyManipulation(base, current.close);

  return NextResponse.json(
    {
      time: current.time,
      open: current.open,
      high: Math.max(current.high, manipulatedClose),
      low:  Math.min(current.low, manipulatedClose),
      close: manipulatedClose,
      price: manipulatedClose,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
