/**
 * OTC Synthetic Candle Generator (Advanced)
 *
 * Realistic forex-like price simulation with:
 * - Geometric Brownian Motion (GBM) base
 * - Mean reversion to anchor price
 * - Intra-day seasonality (London/NY/Asian session volatility)
 * - Momentum / micro-trends (regime switching)
 * - Random spikes (news events)
 * - Per-asset drift bias
 * - Global volatility multiplier
 * - Sub-second tick resolution (250ms)
 *
 * All randomness is deterministic given (asset, time) so all clients agree.
 */

export type OtcCandle = {
  time:  number;
  open:  number;
  high:  number;
  low:   number;
  close: number;
};

export type AssetParams = {
  seed:           number;
  base:           number;
  vol:            number;  // annualized volatility
  decimals:       number;
  meanReversion?: number;  // 0..0.005
  wickIntensity?: number;  // 0.3..3
  spikeChance?:   number;  // 0..0.05 (per minute)
  spikeMagnitude?: number; // 0..0.005 (% move)
  momentumStrength?: number; // 0..1
  momentumDuration?: number; // seconds avg
  driftBias?:     number;  // -1..+1 (perm directional bias)
  liquidity?:     number;  // 0.3..2 (lower=larger moves)
  seasonalityOn?: boolean;
};

// ── 21 OTC assets — defaults ────────────────────────────────────────────
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

// ── Global config (multipliers across all assets) ───────────────────────
type GlobalConfig = {
  volMultiplier:    number; // 0.3..3
  marketMode:       "calm" | "normal" | "nervous";
  spikeMultiplier:  number; // 0..3
  seasonalityOn:    boolean;
};
const DEFAULT_GLOBAL: GlobalConfig = {
  volMultiplier:   1.0,
  marketMode:      "normal",
  spikeMultiplier: 1.0,
  seasonalityOn:   true,
};
let globalConfig: GlobalConfig = { ...DEFAULT_GLOBAL };

export function getGlobalConfig(): GlobalConfig { return { ...globalConfig }; }
export function setGlobalConfig(patch: Partial<GlobalConfig>) {
  globalConfig = { ...globalConfig, ...patch };
  invalidateConfig();
}

// ── Per-asset DB overrides ──────────────────────────────────────────────
let dbOverrides: Record<string, Partial<AssetParams>> = {};
let lastConfigLoad = 0;
function loadConfigOverrides() {
  const now = Date.now();
  if (now - lastConfigLoad < 5_000) return;
  lastConfigLoad = now;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const db = require("@/lib/db").default;
    const rows = db.prepare("SELECT * FROM otc_asset_config").all() as Array<any>;
    const next: Record<string, Partial<AssetParams>> = {};
    for (const r of rows) {
      next[r.asset] = {
        base: r.base, vol: r.vol,
        meanReversion:    r.mean_reversion,
        wickIntensity:    r.wick_intensity,
        decimals:         r.decimals,
        spikeChance:      r.spike_chance ?? undefined,
        spikeMagnitude:   r.spike_magnitude ?? undefined,
        momentumStrength: r.momentum_strength ?? undefined,
        momentumDuration: r.momentum_duration ?? undefined,
        driftBias:        r.drift_bias ?? undefined,
        liquidity:        r.liquidity ?? undefined,
        seasonalityOn:    r.seasonality_on != null ? r.seasonality_on === 1 : undefined,
      };
    }
    dbOverrides = next;

    // Load global config too
    const gRows = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'otc_global_%'").all() as Array<{ key: string; value: string }>;
    const g: Partial<GlobalConfig> = {};
    for (const row of gRows) {
      if (row.key === "otc_global_vol_mult") g.volMultiplier = parseFloat(row.value);
      if (row.key === "otc_global_mode")     g.marketMode = row.value as any;
      if (row.key === "otc_global_spike_mult") g.spikeMultiplier = parseFloat(row.value);
      if (row.key === "otc_global_seasonality") g.seasonalityOn = row.value === "1";
    }
    globalConfig = { ...DEFAULT_GLOBAL, ...g };
  } catch { /* server-only */ }
}

