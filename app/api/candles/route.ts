import { NextRequest, NextResponse } from "next/server";

/* ── In-memory cache to protect API credits ──────────────────────────── */
const memCache = new Map<string, { data: any; expiresAt: number }>();
function memGet(key: string) {
  const entry = memCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}
function memSet(key: string, data: any, ttlMs: number) {
  memCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/* ── Crypto → Binance ────────────────────────────────────────────────── */
const BINANCE_MAP: Record<string, string> = {
  BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT",
  SOLUSD: "SOLUSDT", BNBUSD: "BNBUSDT",
  ADAUSD: "ADAUSDT", XRPUSD: "XRPUSDT",
};

const BINANCE_LIMIT: Record<string, number> = {
  "1m": 1000, "5m": 1000, "15m": 1000,
  "1h": 1000, "4h": 500,  "1d": 365,
};

/* ── Forex → Twelve Data ─────────────────────────────────────────────── */
const TD_INTERVAL: Record<string, string> = {
  "1m": "1min", "5m": "5min", "15m": "15min",
  "1h": "1h",   "4h": "4h",   "1d": "1day",
};

const TD_OUTPUTSIZE: Record<string, number> = {
  "1m": 500, "5m": 500, "15m": 500,
  "1h": 500, "4h": 500, "1d": 500,
};

function toTwelveSymbol(base: string): string {
  // EURUSD → EUR/USD
  return `${base.slice(0, 3)}/${base.slice(3, 6)}`;
}

async function fetchTwelveDataCandles(base: string, tf: string) {
  const key = process.env.TWELVE_DATA_KEY;
  if (!key) return null;

  const symbol     = toTwelveSymbol(base);
  const interval   = TD_INTERVAL[tf] ?? "1min";
  const outputsize = TD_OUTPUTSIZE[tf] ?? 500;

  // In-memory cache: 1m=60s, 5m=3min, 1h+=10min — protects daily credit limit
  const ttlMs = interval === "1min" ? 60_000 : interval === "5min" ? 180_000 : 600_000;
  const cacheKey = `td:${base}:${tf}`;
  const cached = memGet(cacheKey);
  if (cached) return cached;

  const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&timezone=UTC&dp=5&apikey=${key}`;
  const res  = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  if (data.status === "error" || !Array.isArray(data.values)) return null;

  const candles = (data.values as any[])
    .map((v) => ({
      time:  Math.floor(new Date(v.datetime.replace(" ", "T") + "Z").getTime() / 1000),
      open:  parseFloat(v.open),
      high:  parseFloat(v.high),
      low:   parseFloat(v.low),
      close: parseFloat(v.close),
    }))
    .filter((c) => !isNaN(c.open) && !isNaN(c.close) && c.open > 0)
    .sort((a, b) => a.time - b.time);

  if (!candles.length) return null;
  memSet(cacheKey, candles, ttlMs);
  return candles;
}

/* ── Forex → Yahoo Finance (fallback) ───────────────────────────────── */
const YAHOO_TF: Record<string, { interval: string; range: string }> = {
  "1m":  { interval: "1m",  range: "1d"  },
  "5m":  { interval: "5m",  range: "5d"  },
  "15m": { interval: "15m", range: "5d"  },
  "1h":  { interval: "1h",  range: "60d" },
  "4h":  { interval: "1h",  range: "60d" },
  "1d":  { interval: "1d",  range: "2y"  },
};

async function fetchYahooCandles(base: string, tf: string) {
  const { interval, range } = YAHOO_TF[tf] ?? YAHOO_TF["1m"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${base}=X?interval=${interval}&range=${range}`;
  const res  = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } });
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) return null;

  const timestamps: number[]   = result.timestamp ?? [];
  const quote                   = result.indicators?.quote?.[0] ?? {};

  const candles = timestamps
    .map((t, i) => ({
      time:  t,
      open:  quote.open?.[i],
      high:  quote.high?.[i],
      low:   quote.low?.[i],
      close: quote.close?.[i],
    }))
    .filter((c) => c.open != null && c.high != null && c.low != null && c.close != null)
    .map((c) => ({
      time:  c.time,
      open:  +c.open!.toFixed(5),
      high:  +c.high!.toFixed(5),
      low:   +c.low!.toFixed(5),
      close: +c.close!.toFixed(5),
    }))
    .filter((c) => {
      if (c.open <= 0 || c.high < c.low) return false;
      const body = Math.abs(c.close - c.open) || c.open * 0.0001;
      return (c.high - c.low) <= body * 100;
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

/* ── Alpha Vantage daily (fallback for 1d) ───────────────────────────── */
async function fetchAVDaily(base: string) {
  const key  = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return null;
  const from = base.slice(0, 3);
  const to   = base.slice(3, 6);
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


/* ── Route handler ───────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const tf     = req.nextUrl.searchParams.get("tf") ?? "1m";
  const base   = symbol.replace("-OTC", "");

  // Crypto → Binance
  const binanceSymbol = BINANCE_MAP[base];
  if (binanceSymbol) {
    try {
      const limit    = BINANCE_LIMIT[tf] ?? 500;
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

  // Forex → Twelve Data (primary)
  if (base.length === 6) {
    try {
      const candles = await fetchTwelveDataCandles(base, tf);
      if (candles?.length) return NextResponse.json(candles);
    } catch { /* fall through */ }
  }

  // Forex daily → Alpha Vantage (fallback for 1d)
  if (tf === "1d" && process.env.ALPHA_VANTAGE_KEY) {
    try {
      const candles = await fetchAVDaily(base);
      if (candles?.length) return NextResponse.json(candles);
    } catch { /* fall through */ }
  }

  // Forex intraday → Yahoo Finance (last fallback)
  if (base.length === 6) {
    try {
      const candles = await fetchYahooCandles(base, tf);
      if (candles?.length) return NextResponse.json(candles);
    } catch { /* fall through */ }
  }

  // All sources failed — return empty so client uses its cache instead of simulation
  return NextResponse.json([], { status: 200 });
}
