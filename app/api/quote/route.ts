import { NextRequest, NextResponse } from "next/server";

const BINANCE_MAP: Record<string, string> = {
  BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT",
  SOLUSD: "SOLUSDT", BNBUSD: "BNBUSDT",
  ADAUSD: "ADAUSDT", XRPUSD: "XRPUSDT",
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const base   = symbol.replace("-OTC", "");

  // Crypto → Binance (real-time)
  const binance = BINANCE_MAP[base];
  if (binance) {
    try {
      const res  = await fetch(
        `https://api.binance.com/api/v3/ticker/price?symbol=${binance}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      return NextResponse.json({ price: parseFloat(data.price) });
    } catch {
      return NextResponse.json({ price: null });
    }
  }

  // Forex → Twelve Data (real-time price)
  if (base.length === 6 && process.env.TWELVE_DATA_KEY) {
    try {
      const tdSymbol = `${base.slice(0, 3)}/${base.slice(3, 6)}`;
      const url = `https://api.twelvedata.com/price?symbol=${tdSymbol}&apikey=${process.env.TWELVE_DATA_KEY}`;
      const res  = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      const price = parseFloat(data.price);
      if (!isNaN(price) && price > 0) return NextResponse.json({ price });
    } catch { /* fall through */ }
  }

  // Forex → Alpha Vantage (fallback)
  if (base.length === 6 && process.env.ALPHA_VANTAGE_KEY) {
    try {
      const from = base.slice(0, 3);
      const to   = base.slice(3, 6);
      const url  = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${process.env.ALPHA_VANTAGE_KEY}`;
      const res  = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();
      const rate = data?.["Realtime Currency Exchange Rate"]?.["5. Exchange Rate"];
      if (rate) return NextResponse.json({ price: parseFloat(rate) });
    } catch { /* fall through */ }
  }

  return NextResponse.json({ price: null });
}