export function invalidateConfig() {
  lastConfigLoad = 0;
  loadConfigOverrides();
  walkCache.clear();
  minuteCandleCache.clear();
}

export function isOtcAsset(symbol: string): boolean {
  const base = symbol.replace("-OTC", "");
  return base in OTC_ASSETS;
}

export function getOtcParams(symbol: string): AssetParams | null {
  const base = symbol.replace("-OTC", "");
  const builtin = OTC_ASSETS[base];
  if (!builtin) return null;
  loadConfigOverrides();
  const ov = dbOverrides[base];
  return ov ? { ...builtin, ...ov } : builtin;
}

// ── PRNG ────────────────────────────────────────────────────────────────
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

function randn(rand: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── Seasonality factor based on UTC hour ────────────────────────────────
// Approximates real forex session volatility:
//   Asian (00-07 UTC):    0.6x
//   London open (08-12):  1.4x
//   London/NY overlap (13-16): 1.7x
//   NY (17-21):           1.2x
//   After hours (22-23):  0.5x
function seasonalityFactor(epochSec: number, params: AssetParams): number {
  const enabled = params.seasonalityOn ?? true;
  if (!enabled || !globalConfig.seasonalityOn) return 1;
  const hour = (Math.floor(epochSec / 3600) + 24) % 24;
  if (hour >= 0  && hour <= 7)  return 0.6;
  if (hour >= 8  && hour <= 12) return 1.4;
  if (hour >= 13 && hour <= 16) return 1.7;
  if (hour >= 17 && hour <= 21) return 1.2;
  return 0.5;
}

function modeMultiplier(): number {
  switch (globalConfig.marketMode) {
    case "calm":    return 0.5;
    case "nervous": return 2.0;
    default:        return 1.0;
  }
}

// ── Walk state ──────────────────────────────────────────────────────────
type WalkState = { lastIdx: number; price: number };
const walkCache: Map<string, WalkState> = new Map();
const minuteCandleCache: Map<string, OtcCandle> = new Map();

// Fixed anchor: 2024-01-01 00:00:00 UTC (in minutes since epoch)
// Walking always starts from here so the same minute always yields the same price.
const FIXED_ANCHOR_MIN = Math.floor(new Date("2024-01-01T00:00:00Z").getTime() / 60_000);

function getMinutePrice(params: AssetParams, minuteIdx: number): number {
  const key = `${params.seed}`;
  let state = walkCache.get(key);
  // Always start the walk at the FIXED anchor; cache forward progress only.
  if (!state || state.lastIdx > minuteIdx || state.lastIdx < FIXED_ANCHOR_MIN) {
    state = { lastIdx: FIXED_ANCHOR_MIN, price: params.base };
    walkCache.set(key, state);
  }
  const baseSigma = params.vol * globalConfig.volMultiplier * modeMultiplier();
  const dt = 1 / (252 * 24 * 60);
  const mr = params.meanReversion ?? 0.0002;
  const drift = (params.driftBias ?? 0) * 0.000002; // tiny per-minute bias
  const liq = params.liquidity ?? 1.0;

  while (state.lastIdx < minuteIdx) {
    const next = state.lastIdx + 1;
    const rand = mulberry32(params.seed * 1_000_003 + next);
    const z = randn(rand);
    const sigma = baseSigma * seasonalityFactor(next * 60, params) / liq;

    state.price = state.price * Math.exp((drift - sigma * sigma / 2) * dt + sigma * Math.sqrt(dt) * z);
    state.price = state.price + (params.base - state.price) * mr;

    // Random spike
    const spikeChance = (params.spikeChance ?? 0.005) * globalConfig.spikeMultiplier;
    if (rand() < spikeChance) {
      const dir = rand() < 0.5 ? -1 : 1;
      const mag = (params.spikeMagnitude ?? 0.0008) * (0.5 + rand());
      state.price = state.price * (1 + dir * mag);
    }

    state.lastIdx = next;
  }
  return state.price;
}

function minuteCandleAt(params: AssetParams, minuteIdx: number): OtcCandle {
  const key = `${params.seed}:${minuteIdx}`;
  const cached = minuteCandleCache.get(key);
  if (cached) return cached;

  const open = getMinutePrice(params, minuteIdx - 1);
  const close = getMinutePrice(params, minuteIdx);
  const subRand = mulberry32(params.seed * 1_000_003 + minuteIdx + 7);
  let high = Math.max(open, close);
  let low  = Math.min(open, close);
  const wickIntensity = params.wickIntensity ?? 1.2;
  const range = Math.abs(close - open) + params.base * 0.0001;
  for (let i = 0; i < 8; i++) {
    const z = (subRand() - 0.5) * 2;
    const tip = (open + close) / 2 + z * range * wickIntensity;
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
  if (minuteCandleCache.size > 50_000) {
    const it = minuteCandleCache.keys();
    for (let i = 0; i < 10_000; i++) minuteCandleCache.delete(it.next().value as string);
  }
  minuteCandleCache.set(key, candle);
  return candle;
}

function candleForEpoch(params: AssetParams, tfSec: number, epoch: number): OtcCandle {
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

/** Live forming candle. Walks the price tick-by-tick from candle open up to
 *  nowMs, with mean-reversion pullbacks and small momentum windows so the
 *  movement looks like real forex (not monotonic). */
export function getCurrentCandle(
  symbol: string,
  tfSec: number,
  nowMs: number = Date.now(),
): OtcCandle | null {
  const params = getOtcParams(symbol);
  if (!params) return null;
  const nowSec = nowMs / 1000;
  const currentIdx = Math.floor(nowSec / tfSec);
  const candleStart = currentIdx * tfSec;
  const candleStartMs = candleStart * 1000;
  const openMinute = Math.floor(candleStart / 60);
  const open = getMinutePrice(params, openMinute - 1);

  // Sub-tick (250ms)
  const subTickMs = 250;
  const elapsedMs = Math.max(subTickMs, nowMs - candleStartMs);
  const ticks = Math.floor(elapsedMs / subTickMs);

  const sigmaBase = params.vol * globalConfig.volMultiplier * modeMultiplier() *
                    seasonalityFactor(candleStart, params) / (params.liquidity ?? 1);
  const dt = (subTickMs / 1000) / (252 * 24 * 60 * 60);
  const drift = (params.driftBias ?? 0) * 0.0000005;
  const mr = (params.meanReversion ?? 0.0002) * 0.05; // softer mean reversion intra-candle

  // Anchor for mean reversion: the previous closed candle's close
  const anchor = open;

  // Momentum: 5-second windows that flip direction independently → natural pullbacks
  const momStrength = params.momentumStrength ?? 0.3;
  const momWindowSec = 5;

  let s = open;
  let high = open, low = open;
  for (let i = 1; i <= ticks; i++) {
    // Deterministic seed from absolute second so reload === reload
    const absMs = candleStartMs + i * subTickMs;
    const tickSeed = params.seed * 1_000_003 + Math.floor(absMs / subTickMs);
    const rand = mulberry32(tickSeed);
    const z = randn(rand);
    s = s * Math.exp((drift - sigmaBase * sigmaBase / 2) * dt + sigmaBase * Math.sqrt(dt) * z);

    // Mean revert toward anchor (small force) — creates pullbacks
    s = s + (anchor - s) * mr;

    // Momentum bias for the current 5s window (changes direction often)
    const winIdx = Math.floor((absMs / 1000) / momWindowSec);
    const winRand = mulberry32(params.seed * 7919 + winIdx);
    const momDir = winRand() < 0.5 ? -1 : 1;
    s += momDir * momStrength * sigmaBase * 0.000005 * s;

    // Spikes (rare)
    const spikeChance = ((params.spikeChance ?? 0.005) * globalConfig.spikeMultiplier) / 240;
    if (rand() < spikeChance) {
      const dir = rand() < 0.5 ? -1 : 1;
      const mag = (params.spikeMagnitude ?? 0.0008) * (0.4 + rand());
      s = s * (1 + dir * mag);
    }

    if (s > high) high = s;
    if (s < low)  low  = s;
  }
  const dec = params.decimals;
  return {
    time:  candleStart,
    open:  +open.toFixed(dec + 2),
    high:  +high.toFixed(dec + 2),
    low:   +low.toFixed(dec + 2),
    close: +s.toFixed(dec + 2),
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
