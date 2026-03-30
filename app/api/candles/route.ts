import { NextRequest, NextResponse } from "next/server";

/* ── Crypto → Binance ────────────────────────────────────────────────── */
const BINANCE_MAP: Record<string, string> = {
  BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT",
  SOLUSD: "SOLUSDT", BNBUSD: "BNBUSDT",
  ADAUSD: "ADAUSDT", XRPUSD: "XRPUSDT",
};

// Binance max limit is 1000
const BINANCE_LIMIT: Record<string, number> = {
  "1m": 1000, "5m": 1000, "15m": 1000,
  "1h": 1000, "4h": 500,  "1d": 365,
};

/* ── Forex → Yahoo Finance ───────────────────────────────────────────── */
const YAHOO_TF: Record<string, { interval: string; range: string }> = {
  "1m":  { interval: "1m",  range: "7d"   },
  "5m":  { interval: "5m",  range: "60d"  },
  "15m": { interval: "15m", range: "60d"  },
  "1h":  { interval: "1h",  range: "730d" },
  "4h":  { interval: "1h",  range: "730d" },
  "1d":  { interval: "1d",  range: "5y"   },
};

const YAHOO_HEADERS = { "User-Agent": "Mozilla/5.0" };

async function fetchYahooCandles(base: string, tf: string) {
  const { interval, range } = YAHOO_TF[tf] ?? YAHOO_TF["1m"];
  const symbol = `${base}=X`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

  const res  = await fetch(url, { headers: YAHOO_HEADERS, next: { revalidate: 60 } });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;

  const timestamps: number[]   = result.timestamp ?? [];
  const quote                   = result.indicators?.quote?.[0] ?? {};
  const opens:  (number|null)[] = quote.open  ?? [];
  const highs:  (number|null)[] = quote.high  ?? [];
  const lows:   (number|null)[] = quote.low   ?? [];
  const closes: (number|null)[] = quote.close ?? [];

  const rawCandles = timestamps
    .map((t, i) => ({
      time:  t,
      open:  opens[i],
      high:  highs[i],
      low:   lows[i],
      close: closes[i],
    }))
    .filter((c) => c.open != null && c.high != null && c.low != null && c.close != null)
    .map((c) => ({
      time:  c.time,
      open:  +c.open!.toFixed(5),
      high:  +c.high!.toFixed(5),
      low:   +c.low!.toFixed(5),
      close: +c.close!.toFixed(5),
    }));

  // Remove candles with zero/invalid prices or absurd wicks
  // (market-closed artifacts: wick > 5x the candle body or price <= 0)
  const candles = rawCandles.filter((c) => {
    if (c.open <= 0 || c.close <= 0 || c.high <= 0 || c.low <= 0) return false;
    if (c.high < c.low) return false;
    const body = Math.abs(c.close - c.open) || c.open * 0.0001;
    const wick = c.high - c.low;
    if (wick > body * 100) return false; // absurd wick = gap artifact
    return true;
  });

  if (!candles.length) return null;

  if (tf === "4h") return aggregate(candles, 4);

  return candles;
}

function aggregate(candles: { time: number; open: number; high: number; low: number; close: number }[], n: number) {
  const out = [];
  for (let i = 0; i + n <= candles.length; i += n) {
    const slice = candles.slice(i, i + n);
    out.push({
      time:  slice[0].time,
      open:  slice[0].open,
      high:  Math.max(...slice.map((c) => c.high)),
      low:   Math.min(...slice.map((c) => c.low)),
      close: slice[slice.length - 1].close,
    });
  }
  return out;
}

