import { NextRequest, NextResponse } from "next/server";
import { isOtc, getCurrentPrice, getDecimals } from "@/lib/otc/deriv-proxy";
import { applyManipulation } from "@/lib/otc/manipulation";

// GET /api/otc/tick?symbol=EURUSD-OTC
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get("symbol") || "";
  if (!isOtc(symbol)) return NextResponse.json({ error: "Unknown OTC symbol" }, { status: 400 });

  const fair = getCurrentPrice(symbol);
  if (!fair) return NextResponse.json({ error: "No data yet" }, { status: 503 });

  const dec = getDecimals(symbol);
  const manipulated = applyManipulation(symbol, fair);
  const final = +manipulated.toFixed(dec);

  return NextResponse.json(
    { price: final, fair: +fair.toFixed(dec), time: Math.floor(Date.now() / 1000) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
