/**
 * OTC Orchestrator
 *
 * Glues together base-feed (Deriv WS), delta-engine (manipulation), and the
 * SSE subscriber registry. Endpoints (candles, tick, stream, expose) import
 * from this file.
 */

import {
  ensureFeed, onBaseTick, isOtc as isBaseOtc, getDecimals, OTC_ASSETS as BASE_ASSETS,
  getBaseCandles, getLatestBase, type Candle,
} from "./base-feed";
import { computeDelta, composeLatest } from "./delta-engine";
import { composeCandles } from "./composer";

export { isBaseOtc as isOtc, getDecimals };
export const OTC_ASSETS = BASE_ASSETS;
export type { Candle };

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

// Single global listener: every base tick triggers delta compute + emit
let globalListenerInstalled = false;
function ensureGlobalListener() {
  if (globalListenerInstalled) return;
  globalListenerInstalled = true;
  onBaseTick((asset, base) => {
    const delta = computeDelta(asset, base);
    const composed: StreamMsg = {
      type:  "tick",
      time:  base.time,
      open:  base.open  + delta.open,
      high:  base.high  + delta.high,
      low:   base.low   + delta.low,
      close: base.close + delta.close,
    };
    const set = subscribers.get(asset);
    if (!set) return;
    for (const fn of set) { try { fn(composed); } catch {} }
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
  return composeCandles(symbol, count);
}

export function getCurrentPrice(symbol: string): number {
  ensureFeed(symbol);
  ensureGlobalListener();
  const c = composeLatest(symbol);
  return c?.close ?? 0;
}

// Re-export for any caller that wants raw access
export { getBaseCandles, getLatestBase };
