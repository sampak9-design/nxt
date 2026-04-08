/**
 * Server-side Deriv proxy.
 *
 * Maintains a single persistent WebSocket connection to Deriv per asset and
 * caches the latest tick + recent candles in memory. Clients then poll our
 * /api/otc/* endpoints which read from this cache, optionally applying
 * manipulation drift before responding.
 */

import WebSocket from "ws";
import db from "@/lib/db";

export type Tick = { epoch: number; price: number };
export type Candle = { time: number; open: number; high: number; low: number; close: number };

// ── DB persistence (each minute we upsert the closed candle) ────────────
const upsertCandleStmt = db.prepare(`
  INSERT INTO otc_candles (asset, time, open, high, low, close)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(asset, time) DO UPDATE SET
    high = excluded.high, low = excluded.low, close = excluded.close
`);

function loadCandlesFromDb(asset: string, count = 600): Candle[] {
  try {
    const rows = db.prepare(
      "SELECT time, open, high, low, close FROM otc_candles WHERE asset = ? ORDER BY time DESC LIMIT ?"
    ).all(asset, count) as Candle[];
    return rows.reverse();
  } catch { return []; }
}

function persistCandle(asset: string, c: Candle) {
  try { upsertCandleStmt.run(asset, c.time, c.open, c.high, c.low, c.close); } catch {}
}

type Stream = {
  derivSym: string;
  ws: WebSocket | null;
  lastTick: Tick | null;
  candles: Candle[]; // most recent 500 (M1)
  subscribed: boolean;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
};

const streams: Map<string, Stream> = new Map();

function ensureStream(asset: string, derivSym: string): Stream {
  let s = streams.get(asset);
  if (s) return s;
  // Hydrate from DB so manipulated candles survive restart
  const persisted = loadCandlesFromDb(asset, 600);
  s = { derivSym, ws: null, lastTick: null, candles: persisted, subscribed: false, reconnectTimer: null };
  streams.set(asset, s);
  connect(s);
  if (persisted.length < 100) primeHistory(s, asset).catch(() => {});
  return s;
}

function connect(s: Stream) {
  if (s.ws) return;
  try {
    s.ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
    s.ws.on("open", () => {
      s.ws?.send(JSON.stringify({ ticks: s.derivSym, subscribe: 1 }));
      s.subscribed = true;
    });
    s.ws.on("message", (raw: any) => {
      try {
        const d = JSON.parse(raw.toString());
        if (d.tick) {
          const fairTick: Tick = { epoch: d.tick.epoch, price: d.tick.quote };
          s.lastTick = fairTick;
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const manip = require("./manipulation") as typeof import("./manipulation");
          const assetKey = Object.keys(OTC_ASSETS).find((k) => OTC_ASSETS[k].derivSym === s.derivSym);
          const manipPrice = assetKey
            ? manip.applyManipulation(assetKey, fairTick.price)
            : fairTick.price;

          const minute = Math.floor(fairTick.epoch / 60) * 60;
          const last = s.candles[s.candles.length - 1];
          let active: Candle;
          if (last && last.time === minute) {
            // Same candle: only the close (and high/low envelope) reflect manipulation.
            // Open stays as the original fair open captured at minute start.
            last.high = Math.max(last.high, manipPrice);
            last.low  = Math.min(last.low, manipPrice);
            last.close = manipPrice;
            active = last;
          } else {
            // New candle: open uses the FAIR price (no manipulation) so we don't
            // create a discontinuous jump from the previous close.
            active = {
              time:  minute,
              open:  fairTick.price,
              high:  Math.max(fairTick.price, manipPrice),
              low:   Math.min(fairTick.price, manipPrice),
              close: manipPrice,
            };
            s.candles.push(active);
            if (s.candles.length > 600) s.candles.shift();
          }
          if (assetKey) persistCandle(assetKey, active);
        }
      } catch {}
    });
    s.ws.on("close", () => {
      s.ws = null;
      s.subscribed = false;
      s.reconnectTimer = setTimeout(() => connect(s), 2000);
    });
    s.ws.on("error", () => { s.ws?.close(); });
  } catch {
    s.reconnectTimer = setTimeout(() => connect(s), 2000);
  }
}

async function primeHistory(s: Stream, asset: string): Promise<void> {
  // One-shot history call from Deriv to fill in any gap that the persisted
  // cache doesn't cover. Persisted (manipulated) candles take priority.
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
      const timer = setTimeout(() => { ws.close(); resolve(); }, 10_000);
      ws.on("open", () => {
        ws.send(JSON.stringify({
          ticks_history: s.derivSym,
          style: "candles",
          granularity: 60,
          count: 500,
          end: "latest",
        }));
      });
      ws.on("message", (raw: any) => {
        try {
          const d = JSON.parse(raw.toString());
          if (Array.isArray(d.candles)) {
            const fromDeriv: Candle[] = d.candles.map((c: any) => ({
              time: c.epoch, open: c.open, high: c.high, low: c.low, close: c.close,
            }));
            // Merge: persisted candles take priority over Deriv's fair candles
            const persistedTimes = new Set(s.candles.map((c) => c.time));
            const fresh = fromDeriv.filter((c) => !persistedTimes.has(c.time));
            for (const c of fresh) persistCandle(asset, c);
            const merged = [...s.candles, ...fresh].sort((a, b) => a.time - b.time);
            s.candles = merged.slice(-600);
          }
        } catch {}
        clearTimeout(timer);
        ws.close();
        resolve();
      });
      ws.on("error", () => { clearTimeout(timer); resolve(); });
    } catch { resolve(); }
  });
}

// ── Asset registry ──────────────────────────────────────────────────────
type AssetConfig = { derivSym: string; decimals: number; displayBase: number };
export const OTC_ASSETS: Record<string, AssetConfig> = {
  // Test asset: uses Deriv R_100 (Volatility 100 — synthetic 24/7 from Deriv)
  // The "displayBase" is just for price-format hints in the chart; the price
  // shown is whatever R_100 reports (in the thousands).
  "EURUSD-OTC": { derivSym: "R_100", decimals: 2, displayBase: 1000 },
};

export function isOtc(symbol: string): boolean {
  return symbol in OTC_ASSETS;
}

export function getCandles(symbol: string, count = 500): Candle[] {
  const cfg = OTC_ASSETS[symbol];
  if (!cfg) return [];
  const s = ensureStream(symbol, cfg.derivSym);
  const arr = s.candles.slice(-count);
  return arr;
}

export function getCurrentPrice(symbol: string): number {
  const cfg = OTC_ASSETS[symbol];
  if (!cfg) return 0;
  const s = ensureStream(symbol, cfg.derivSym);
  return s.lastTick?.price ?? s.candles[s.candles.length - 1]?.close ?? 0;
}

export function getDecimals(symbol: string): number {
  return OTC_ASSETS[symbol]?.decimals ?? 5;
}
