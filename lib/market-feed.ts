/**
 * Market Feed — Server-side proxy for ALL assets.
 *
 * Maintains persistent connections to Deriv (forex/synth) and Binance (crypto),
 * caches M1 candles + latest price in SQLite. Frontend fetches from our server
 * instead of connecting to external APIs directly.
 *
 * Benefits:
 * - Instant loading (local SQLite, not external API)
 * - Works on mobile (no browser WS dependency)
 * - Single connection per source (not 1 per user)
 * - All users see the same price
 */

import WebSocket from "ws";
import db from "@/lib/db";

export type Candle = { time: number; open: number; high: number; low: number; close: number };

// ── DB statements ───────────────────────────────────────────────────────
const upsertCandle = db.prepare(`
  INSERT INTO market_candles (asset, time, open, high, low, close)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(asset, time) DO UPDATE SET
    high = MAX(market_candles.high, excluded.high),
    low  = MIN(market_candles.low, excluded.low),
    close = excluded.close
`);

const upsertPrice = db.prepare(`
  INSERT INTO market_prices (asset, price, updated_at) VALUES (?, ?, ?)
  ON CONFLICT(asset) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at
`);

// ── Public read API ─────────────────────────────────────────────────────
export function getCandles(asset: string, count = 500): Candle[] {
  try {
    const rows = db.prepare(
      "SELECT time, open, high, low, close FROM market_candles WHERE asset = ? ORDER BY time DESC LIMIT ?"
    ).all(asset, count) as Candle[];
    return rows.reverse();
  } catch { return []; }
}

export function getPrice(asset: string): number {
  try {
    const row = db.prepare("SELECT price FROM market_prices WHERE asset = ?").get(asset) as { price: number } | undefined;
    return row?.price ?? 0;
  } catch { return 0; }
}

// ── Tick processing ─────────────────────────────────────────────────────
function processTick(asset: string, price: number, epochSec: number) {
  if (price <= 0) return;
  const minute = Math.floor(epochSec / 60) * 60;

  // Update price cache
  upsertPrice.run(asset, price, Date.now());

  // Update candle
  const existing = db.prepare(
    "SELECT open, high, low, close FROM market_candles WHERE asset = ? AND time = ?"
  ).get(asset, minute) as Candle | undefined;

  if (existing) {
    upsertCandle.run(asset, minute, existing.open, Math.max(existing.high, price), Math.min(existing.low, price), price);
  } else {
    // New candle — get previous close for continuity
    const prev = db.prepare(
      "SELECT close FROM market_candles WHERE asset = ? AND time < ? ORDER BY time DESC LIMIT 1"
    ).get(asset, minute) as { close: number } | undefined;
    const open = prev?.close ?? price;
    upsertCandle.run(asset, minute, open, Math.max(open, price), Math.min(open, price), price);
  }
}

// ── Deriv symbols ───────────────────────────────────────────────────────
const DERIV_ASSETS: Record<string, string> = {
  // Major forex
  EURUSD: "frxEURUSD", GBPUSD: "frxGBPUSD", USDJPY: "frxUSDJPY",
  AUDUSD: "frxAUDUSD", USDCAD: "frxUSDCAD", USDCHF: "frxUSDCHF",
  NZDUSD: "frxNZDUSD", EURGBP: "frxEURGBP", EURJPY: "frxEURJPY",
  EURCHF: "frxEURCHF", GBPJPY: "frxGBPJPY", AUDJPY: "frxAUDJPY",
  // Minor forex
  AUDCAD: "frxAUDCAD", AUDCHF: "frxAUDCHF", AUDNZD: "frxAUDNZD",
  EURAUD: "frxEURAUD", EURCAD: "frxEURCAD", EURNZD: "frxEURNZD",
  GBPAUD: "frxGBPAUD", GBPCAD: "frxGBPCAD", GBPCHF: "frxGBPCHF",
  GBPNOK: "frxGBPNOK", GBPNZD: "frxGBPNZD", NZDJPY: "frxNZDJPY",
  USDMXN: "frxUSDMXN", USDNOK: "frxUSDNOK", USDPLN: "frxUSDPLN", USDSEK: "frxUSDSEK",
  // Metals
  XAUUSD: "frxXAUUSD", XAGUSD: "frxXAGUSD",
  // Synthetic volatility indices (24/7)
  R_10: "R_10", R_25: "R_25", R_50: "R_50", R_75: "R_75", R_100: "R_100",
  "1HZ10V": "1HZ10V", "1HZ25V": "1HZ25V", "1HZ50V": "1HZ50V", "1HZ75V": "1HZ75V", "1HZ100V": "1HZ100V",
  // Jump indices (24/7)
  JD10: "JD10", JD25: "JD25", JD50: "JD50", JD75: "JD75", JD100: "JD100",
  // OTC stock indices
  OTC_DJI: "OTC_DJI", OTC_FTSE: "OTC_FTSE", OTC_GDAXI: "OTC_GDAXI",
  OTC_NDX: "OTC_NDX", OTC_SPC: "OTC_SPC", OTC_N225: "OTC_N225",
  OTC_AEX: "OTC_AEX", OTC_AS51: "OTC_AS51", OTC_FCHI: "OTC_FCHI",
  OTC_HSI: "OTC_HSI", OTC_SSMI: "OTC_SSMI", OTC_SX5E: "OTC_SX5E",
};

