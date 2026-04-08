/**
 * OTC Base Feed
 *
 * Maintains a persistent WebSocket to Deriv per asset and stores the raw,
 * unmanipulated base candles in `otc_base`. This is the "honest market data"
 * that the delta engine adds a synthetic spread to.
 */

import WebSocket from "ws";
import db from "@/lib/db";

export type Candle = { time: number; open: number; high: number; low: number; close: number };

export type AssetConfig = { derivSym: string; decimals: number };
export const OTC_ASSETS: Record<string, AssetConfig> = {
  "EURUSD-OTC": { derivSym: "R_100", decimals: 2 },
};

export function isOtc(symbol: string): boolean { return symbol in OTC_ASSETS; }
export function getDecimals(symbol: string): number {
  return OTC_ASSETS[symbol]?.decimals ?? 5;
}

// ── Persistence ─────────────────────────────────────────────────────────
const upsertBase = db.prepare(`
  INSERT INTO otc_base (asset, time, open, high, low, close)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(asset, time) DO UPDATE SET
    high = excluded.high, low = excluded.low, close = excluded.close
`);

export function getBaseCandles(asset: string, count = 600): Candle[] {
  try {
    const rows = db.prepare(
      "SELECT time, open, high, low, close FROM otc_base WHERE asset = ? ORDER BY time DESC LIMIT ?"
    ).all(asset, count) as Candle[];
    return rows.reverse();
  } catch { return []; }
}

export function getLatestBase(asset: string): Candle | null {
  try {
    return (db.prepare(
      "SELECT time, open, high, low, close FROM otc_base WHERE asset = ? ORDER BY time DESC LIMIT 1"
    ).get(asset) as Candle | undefined) ?? null;
  } catch { return null; }
}

// ── Stream registry ─────────────────────────────────────────────────────
type Stream = {
  derivSym: string;
  ws: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  primed: boolean;
};
const streams: Map<string, Stream> = new Map();

export type BaseTickListener = (asset: string, candle: Candle) => void;
const listeners: Set<BaseTickListener> = new Set();
export function onBaseTick(fn: BaseTickListener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function emit(asset: string, candle: Candle) {
  for (const fn of listeners) { try { fn(asset, candle); } catch {} }
}

export function ensureFeed(asset: string) {
  const cfg = OTC_ASSETS[asset];
  if (!cfg) return;
  let s = streams.get(asset);
  if (s) return;
  s = { derivSym: cfg.derivSym, ws: null, reconnectTimer: null, primed: false };
  streams.set(asset, s);
  prime(asset, s).catch(() => {});
  connect(asset, s);
}

function connect(asset: string, s: Stream) {
  if (s.ws) return;
  try {
    s.ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
    s.ws.on("open", () => {
      s.ws?.send(JSON.stringify({ ticks: s.derivSym, subscribe: 1 }));
    });
    s.ws.on("message", (raw: any) => {
      try {
        const d = JSON.parse(raw.toString());
        if (!d.tick) return;
        const epoch: number = d.tick.epoch;
        const price: number = d.tick.quote;
        const minute = Math.floor(epoch / 60) * 60;

        // Read the current base candle from DB (or build a new one)
        const last = getLatestBase(asset);
        let candle: Candle;
        if (last && last.time === minute) {
          candle = {
            time:  minute,
            open:  last.open,
            high:  Math.max(last.high, price),
            low:   Math.min(last.low, price),
            close: price,
          };
        } else {
          // New candle: open = previous close (continuity)
          const openPrice = last?.close ?? price;
          candle = { time: minute, open: openPrice, high: Math.max(openPrice, price), low: Math.min(openPrice, price), close: price };
        }
        upsertBase.run(asset, candle.time, candle.open, candle.high, candle.low, candle.close);
        emit(asset, candle);
      } catch {}
    });
    s.ws.on("close", () => {
      s.ws = null;
      s.reconnectTimer = setTimeout(() => connect(asset, s), 2000);
    });
    s.ws.on("error", () => { try { s.ws?.close(); } catch {} });
  } catch {
    s.reconnectTimer = setTimeout(() => connect(asset, s), 2000);
  }
}

async function prime(asset: string, s: Stream): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
      const timer = setTimeout(() => { try { ws.close(); } catch {} resolve(); }, 10_000);
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
            const insert = db.transaction((arr: any[]) => {
              for (const c of arr) {
                upsertBase.run(asset, c.epoch, c.open, c.high, c.low, c.close);
              }
            });
            insert(d.candles);
            s.primed = true;
          }
        } catch {}
        clearTimeout(timer);
        try { ws.close(); } catch {}
        resolve();
      });
      ws.on("error", () => { clearTimeout(timer); resolve(); });
    } catch { resolve(); }
  });
}
