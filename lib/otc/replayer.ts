/**
 * OTC Synthetic Candle Generator
 *
 * Uses Geometric Brownian Motion (GBM) with a per-asset deterministic seed so
 * candles look like real forex data, run 24/7, and are fully server-controlled
 * (enables manipulation).
 *
 * Formula (per tick):
 *   S(t+dt) = S(t) * exp((mu - sigma^2/2) * dt + sigma * sqrt(dt) * Z)
 *   where Z ~ N(0, 1)
 *
 * Candles are deterministic given (asset, tfSeconds, candleEpoch) — meaning
 * every client will see the same OHLC for the same minute. Only the *current*
 * (still-forming) candle is affected by manipulation drift before emission.
 */

export type OtcCandle = {
  time:  number; // epoch seconds (bar open time)
  open:  number;
  high:  number;
  low:   number;
  close: number;
};

export type AssetParams = {
  seed:    number;  // deterministic random seed
  base:    number;  // reference price (seed value)
  vol:     number;  // annualized volatility (e.g. 0.07 = 7%)
  decimals: number; // price decimals for formatting
};

// ── 21 OTC assets ───────────────────────────────────────────────────────
export const OTC_ASSETS: Record<string, AssetParams> = {
  AUDCAD: { seed: 11, base: 0.910, vol: 0.055, decimals: 5 },
  AUDCHF: { seed: 12, base: 0.580, vol: 0.060, decimals: 5 },
  AUDJPY: { seed: 13, base: 96.30, vol: 0.080, decimals: 3 },
  AUDNZD: { seed: 14, base: 1.090, vol: 0.045, decimals: 5 },
  CADCHF: { seed: 15, base: 0.655, vol: 0.055, decimals: 5 },
  EURAUD: { seed: 16, base: 1.690, vol: 0.060, decimals: 5 },
  EURCHF: { seed: 17, base: 0.969, vol: 0.050, decimals: 5 },
  EURGBP: { seed: 18, base: 0.855, vol: 0.050, decimals: 5 },
  EURJPY: { seed: 19, base: 162.5, vol: 0.080, decimals: 3 },
  EURUSD: { seed: 20, base: 1.085, vol: 0.070, decimals: 5 },
  GBPCHF: { seed: 21, base: 1.130, vol: 0.065, decimals: 5 },
  GBPJPY: { seed: 22, base: 190.1, vol: 0.090, decimals: 3 },
  GBPNZD: { seed: 23, base: 2.170, vol: 0.070, decimals: 5 },
  GBPUSD: { seed: 24, base: 1.268, vol: 0.070, decimals: 5 },
  NZDCAD: { seed: 25, base: 0.805, vol: 0.055, decimals: 5 },
  NZDCHF: { seed: 26, base: 0.530, vol: 0.060, decimals: 5 },
  NZDJPY: { seed: 27, base: 90.50, vol: 0.080, decimals: 3 },
  NZDUSD: { seed: 28, base: 0.592, vol: 0.070, decimals: 5 },
  USDCAD: { seed: 29, base: 1.362, vol: 0.060, decimals: 5 },
  USDCHF: { seed: 30, base: 0.893, vol: 0.060, decimals: 5 },
  USDJPY: { seed: 31, base: 149.8, vol: 0.080, decimals: 3 },
};

export function isOtcAsset(symbol: string): boolean {
  const base = symbol.replace("-OTC", "");
  return base in OTC_ASSETS;
}

export function getOtcParams(symbol: string): AssetParams | null {
  const base = symbol.replace("-OTC", "");
  return OTC_ASSETS[base] ?? null;
}

