import { NextRequest, NextResponse } from "next/server";
import { getCandles, ensureAssetPrimed } from "@/lib/market-feed";

// GET /api/market/candles?symbol=EURUSD&tf=1m&count=500
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "";
  const tf     = searchParams.get("tf") || "1m";
  const count  = Math.min(1000, Math.max(10, parseInt(searchParams.get("count") || "500", 10)));

  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  // Ensure the market feed is running and this asset has history
  ensureAssetPrimed(symbol);

  const TF_SEC: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400 };
  const tfSec = TF_SEC[tf] ?? 60;

  // Get M1 candles and aggregate if needed
  const m1 = getCandles(symbol, count * (tfSec / 60));

  if (tfSec === 60) {
    return NextResponse.json(m1, { headers: { "Cache-Control": "no-store" } });
  }

  // Aggregate M1 → larger timeframe
  const out: any[] = [];
  let bucket: typeof m1 = [];
  let bucketStart = 0;
  for (const c of m1) {
    const start = Math.floor(c.time / tfSec) * tfSec;
    if (start !== bucketStart && bucket.length) {
      out.push({
        time: bucketStart,
        open: bucket[0].open,
        high: Math.max(...bucket.map(x => x.high)),
        low:  Math.min(...bucket.map(x => x.low)),
        close: bucket[bucket.length - 1].close,
      });
      bucket = [];
    }
    bucketStart = start;
    bucket.push(c);
  }
  if (bucket.length) {
    out.push({
      time: bucketStart,
      open: bucket[0].open,
      high: Math.max(...bucket.map(x => x.high)),
      low:  Math.min(...bucket.map(x => x.low)),
      close: bucket[bucket.length - 1].close,
    });
  }

  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
