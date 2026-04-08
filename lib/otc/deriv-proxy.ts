/**
 * OTC Orchestrator (final-table based)
 *
 * Listens to base ticks from base-feed, applies manipulation, and writes the
 * already-composed candle into `otc_final`. Each tick updates the active
 * candle's OHLC in real time, so a reload returns exactly what the user saw.
 */

import db from "@/lib/db";
import {
  ensureFeed, onBaseTick, isOtc as isBaseOtc, getDecimals, OTC_ASSETS as BASE_ASSETS,
  type Candle,
} from "./base-feed";
import { applyManipulation } from "./manipulation";

export { isBaseOtc as isOtc, getDecimals };
export const OTC_ASSETS = BASE_ASSETS;
export type { Candle };

// ── Persistence ─────────────────────────────────────────────────────────
const upsertFinal = db.prepare(`
  INSERT INTO otc_final (asset, time, open, high, low, close)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(asset, time) DO UPDATE SET
    high = excluded.high, low = excluded.low, close = excluded.close
`);

function loadFinalCandles(asset: string, count = 600): Candle[] {
  try {
    const rows = db.prepare(
      "SELECT time, open, high, low, close FROM otc_final WHERE asset = ? ORDER BY time DESC LIMIT ?"
    ).all(asset, count) as Candle[];
    return rows.reverse();
  } catch { return []; }
}

function loadLatestFinal(asset: string): Candle | null {
  try {
    return (db.prepare(
      "SELECT time, open, high, low, close FROM otc_final WHERE asset = ? ORDER BY time DESC LIMIT 1"
    ).get(asset) as Candle | undefined) ?? null;
  } catch { return null; }
}

// ── SSE subscriber registry ─────────────────────────────────────────────
export type StreamMsg = {
  type: "tick";
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};
type Subscriber = (msg: StreamMsg) => void;
const subscribers: Map<string, Set<Subscriber>> = new Map();

// Single global listener: every base tick produces a manipulated final tick.
let globalListenerInstalled = false;
function ensureGlobalListener() {
  if (globalListenerInstalled) return;
  globalListenerInstalled = true;
  onBaseTick((asset, base) => {
    const finalClose = applyManipulation(asset, base.close);

    // Build/update the final candle for this minute
    const last = loadLatestFinal(asset);
    let candle: Candle;
    if (last && last.time === base.time) {
      candle = {
        time:  base.time,
        open:  last.open,
        high:  Math.max(last.high, finalClose),
        low:   Math.min(last.low, finalClose),
        close: finalClose,
      };
    } else {
      // New minute: open = previous close (continuous) or current price
      const openPrice = last?.close ?? finalClose;
      candle = {
        time:  base.time,
        open:  openPrice,
        high:  Math.max(openPrice, finalClose),
        low:   Math.min(openPrice, finalClose),
        close: finalClose,
      };
    }
    upsertFinal.run(asset, candle.time, candle.open, candle.high, candle.low, candle.close);

    const set = subscribers.get(asset);
    if (set) {
      const msg: StreamMsg = {
        type: "tick",
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low:  candle.low,
        close: candle.close,
      };
      for (const fn of set) { try { fn(msg); } catch {} }
    }
  });
}

export function subscribe(asset: string, fn: Subscriber): () => void {
  ensureFeed(asset);
  ensureGlobalListener();
  let set = subscribers.get(asset);
  if (!set) { set = new Set(); subscribers.set(asset, set); }
  set.add(fn);
  return () => { set?.delete(fn); };
}

// ── Public read API used by the endpoints ───────────────────────────────
export function getCandles(symbol: string, count = 500): Candle[] {
  ensureFeed(symbol);
  ensureGlobalListener();
  return loadFinalCandles(symbol, count);
}

export function getCurrentPrice(symbol: string): number {
  ensureFeed(symbol);
  ensureGlobalListener();
  const c = loadLatestFinal(symbol);
  return c?.close ?? 0;
}
