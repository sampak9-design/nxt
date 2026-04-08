/**
 * Server-side Deriv proxy.
 *
 * Maintains a single persistent WebSocket connection to Deriv per asset and
 * caches the latest tick + recent candles in memory. Clients then poll our
 * /api/otc/* endpoints which read from this cache, optionally applying
 * manipulation drift before responding.
 */

import WebSocket from "ws";

export type Tick = { epoch: number; price: number };
export type Candle = { time: number; open: number; high: number; low: number; close: number };

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
  s = { derivSym, ws: null, lastTick: null, candles: [], subscribed: false, reconnectTimer: null };
  streams.set(asset, s);
  connect(s);
  primeHistory(s).catch(() => {});
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
          // Apply manipulation to the live tick before storing in the candle.
          // This way the visual candle (and saved history) reflects the
          // manipulated price, so reload === what the user saw.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const manip = require("./manipulation") as typeof import("./manipulation");
          // The asset key is the symbol that maps to this derivSym
          const assetKey = Object.keys(OTC_ASSETS).find((k) => OTC_ASSETS[k].derivSym === s.derivSym);
          const price = assetKey
            ? manip.applyManipulation(assetKey, fairTick.price)
            : fairTick.price;

          const minute = Math.floor(fairTick.epoch / 60) * 60;
          const last = s.candles[s.candles.length - 1];
          if (last && last.time === minute) {
            last.high = Math.max(last.high, price);
            last.low  = Math.min(last.low, price);
            last.close = price;
          } else {
            s.candles.push({
              time: minute,
              open: price,
              high: price,
              low: price,
              close: price,
            });
            if (s.candles.length > 600) s.candles.shift();
          }
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

async function primeHistory(s: Stream): Promise<void> {
  // One-shot history call to seed `candles` (600 minutes back)
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
            s.candles = d.candles.map((c: any) => ({
              time: c.epoch, open: c.open, high: c.high, low: c.low, close: c.close,
            }));
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
