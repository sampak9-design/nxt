import { NextRequest, NextResponse } from "next/server";
import { getPrice, ensureAssetPrimed } from "@/lib/market-feed";

// GET /api/market/price?symbol=EURUSD
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get("symbol") || "";
  if (!symbol) return NextResponse.json({ error: "Missing symbol" }, { status: 400 });

  ensureAssetPrimed(symbol);
  const price = getPrice(symbol);

  return NextResponse.json(
    { price, symbol, time: Math.floor(Date.now() / 1000) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
