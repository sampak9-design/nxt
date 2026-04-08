import { NextRequest, NextResponse } from "next/server";
import { getHistoricalCandles, isOtcAsset, getCurrentCandle } from "@/lib/otc/replayer";

// GET /api/otc/candles?symbol=EURUSD-OTC&tf=1m&count=500
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "";
  const tf     = searchParams.get("tf") || "1m";
  const count  = Math.min(1000, Math.max(10, parseInt(searchParams.get("count") || "500", 10)));

  if (!isOtcAsset(symbol)) {
    return NextResponse.json({ error: "Unknown OTC symbol" }, { status: 400 });
  }

  const TF_SEC: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900 };
  const tfSec = TF_SEC[tf];
  if (!tfSec) return NextResponse.json({ error: "Unsupported timeframe" }, { status: 400 });

  const history = getHistoricalCandles(symbol, tfSec, count);
  const current = getCurrentCandle(symbol, tfSec);
  const candles = current ? [...history, current] : history;

  return NextResponse.json({ candles }, { headers: { "Cache-Control": "no-store" } });
}