// ── Deterministic PRNG (Mulberry32) ─────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller: uniform [0,1) → standard normal
function randn(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── Core: compute OHLC for a single candle deterministically ────────────
/**
 * Walks the price from a fixed anchor in the past (60 days ago) up to the
 * requested candle, applying GBM at each minute. Cached so we don't redo
 * the walk on every call.
 *
 * Same (asset, epoch) → same OHLC for everyone, neighbor candles always
 * connect (close[N] === open[N+1]).
 */
type WalkState = { lastIdx: number; price: number };
const walkCache: Map<string, WalkState> = new Map();
const minuteCandleCache: Map<string, OtcCandle> = new Map();

function getMinutePrice(params: AssetParams, minuteIdx: number): number {
  // Walk forward from anchor (lazy, with cache)
  const key = `${params.seed}`;
  let state = walkCache.get(key);
  if (!state || state.lastIdx > minuteIdx) {
    // Initialize anchor 60 days back so we have history
    const anchorIdx = minuteIdx - 60 * 24 * 60;
    state = { lastIdx: anchorIdx, price: params.base };
    walkCache.set(key, state);
  }
  // Walk from state.lastIdx up to minuteIdx
  const sigma = params.vol;
  // dt per 1-minute step (annualized, 252 trading days * 24h * 60min)
  const dt = 1 / (252 * 24 * 60);
  while (state.lastIdx < minuteIdx) {
    const next = state.lastIdx + 1;
    const rand = mulberry32(params.seed * 1_000_003 + next);
    const z = randn(rand);
    state.price = state.price * Math.exp(-sigma * sigma / 2 * dt + sigma * Math.sqrt(dt) * z);
    // Mean reversion: pull weakly back to base so price doesn't drift forever
    state.price = state.price + (params.base - state.price) * 0.0002;
    state.lastIdx = next;
  }
  return state.price;
}

/** Single 1-minute candle (basic unit). */
function minuteCandleAt(params: AssetParams, minuteIdx: number): OtcCandle {
  const key = `${params.seed}:${minuteIdx}`;
  const cached = minuteCandleCache.get(key);
  if (cached) return cached;

  // Open = price walked TO this minute (== close of previous)
  const open = getMinutePrice(params, minuteIdx - 1);
  // Close = price walked TO this minute's end
  const close = getMinutePrice(params, minuteIdx);
  // High/Low: 10 sub-tick walk inside the minute, anchored by open and close
  const subRand = mulberry32(params.seed * 1_000_003 + minuteIdx + 7);
  let high = Math.max(open, close);
  let low  = Math.min(open, close);
  const range = Math.abs(close - open) + params.base * 0.0001;
  for (let i = 0; i < 6; i++) {
    const z = (subRand() - 0.5) * 2; // -1..1
    const tip = (open + close) / 2 + z * range * 1.2;
    if (tip > high) high = tip;
    if (tip < low)  low  = tip;
  }
  const dec = params.decimals;
  const candle: OtcCandle = {
    time: minuteIdx * 60,
    open:  +open.toFixed(dec + 2),
    high:  +high.toFixed(dec + 2),
    low:   +low.toFixed(dec + 2),
    close: +close.toFixed(dec + 2),
  };
  // Bound cache size
  if (minuteCandleCache.size > 50_000) {
    // Drop oldest entries (simple)
    const it = minuteCandleCache.keys();
    for (let i = 0; i < 10_000; i++) minuteCandleCache.delete(it.next().value as string);
  }
  minuteCandleCache.set(key, candle);
  return candle;
}

/** Aggregates N minute candles into a single candle (M1 → M5/M15). */
function candleForEpoch(
  params: AssetParams,
  tfSec: number,
  epoch: number,
): OtcCandle {
  const candleIdx = Math.floor(epoch / tfSec);
  const minutesPerCandle = Math.max(1, Math.floor(tfSec / 60));
  const startMinute = candleIdx * minutesPerCandle;

  let open = 0, high = -Infinity, low = Infinity, close = 0;
  for (let i = 0; i < minutesPerCandle; i++) {
    const m = minuteCandleAt(params, startMinute + i);
    if (i === 0) open = m.open;
    if (m.high > high) high = m.high;
    if (m.low  < low)  low  = m.low;
    close = m.close;
  }
  const dec = params.decimals;
  return {
    time: candleIdx * tfSec,
    open:  +open.toFixed(dec + 2),
    high:  +high.toFixed(dec + 2),
    low:   +low.toFixed(dec + 2),
    close: +close.toFixed(dec + 2),
  };
}

// ── Public API ──────────────────────────────────────────────────────────

/** Returns the last `count` closed candles for the given asset+timeframe. */
export function getHistoricalCandles(
  symbol: string,
  tfSec: number,
  count: number,
  nowSec: number = Math.floor(Date.now() / 1000),
): OtcCandle[] {
  const params = getOtcParams(symbol);
  if (!params) return [];
  const currentIdx = Math.floor(nowSec / tfSec);
  const candles: OtcCandle[] = [];
  for (let i = count; i >= 1; i--) {
    const epoch = (currentIdx - i) * tfSec;
    candles.push(candleForEpoch(params, tfSec, epoch));
  }
  return candles;
}

/** Returns the current (still-forming) candle. Open is real, high/low/close
 *  are interpolated based on time progress through the candle. */
export function getCurrentCandle(
  symbol: string,
  tfSec: number,
  nowSec: number = Math.floor(Date.now() / 1000),
): OtcCandle | null {
  const params = getOtcParams(symbol);
  if (!params) return null;
  const currentIdx = Math.floor(nowSec / tfSec);
  const fullCandle = candleForEpoch(params, tfSec, currentIdx * tfSec);
  const progress = Math.min(1, Math.max(0, (nowSec - fullCandle.time) / tfSec));

  // Interpolate close linearly between open and the candle's final close
  const close = fullCandle.open + (fullCandle.close - fullCandle.open) * progress;
  // High/low expand from open toward the full candle's high/low as progress grows
  const high = fullCandle.open + (fullCandle.high - fullCandle.open) * progress;
  const low  = fullCandle.open + (fullCandle.low  - fullCandle.open) * progress;
  const dec = params.decimals;
  return {
    time:  fullCandle.time,
    open:  fullCandle.open,
    high:  +Math.max(close, high, fullCandle.open).toFixed(dec + 2),
    low:   +Math.min(close, low,  fullCandle.open).toFixed(dec + 2),
    close: +close.toFixed(dec + 2),
  };
}

/** Returns the current price (close of the forming candle), after manipulation. */
export function getCurrentPrice(
  symbol: string,
  tfSec: number = 60,
  nowSec: number = Math.floor(Date.now() / 1000),
): number {
  const c = getCurrentCandle(symbol, tfSec, nowSec);
  return c?.close ?? 0;
}
