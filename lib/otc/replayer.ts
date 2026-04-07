/**
 * OTC Replayer — serves real Deriv 2023 M1 candles from local SQLite as if
 * they were live data, looping through the year continuously.
 *
 * Time mapping:
 *   - Real `now` is converted to a "virtual" epoch inside the 2023 record.
 *   - virtualEpoch = RECORD_START + (now % RECORD_DURATION)
 *   - This means the historical year plays continuously, looping forever.
 *
 * Manipulation (lib/otc/manipulation.ts) is applied on top of the real data
 * for the live (forming) candle, NOT on the historical lookups.
 */

export type OtcCandle = {
  time:  number;
  open:  number;
  high:  number;
  low:   number;
  close: number;
};

export type AssetParams = {
  base:     number;
  decimals: number;
};

// 21 OTC forex pairs — defaults used as fallback if DB is empty
export const OTC_ASSETS: Record<string, AssetParams> = {
  AUDCAD: { base: 0.910, decimals: 5 },
  AUDCHF: { base: 0.580, decimals: 5 },
  AUDJPY: { base: 96.30, decimals: 3 },
  AUDNZD: { base: 1.090, decimals: 5 },
  CADCHF: { base: 0.655, decimals: 5 },
  EURAUD: { base: 1.690, decimals: 5 },
  EURCHF: { base: 0.969, decimals: 5 },
  EURGBP: { base: 0.855, decimals: 5 },
  EURJPY: { base: 162.5, decimals: 3 },
  EURUSD: { base: 1.085, decimals: 5 },
  GBPCHF: { base: 1.130, decimals: 5 },
  GBPJPY: { base: 190.1, decimals: 3 },
  GBPNZD: { base: 2.170, decimals: 5 },
  GBPUSD: { base: 1.268, decimals: 5 },
  NZDCAD: { base: 0.805, decimals: 5 },
  NZDCHF: { base: 0.530, decimals: 5 },
  NZDJPY: { base: 90.50, decimals: 3 },
  NZDUSD: { base: 0.592, decimals: 5 },
  USDCAD: { base: 1.362, decimals: 5 },
  USDCHF: { base: 0.893, decimals: 5 },
  USDJPY: { base: 149.8, decimals: 3 },
};

export function isOtcAsset(symbol: string): boolean {
  const base = symbol.replace("-OTC", "");
  return base in OTC_ASSETS;
}

export function getOtcParams(symbol: string): AssetParams | null {
  const base = symbol.replace("-OTC", "");
  return OTC_ASSETS[base] ?? null;
}

// ── Time mapping ────────────────────────────────────────────────────────
// minute_idx in DB is sequential 0..N-1 per asset. Each asset may have a
// different range. We loop over (now mod assetRange) to get the virtual idx.
const assetRangeCache: Map<string, number> = new Map();

function getAssetRange(asset: string): number {
  if (assetRangeCache.has(asset)) return assetRangeCache.get(asset)!;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const db = require("@/lib/db").default;
    const row = db.prepare("SELECT MAX(minute_idx) + 1 AS n FROM otc_history WHERE asset = ?").get(asset) as { n: number | null } | undefined;
    const n = row?.n ?? 0;
    assetRangeCache.set(asset, n);
    return n;
  } catch { return 0; }
}

function virtualMinuteIdx(realMin: number, asset: string): number {
  const range = getAssetRange(asset);
  if (range <= 0) return 0;
  return ((realMin % range) + range) % range;
}

// ── DB lookup with caching ──────────────────────────────────────────────
type DbRow = { open: number; high: number; low: number; close: number };
const lookupCache: Map<string, DbRow | null> = new Map();
let cacheHits = 0;
let cacheMisses = 0;

