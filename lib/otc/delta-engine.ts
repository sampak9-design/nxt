/**
 * OTC Delta Engine
 *
 * The "delta" is a small offset added on top of the base Deriv price to
 * implement manipulation. It's calculated per minute and persisted in
 * `otc_delta` so it survives restarts and is reproducible across clients.
 *
 * Two parts compose the delta:
 *  - tend (slow random walk for personality)  — currently zero (pure base)
 *  - drift (manipulation engine output)        — applied last 10s before expiry
 */

import db from "@/lib/db";
import { applyManipulation } from "./manipulation";
import { getLatestBase, type Candle } from "./base-feed";

export type Delta = { time: number; open: number; high: number; low: number; close: number };

const upsertDelta = db.prepare(`
  INSERT INTO otc_delta (asset, time, open, high, low, close)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(asset, time) DO UPDATE SET
    high = excluded.high, low = excluded.low, close = excluded.close
`);

export function getDeltaCandles(asset: string, count = 600): Delta[] {
  try {
    const rows = db.prepare(
      "SELECT time, open, high, low, close FROM otc_delta WHERE asset = ? ORDER BY time DESC LIMIT ?"
    ).all(asset, count) as Delta[];
    return rows.reverse();
  } catch { return []; }
}

export function getLatestDelta(asset: string): Delta | null {
  try {
    return (db.prepare(
      "SELECT time, open, high, low, close FROM otc_delta WHERE asset = ? ORDER BY time DESC LIMIT 1"
    ).get(asset) as Delta | undefined) ?? null;
  } catch { return null; }
}

/** Compute the delta for the *current* tick. The base candle is the live one. */
export function computeDelta(asset: string, base: Candle): Delta {
  // The "manipulated" final price suggested by the manipulation engine, given
  // the FAIR base.close. The delta is whatever offset is needed to reach it.
  const manipulatedClose = applyManipulation(asset, base.close);
  const closeDelta = manipulatedClose - base.close;

  const last = getLatestDelta(asset);
  let openDelta: number;
  if (last && last.time === base.time) {
    // Same minute → keep the open delta we already had
    openDelta = last.open;
  } else {
    // New minute → start delta open at the previous candle's close delta
    // (continuity, no jumps)
    openDelta = last?.close ?? 0;
  }
  // High/low envelope of the delta tracks the range of close
  const prevHigh = last && last.time === base.time ? last.high : openDelta;
  const prevLow  = last && last.time === base.time ? last.low  : openDelta;
  const newHigh = Math.max(prevHigh, closeDelta, openDelta);
  const newLow  = Math.min(prevLow,  closeDelta, openDelta);

  const d: Delta = {
    time:  base.time,
    open:  openDelta,
    high:  newHigh,
    low:   newLow,
    close: closeDelta,
  };
  upsertDelta.run(asset, d.time, d.open, d.high, d.low, d.close);
  return d;
}

/** Returns the composed candle (base + delta) for the asset's latest minute. */
export function composeLatest(asset: string): Candle | null {
  const base = getLatestBase(asset);
  if (!base) return null;
  const d = getLatestDelta(asset);
  if (!d || d.time !== base.time) return base;
  return {
    time:  base.time,
    open:  base.open + d.open,
    high:  base.high + d.high,
    low:   base.low  + d.low,
    close: base.close + d.close,
  };
}