// Reverse map: derivSym → asset
const DERIV_REVERSE: Record<string, string> = {};
for (const [asset, sym] of Object.entries(DERIV_ASSETS)) DERIV_REVERSE[sym] = asset;

// ── Binance symbols ─────────────────────────────────────────────────────
const BINANCE_ASSETS: Record<string, string> = {
  BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT", SOLUSD: "SOLUSDT",
  BNBUSD: "BNBUSDT", ADAUSD: "ADAUSDT", XRPUSD: "XRPUSDT",
};

// ── Deriv persistent WebSocket ──────────────────────────────────────────
let derivWs: WebSocket | null = null;
let derivDead = false;
let derivSubscribed = false;

function connectDeriv() {
  if (derivDead) return;
  try {
    derivWs = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
    derivWs.on("open", () => {
      console.log("[market-feed] Deriv connected");
      derivSubscribed = false;
      // Subscribe to all Deriv assets
      for (const derivSym of Object.values(DERIV_ASSETS)) {
        derivWs?.send(JSON.stringify({ ticks: derivSym, subscribe: 1 }));
      }
      derivSubscribed = true;
    });
    derivWs.on("message", (raw: any) => {
      try {
        const d = JSON.parse(raw.toString());
        if (d.tick) {
          const asset = DERIV_REVERSE[d.tick.symbol];
          if (asset) processTick(asset, d.tick.quote, d.tick.epoch);
        }
      } catch {}
    });
    derivWs.on("close", () => {
      derivWs = null;
      derivSubscribed = false;
      if (!derivDead) setTimeout(connectDeriv, 3000);
    });
    derivWs.on("error", () => { try { derivWs?.close(); } catch {} });
  } catch {
    setTimeout(connectDeriv, 3000);
  }
}

// ── Binance polling (1s) ────────────────────────────────────────────────
let binanceTimer: ReturnType<typeof setInterval> | null = null;

async function pollBinance() {
  for (const [asset, binSym] of Object.entries(BINANCE_ASSETS)) {
    try {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binSym}`);
      const d = await r.json();
      if (d.price) {
        const price = parseFloat(d.price);
        const now = Math.floor(Date.now() / 1000);
        processTick(asset, price, now);
      }
    } catch {}
  }
}

// ── Prime history (one-shot per asset) ──────────────────────────────────
const primedAssets = new Set<string>();

async function primeAsset(asset: string) {
  if (primedAssets.has(asset)) return;
  primedAssets.add(asset);

  // Check if we already have enough candles
  const count = (db.prepare("SELECT COUNT(*) AS n FROM market_candles WHERE asset = ?").get(asset) as any).n;
  if (count >= 100) return;

  const derivSym = DERIV_ASSETS[asset];
  const binSym = BINANCE_ASSETS[asset];

  if (binSym) {
    // Binance: fetch M1 klines
    try {
      const r = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binSym}&interval=1m&limit=500`);
      const raw: any[][] = await r.json();
      const insert = db.transaction((arr: any[][]) => {
        for (const k of arr) {
          const time = Math.floor(k[0] / 1000);
          upsertCandle.run(asset, time, parseFloat(k[1]), parseFloat(k[2]), parseFloat(k[3]), parseFloat(k[4]));
        }
      });
      insert(raw);
      console.log(`[market-feed] primed ${asset} with ${raw.length} Binance candles`);
    } catch (e) { console.warn(`[market-feed] prime ${asset} Binance failed:`, e); }
  } else if (derivSym) {
    // Deriv: one-shot history
    try {
      const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => { try { ws.close(); } catch {} resolve(); }, 10000);
        ws.on("open", () => {
          ws.send(JSON.stringify({ ticks_history: derivSym, style: "candles", granularity: 60, count: 500, end: "latest" }));
        });
        ws.on("message", (raw: any) => {
          try {
            const d = JSON.parse(raw.toString());
            if (Array.isArray(d.candles)) {
              const insert = db.transaction((arr: any[]) => {
                for (const c of arr) upsertCandle.run(asset, c.epoch, c.open, c.high, c.low, c.close);
              });
              insert(d.candles);
              console.log(`[market-feed] primed ${asset} with ${d.candles.length} Deriv candles`);
            }
          } catch {}
          clearTimeout(timer);
          try { ws.close(); } catch {}
          resolve();
        });
        ws.on("error", () => { clearTimeout(timer); resolve(); });
      });
    } catch (e) { console.warn(`[market-feed] prime ${asset} Deriv failed:`, e); }
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────
let booted = false;

export function ensureMarketFeed() {
  if (booted) return;
  booted = true;
  console.log("[market-feed] starting...");
  connectDeriv();
  pollBinance();
  binanceTimer = setInterval(pollBinance, 2000);
}

export function ensureAssetPrimed(asset: string) {
  ensureMarketFeed();
  primeAsset(asset).catch(() => {});
}

// Cleanup (not normally called, but available)
export function stopMarketFeed() {
  derivDead = true;
  if (derivWs) try { derivWs.close(); } catch {}
  if (binanceTimer) clearInterval(binanceTimer);
}
