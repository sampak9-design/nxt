import { NextRequest, NextResponse } from "next/server";
import { isOtc, getCandles, getDecimals } from "@/lib/otc/deriv-proxy";

// GET /api/otc/candles?symbol=EURUSD-OTC&tf=1m&count=500
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") || "";
  const tf     = searchParams.get("tf") || "1m";
  const count  = Math.min(1000, Math.max(10, parseInt(searchParams.get("count") || "500", 10)));

  if (!isOtc(symbol)) return NextResponse.json({ error: "Unknown OTC symbol" }, { status: 400 });

  const TF_SEC: Record<string, number> = { "1m": 60, "5m": 300, "15m": 900 };
  const tfSec = TF_SEC[tf];
  if (!tfSec) return NextResponse.json({ error: "Unsupported timeframe" }, { status: 400 });

  const m1 = getCandles(symbol, count * (tfSec / 60));
  // Aggregate M1 → tfSec
  const dec = getDecimals(symbol);
  const out: any[] = [];
  if (tfSec === 60) {
    for (const c of m1) out.push({
      time: c.time,
      open: +c.open.toFixed(dec),
      high: +c.high.toFixed(dec),
      low:  +c.low.toFixed(dec),
      close:+c.close.toFixed(dec),
    });
  } else {
    const minutesPerCandle = tfSec / 60;
    let bucket: typeof m1 = [];
    let bucketStart = 0;
    for (const c of m1) {
      const start = Math.floor(c.time / tfSec) * tfSec;
      if (start !== bucketStart) {
        if (bucket.length) {
          out.push({
            time: bucketStart,
            open: +bucket[0].open.toFixed(dec),
            high: +Math.max(...bucket.map((x) => x.high)).toFixed(dec),
            low:  +Math.min(...bucket.map((x) => x.low)).toFixed(dec),
            close:+bucket[bucket.length - 1].close.toFixed(dec),
          });
        }
        bucket = [];
        bucketStart = start;
      }
      bucket.push(c);
      if (bucket.length === minutesPerCandle) {
        out.push({
          time: bucketStart,
          open: +bucket[0].open.toFixed(dec),
          high: +Math.max(...bucket.map((x) => x.high)).toFixed(dec),
          low:  +Math.min(...bucket.map((x) => x.low)).toFixed(dec),
          close:+bucket[bucket.length - 1].close.toFixed(dec),
        });
        bucket = [];
        bucketStart = 0;
      }
    }
  }

  return NextResponse.json({ candles: out }, { headers: { "Cache-Control": "no-store" } });
}