function lookupMinute(asset: string, virtualMinIdx: number): DbRow | null {
  const key = `${asset}:${virtualMinIdx}`;
  if (lookupCache.has(key)) {
    cacheHits++;
    return lookupCache.get(key) ?? null;
  }
  cacheMisses++;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const db = require("@/lib/db").default;
    const row = db.prepare(
      "SELECT open, high, low, close FROM otc_history WHERE asset = ? AND minute_idx = ?"
    ).get(asset, virtualMinIdx) as DbRow | undefined;
    const result = row ?? null;
    if (lookupCache.size > 100_000) {
      // Trim oldest 20k
      const it = lookupCache.keys();
      for (let i = 0; i < 20_000; i++) lookupCache.delete(it.next().value as string);
    }
    lookupCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

/** Cleared by admin endpoints when something changes. */
export function invalidateConfig() {
  lookupCache.clear();
}

// ── Public API ──────────────────────────────────────────────────────────

/** Returns the last `count` closed candles for the given asset+timeframe.
 *  Each real timestamp is mapped through the virtual time function so the
 *  returned candles align with what `getCurrentCandle` will produce next. */
export function getHistoricalCandles(
  symbol: string,
  tfSec: number,
  count: number,
  nowSec: number = Math.floor(Date.now() / 1000),
): OtcCandle[] {
  const params = getOtcParams(symbol);
  if (!params) return [];
  const base = symbol.replace("-OTC", "");
  const minutesPerCandle = Math.max(1, Math.floor(tfSec / 60));

  const candles: OtcCandle[] = [];
  // Iterate from `count` candles ago up to (but not including) the current candle
  const currentCandleStart = Math.floor(nowSec / tfSec) * tfSec;

  for (let i = count; i >= 1; i--) {
    const candleStart = currentCandleStart - i * tfSec;
    const startMinReal = Math.floor(candleStart / 60);
    let open = 0, high = -Infinity, low = Infinity, close = 0;
    let hadData = false;

    for (let m = 0; m < minutesPerCandle; m++) {
      const vMin = virtualMinuteIdx(startMinReal + m, base);
      const row = lookupMinute(base, vMin);
      if (!row) continue;
      if (!hadData) { open = row.open; hadData = true; }
      if (row.high > high) high = row.high;
      if (row.low  < low)  low  = row.low;
      close = row.close;
    }

    if (hadData) {
      const dec = params.decimals;
      candles.push({
        time:  candleStart,
        open:  +open.toFixed(dec + 2),
        high:  +high.toFixed(dec + 2),
        low:   +low.toFixed(dec + 2),
        close: +close.toFixed(dec + 2),
      });
    }
  }
  return candles;
}

/** Returns the current (still-forming) candle. The historical "future" candle
 *  is interpolated by progress through the candle so the close moves smoothly
 *  toward the eventual close from the historical record. */
export function getCurrentCandle(
  symbol: string,
  tfSec: number,
  nowMs: number = Date.now(),
): OtcCandle | null {
  const params = getOtcParams(symbol);
  if (!params) return null;
  const base = symbol.replace("-OTC", "");
  const nowSec = nowMs / 1000;
  const candleStart = Math.floor(nowSec / tfSec) * tfSec;
  const progress = Math.min(1, Math.max(0, (nowSec - candleStart) / tfSec));
  const minutesPerCandle = Math.max(1, Math.floor(tfSec / 60));
  const startMinReal = Math.floor(candleStart / 60);

  // Build the "future" candle (full minutes already in DB)
  let open = 0, high = -Infinity, low = Infinity, close = 0;
  let hadData = false;
  for (let m = 0; m < minutesPerCandle; m++) {
    const vMin = virtualMinuteIdx(startMinReal + m, base);
    const row = lookupMinute(base, vMin);
    if (!row) continue;
    if (!hadData) { open = row.open; hadData = true; }
    if (row.high > high) high = row.high;
    if (row.low  < low)  low  = row.low;
    close = row.close;
  }
  if (!hadData) return null;

  // Interpolate close from open toward final close based on progress
  const liveClose = open + (close - open) * progress;
  // Wicks grow proportionally
  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;
  const liveHigh  = Math.max(open, liveClose) + upperWick * progress;
  const liveLow   = Math.min(open, liveClose) - lowerWick * progress;

  const dec = params.decimals;
  return {
    time:  candleStart,
    open:  +open.toFixed(dec + 2),
    high:  +liveHigh.toFixed(dec + 2),
    low:   +liveLow.toFixed(dec + 2),
    close: +liveClose.toFixed(dec + 2),
  };
}

export function getCurrentPrice(
  symbol: string,
  tfSec: number = 60,
  nowMs: number = Date.now(),
): number {
  const c = getCurrentCandle(symbol, tfSec, nowMs);
  return c?.close ?? 0;
}

export function getReplayInfo() {
  return {
    cacheHits, cacheMisses,
    cacheSize: lookupCache.size,
  };
}