/* ── Alpha Vantage daily ─────────────────────────────────────────────── */
async function fetchAVDaily(base: string) {
  const key  = process.env.ALPHA_VANTAGE_KEY;
  const from = base.slice(0, 3);
  const to   = base.slice(3, 6);
  // outputsize=full gives up to 20 years of daily data
  const url  = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&outputsize=full&apikey=${key}`;
  const res  = await fetch(url, { next: { revalidate: 3600 } });
  const data = await res.json();
  const series = data["Time Series FX (Daily)"];
  if (!series) return null;

  return Object.entries(series)
    .map(([date, v]: [string, any]) => ({
      time:  Math.floor(new Date(date).getTime() / 1000),
      open:  parseFloat(v["1. open"]),
      high:  parseFloat(v["2. high"]),
      low:   parseFloat(v["3. low"]),
      close: parseFloat(v["4. close"]),
    }))
    .sort((a, b) => a.time - b.time);
}

/* ── Simulation fallback ─────────────────────────────────────────────── */
const FOREX_SEED: Record<string, number> = {
  EURUSD: 1.085, GBPUSD: 1.268, USDJPY: 149.8,
  AUDUSD: 0.643, USDCAD: 1.362, USDCHF: 0.893,
  NZDUSD: 0.592, EURGBP: 0.855, EURJPY: 162.5,
  EURCHF: 0.969, GBPJPY: 190.1, AUDJPY: 96.3,
};

const TF_SEC: Record<string, number> = {
  "1m": 60, "5m": 300, "15m": 900,
  "1h": 3600, "4h": 14400, "1d": 86400,
};

function simulateCandles(seed: number, count: number, period: number) {
  const now = Math.floor(Date.now() / 1000);
  let price = seed;
  const out = [];
  const vol = seed * 0.0005;
  for (let i = count; i >= 0; i--) {
    const time  = (Math.floor(now / period) - i) * period;
    const open  = price;
    const close = +(open + (Math.random() - 0.5) * vol * 2).toFixed(5);
    const high  = +(Math.max(open, close) + Math.random() * vol).toFixed(5);
    const low   = +(Math.min(open, close) - Math.random() * vol).toFixed(5);
    out.push({ time, open, high, low, close });
    price = close;
  }
  return out;
}

/* ── Route handler ───────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const tf     = req.nextUrl.searchParams.get("tf") ?? "1m";
  const base   = symbol.replace("-OTC", "");

  // Crypto → Binance (up to 1000 candles)
  const binanceSymbol = BINANCE_MAP[base];
  if (binanceSymbol) {
    try {
      const limit = BINANCE_LIMIT[tf] ?? 500;
      const interval = tf === "4h" ? "4h" : tf;
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`,
        { cache: "no-store" }
      );
      const raw: any[][] = await res.json();
      const candles = raw.map((k) => ({
        time:  Math.floor(k[0] / 1000),
        open:  parseFloat(k[1]),
        high:  parseFloat(k[2]),
        low:   parseFloat(k[3]),
        close: parseFloat(k[4]),
      }));
      return NextResponse.json(candles);
    } catch { /* fall through */ }
  }

  // Forex daily → Alpha Vantage (full history)
  if (tf === "1d" && process.env.ALPHA_VANTAGE_KEY) {
    try {
      const candles = await fetchAVDaily(base);
      if (candles?.length) return NextResponse.json(candles);
    } catch { /* fall through */ }
  }

  // Forex intraday → Yahoo Finance (full range)
  if (base.length === 6) {
    try {
      const candles = await fetchYahooCandles(base, tf);
      if (candles?.length) return NextResponse.json(candles);
    } catch { /* fall through */ }
  }

  // Fallback simulation — try to get real price first so simulation matches live quote
  let seed = FOREX_SEED[base] ?? 1.0;
  try {
    const binanceSym = BINANCE_MAP[base];
    if (binanceSym) {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSym}`, { cache: "no-store" });
      const d = await r.json();
      if (d?.price) seed = parseFloat(d.price);
    }
  } catch { /* keep seed */ }
  const period = TF_SEC[tf] ?? 60;
  return NextResponse.json(simulateCandles(seed, 500, period));
}
