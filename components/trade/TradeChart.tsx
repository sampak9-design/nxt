"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  ISeriesApi,
  IChartApi,
  UTCTimestamp,
} from "lightweight-charts";
import {
  MousePointer2, Minus, TrendingUp, Square, Eraser, Trash2, Pen, ZoomIn, ZoomOut, Crosshair,
} from "lucide-react";
import type { Tab, ActiveTrade } from "./TradeLayout";

/* ── Types ──────────────────────────────────────────────────────────── */
type Candle = { time: UTCTimestamp; open: number; high: number; low: number; close: number };
type Pt     = { time: number; price: number };

type HLine  = { id: string; type: "hline"; price: number; color: string };
type VLine  = { id: string; type: "vline"; time: number;  color: string };
type Trend  = { id: string; type: "trend"; p1: Pt; p2: Pt; color: string };
type Rect   = { id: string; type: "rect";  p1: Pt; p2: Pt; color: string };
type Freehand = { id: string; type: "freehand"; points: { time: number; price: number }[]; color: string };
type Drawing = HLine | VLine | Trend | Rect | Freehand;

type Tool = "cursor" | "hline" | "vline" | "trend" | "rect" | "freehand" | "erase";

/* ── Constants ──────────────────────────────────────────────────────── */
const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

const TF_SEC: Record<string, number> = {
  "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400,
};

const FOREX_SEED: Record<string, number> = {
  // Major forex
  EURUSD: 1.085, GBPUSD: 1.268, USDJPY: 149.8, AUDUSD: 0.643,
  USDCAD: 1.362, USDCHF: 0.893, NZDUSD: 0.592, EURGBP: 0.855,
  EURJPY: 162.5, EURCHF: 0.969, GBPJPY: 190.1, AUDJPY: 96.3,
  // Minor forex
  AUDCAD: 0.91, AUDCHF: 0.58, AUDNZD: 1.09,
  EURAUD: 1.69, EURCAD: 1.47, EURNZD: 1.84,
  GBPAUD: 1.97, GBPCAD: 1.74, GBPCHF: 1.13,
  GBPNOK: 13.5, GBPNZD: 2.17, NZDJPY: 90.5,
  USDMXN: 17.2, USDNOK: 10.7, USDPLN: 3.95, USDSEK: 10.4,
  // Metals
  XAUUSD: 2340, XAGUSD: 28.0,
  // Synthetic volatility
  R_10: 1000, R_25: 3000, R_50: 5000, R_75: 5000, R_100: 3000,
  "1HZ10V": 1000, "1HZ25V": 3000, "1HZ50V": 5000, "1HZ75V": 5000, "1HZ100V": 3000,
  // Jump indices
  JD10: 1000, JD25: 3000, JD50: 5000, JD75: 7000, JD100: 9000,
  // OTC stock indices
  OTC_DJI: 38000, OTC_FTSE: 8200, OTC_GDAXI: 18000, OTC_NDX: 17500,
  OTC_SPC: 5200, OTC_N225: 38000, OTC_AEX: 870, OTC_AS51: 7800,
  OTC_FCHI: 8000, OTC_HSI: 17000, OTC_SSMI: 11500, OTC_SX5E: 4900,
  // Crypto
  BTCUSD: 66000, ETHUSD: 3200, SOLUSD: 140,
  BNBUSD: 580, ADAUSD: 0.45, XRPUSD: 0.55,
};

const COLORS = ["#f97316","#ffffff","#22c55e","#ef4444","#3b82f6","#facc15","#a855f7"];

function seedPrice(id: string) { return FOREX_SEED[id.replace("-OTC", "")] ?? 1.0; }

const BINANCE_MAP: Record<string, string> = {
  BTCUSD: "BTCUSDT", ETHUSD: "ETHUSDT", SOLUSD: "SOLUSDT",
  BNBUSD: "BNBUSDT", ADAUSD: "ADAUSDT", XRPUSD: "XRPUSDT",
};

const BINANCE_TF: Record<string, string> = {
  "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1d": "1d",
};

const DERIV_SYMBOL: Record<string, string> = {
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
  // OTC stock indices (market hours only)
  OTC_DJI: "OTC_DJI", OTC_FTSE: "OTC_FTSE", OTC_GDAXI: "OTC_GDAXI",
  OTC_NDX: "OTC_NDX", OTC_SPC: "OTC_SPC", OTC_N225: "OTC_N225",
  OTC_AEX: "OTC_AEX", OTC_AS51: "OTC_AS51", OTC_FCHI: "OTC_FCHI",
  OTC_HSI: "OTC_HSI", OTC_SSMI: "OTC_SSMI", OTC_SX5E: "OTC_SX5E",
};
const DERIV_GRAN: Record<string, number> = {
  "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400,
};

function derivWS<T>(msg: object): Promise<T> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
    const timer = setTimeout(() => { ws.close(); reject(new Error("deriv timeout")); }, 10000);
    ws.onopen    = () => ws.send(JSON.stringify(msg));
    ws.onmessage = (e) => {
      clearTimeout(timer);
      ws.close();
      const d = JSON.parse(e.data);
      if (d.error) reject(new Error(d.error.message));
      else resolve(d);
    };
    ws.onerror = () => { clearTimeout(timer); reject(new Error("deriv ws error")); };
  });
}

async function fetchCandles(symbol: string, tf: string): Promise<Candle[] | null> {
  const base = symbol.replace("-OTC", "");
  const binanceSym = BINANCE_MAP[base];

  // Crypto → Binance directly from browser (no server proxy)
  if (binanceSym) {
    try {
      const limit = tf === "4h" ? 500 : 1000;
      const interval = BINANCE_TF[tf] ?? "1m";
      const r = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${interval}&limit=${limit}`
      );
      const raw: any[][] = await r.json();
      return raw.map((k) => ({
        time:  Math.floor(k[0] / 1000) as UTCTimestamp,
        open:  parseFloat(k[1]),
        high:  parseFloat(k[2]),
        low:   parseFloat(k[3]),
        close: parseFloat(k[4]),
      }));
    } catch { /* fall through */ }
  }

  // Forex → Deriv (real-time OHLC, free, no rate limits)
  const derivSym = DERIV_SYMBOL[base];
  if (derivSym) {
    try {
      const gran  = DERIV_GRAN[tf] ?? 60;
      const count = tf === "1d" ? 365 : 500;
      const data: any = await derivWS({
        ticks_history: derivSym,
        style: "candles",
        granularity: gran,
        count,
        end: "latest",
      });
      if (Array.isArray(data.candles) && data.candles.length > 1) {
        return data.candles.map((c: any) => ({
          time:  c.epoch as UTCTimestamp,
          open:  c.open,
          high:  c.high,
          low:   c.low,
          close: c.close,
        }));
      }
    } catch { /* fall through */ }
  }

  // Forex → server proxy (fallback)
  if (base.length === 6) {
    try {
      const r = await fetch(`/api/candles?symbol=${symbol}&tf=${tf}`);
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length > 1) return data;
      }
    } catch { /* fall through */ }
  }

  return null;
}

async function fetchPrice(symbol: string): Promise<number | null> {
  const base = symbol.replace("-OTC", "");
  const binanceSym = BINANCE_MAP[base];

  // Crypto → Binance directly from browser
  if (binanceSym) {
    try {
      const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSym}`);
      const d = await r.json();
      return typeof d.price === "string" ? parseFloat(d.price) : null;
    } catch { /* fall through */ }
  }

  // Forex → Deriv tick (real-time price)
  const derivSym2 = DERIV_SYMBOL[base];
  if (derivSym2) {
    try {
      const data: any = await derivWS({ ticks_history: derivSym2, style: "ticks", count: 1, end: "latest" });
      const prices = data?.history?.prices;
      if (Array.isArray(prices) && prices.length > 0) return prices[prices.length - 1];
    } catch { /* fall through */ }
  }

  // Forex → server proxy (fallback)
  try {
    const r = await fetch(`/api/quote?symbol=${symbol}`);
    if (r.ok) {
      const d = await r.json();
      if (typeof d.price === "number") return d.price;
    }
  } catch { /* fall through */ }

  return null;
}

/* ── coordToTime: handles future area beyond last candle ─────────────── */
function coordToTime(x: number, chart: IChartApi, candles: { time: number }[]): number | null {
  // Try native first (works for historical area)
  const native = chart.timeScale().coordinateToTime(x);
  if (native !== null) return native as number;
  // Extrapolate: get logical index, derive time from candles + bar interval
  if (candles.length < 2) return null;
  const logical = chart.timeScale().coordinateToLogical(x);
  if (logical === null) return null;
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const barInterval = last.time - prev.time;
  const lastIndex   = candles.length - 1;
  return Math.round(last.time + (logical - lastIndex) * barInterval);
}

/* ── Canvas render ──────────────────────────────────────────────────── */
function renderCanvas(
  canvas: HTMLCanvasElement,
  drawings: Drawing[],
  preview: { type: Tool; p1?: { x: number; y: number }; mx: number; my: number } | null,
  chart: IChartApi,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  series: ISeriesApi<any>,
  candleData: { time: number }[],
  selectedId: string | null = null,
  barSeconds = 60,
  currentPrice: number | null = null,
  activeTrades: { id: string; entryPrice: number; entryTime: number; direction: "up" | "down"; amount: number; expiresAt: number; payout: number; result?: "win" | "lose" }[] = [],
  expiryMs = 60000,
  hoverDirection: "up" | "down" | null = null,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // ── Hover overlay split at current price line (gradient) ────────────
  if (hoverDirection !== null && currentPrice !== null) {
    const priceY = series.priceToCoordinate(currentPrice) as number | null;
    if (priceY !== null) {
      ctx.save();
      if (hoverDirection === "up") {
        // transparent at price line → green at top
        const grad = ctx.createLinearGradient(0, priceY, 0, 0);
        grad.addColorStop(0, "rgba(34,197,94,0)");
        grad.addColorStop(1, "rgba(34,197,94,0.18)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, priceY);
      } else {
        // transparent at price line → red at bottom
        const grad = ctx.createLinearGradient(0, priceY, 0, canvas.height);
        grad.addColorStop(0, "rgba(239,68,68,0)");
        grad.addColorStop(1, "rgba(239,68,68,0.18)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, priceY, canvas.width, canvas.height - priceY);
      }
      ctx.restore();
    }
  }

  // px: time → pixel X, with future extrapolation using candle bar interval
  const px = (time: number): number | null => {
    const ts    = chart.timeScale();
    const coord = ts.timeToCoordinate(time as UTCTimestamp);
    if (coord !== null) return coord as number;
    // Future area: extrapolate using last bar's pixel position + pxPerBar
    if (candleData.length < 2) return null;
    const last     = candleData[candleData.length - 1];
    const prev     = candleData[candleData.length - 2];
    const lastCoord = ts.timeToCoordinate(last.time as UTCTimestamp);
    const prevCoord = ts.timeToCoordinate(prev.time as UTCTimestamp);
    if (lastCoord === null || prevCoord === null) return null;
    const pxPerBar    = (lastCoord as number) - (prevCoord as number);
    const barInterval = last.time - prev.time;
    if (barInterval === 0) return null;
    const barsAhead = (time - last.time) / barInterval;
    return (lastCoord as number) + barsAhead * pxPerBar;
  };
  const py = (price: number): number | null => series.priceToCoordinate(price) as number | null;

  const drawLine = (x1: number, y1: number, x2: number, y2: number, color: string, dash = false, selected = false) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = selected ? 3 : 1.5;
    if (selected) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
    if (dash) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };

  const drawRect = (x1: number, y1: number, x2: number, y2: number, color: string, selected = false) => {
    const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
    const rw = Math.abs(x2 - x1),   rh = Math.abs(y2 - y1);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = selected ? 3 : 1.5;
    if (selected) { ctx.shadowColor = color; ctx.shadowBlur = 6; }
    ctx.fillStyle   = color + "22";
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();
  };

  // Draw saved drawings
  for (const d of drawings) {
    const sel = d.id === selectedId;
    if (d.type === "hline") {
      const y = py(d.price);
      if (y === null) continue;
      drawLine(0, y, canvas.width, y, d.color, false, sel);
      ctx.save();
      ctx.fillStyle  = d.color;
      ctx.font       = sel ? "bold 10px monospace" : "10px monospace";
      ctx.fillText(d.price.toFixed(5), 4, y - 3);
      ctx.restore();
    }
    if (d.type === "vline") {
      const x = px(d.time);
      if (x === null) continue;
      drawLine(x, 0, x, canvas.height, d.color, false, sel);
    }
    if (d.type === "trend") {
      const x1 = px(d.p1.time), y1 = py(d.p1.price);
      const x2 = px(d.p2.time), y2 = py(d.p2.price);
      if (x1 === null || y1 === null || x2 === null || y2 === null) continue;
      drawLine(x1, y1, x2, y2, d.color, false, sel);
      ctx.save();
      ctx.fillStyle  = d.color;
      ctx.shadowColor = sel ? d.color : "transparent";
      ctx.shadowBlur  = sel ? 6 : 0;
      ctx.beginPath(); ctx.arc(x1, y1, sel ? 5 : 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x2, y2, sel ? 5 : 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (d.type === "rect") {
      const x1 = px(d.p1.time), y1 = py(d.p1.price);
      const x2 = px(d.p2.time), y2 = py(d.p2.price);
      if (x1 === null || y1 === null || x2 === null || y2 === null) continue;
      drawRect(x1, y1, x2, y2, d.color, sel);
    }
    if (d.type === "freehand" && d.points.length > 1) {
      const screenPts = d.points
        .map((p) => ({ x: px(p.time) as number | null, y: py(p.price) as number | null }))
        .filter((p): p is { x: number; y: number } => p.x !== null && p.y !== null);
      if (screenPts.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = d.color;
      ctx.lineWidth   = sel ? 3 : 1.5;
      if (sel) { ctx.shadowColor = d.color; ctx.shadowBlur = 6; }
      ctx.lineJoin    = "round";
      ctx.lineCap     = "round";
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].x, screenPts[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  // Preview in-progress drawing
  if (preview?.p1) {
    const { p1, mx, my, type } = preview;
    if (type === "trend") drawLine(p1.x, p1.y, mx, my, "#f97316", true);
    if (type === "rect")  drawRect(p1.x, p1.y, mx, my, "#f97316");
  }

  // ── Active trade entries drawn on chart ──────────────────────────────
  for (const trade of activeTrades) {
    const entryX = chart.timeScale().timeToCoordinate(trade.entryTime as UTCTimestamp) as number | null;
    const entryY = series.priceToCoordinate(trade.entryPrice) as number | null;
    if (entryX === null || entryY === null) continue;

    const isUp    = trade.direction === "up";
    const color   = isUp ? "#22c55e" : "#ef4444";
    const arrowSz = 8;

    // Arrow pointing direction
    ctx.save();
    ctx.beginPath();
    if (isUp) {
      const tip = entryY - 14;
      ctx.moveTo(entryX, tip);
      ctx.lineTo(entryX - arrowSz, tip + arrowSz * 1.4);
      ctx.lineTo(entryX + arrowSz, tip + arrowSz * 1.4);
    } else {
      const tip = entryY + 14;
      ctx.moveTo(entryX, tip);
      ctx.lineTo(entryX - arrowSz, tip - arrowSz * 1.4);
      ctx.lineTo(entryX + arrowSz, tip - arrowSz * 1.4);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.restore();

    if (!trade.result) {
      // Badge: colored pill with amount above the arrow, arrow indicator below
      const labelText = `R$${trade.amount}`;
      ctx.save();
      ctx.font         = "bold 11px sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign    = "center";
      const tw  = ctx.measureText(labelText).width;
      const bw  = tw + 12;
      const bh  = 18;
      const bx  = entryX - bw / 2;
      const by  = isUp ? entryY - 14 - arrowSz * 1.4 - bh - 6 : entryY + 14 + arrowSz * 1.4 + 6;

      // pill background
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 4);
      ctx.fill();

      // amount text white
      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, entryX, by + bh / 2);

      // small direction triangle below/above badge pointing toward candle
      const triSz = 4;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (isUp) {
        ctx.moveTo(entryX - triSz, by + bh);
        ctx.lineTo(entryX + triSz, by + bh);
        ctx.lineTo(entryX, by + bh + triSz * 1.5);
      } else {
        ctx.moveTo(entryX - triSz, by);
        ctx.lineTo(entryX + triSz, by);
        ctx.lineTo(entryX, by - triSz * 1.5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Permanent pre-trade indicators ──────────────────────────────────
  // Always show: dashed line at next candle close + "HORA DE COMPRA" label
  // + solid red line at next candle close + selected expiry
  if (candleData.length > 0) {
    // Use logical bar indices — completely timezone-agnostic.
    // candleData.length is the index of the NEXT (not-yet-opened) bar.
    const ts = chart.timeScale();
    const nextBarIdx   = candleData.length;
    const expiryBars   = Math.max(1, Math.round((expiryMs / 1000) / barSeconds));
    const expiryBarIdx = nextBarIdx + expiryBars;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entryX  = ts.logicalToCoordinate(nextBarIdx   as any) as number | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expireX = ts.logicalToCoordinate(expiryBarIdx as any) as number | null;

    // countdown: seconds remaining in current bar (BRT-relative)
    const lastCandleTime = candleData[candleData.length - 1].time as number;
    const nowBRT  = Math.floor(Date.now() / 1000) - 3 * 3600;
    const remSBar = Math.max(0, barSeconds - (Math.max(0, nowBRT - lastCandleTime) % barSeconds));

    // Dashed white line at next candle close (entry point)
    if (entryX !== null) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(entryX, 0);
      ctx.lineTo(entryX, canvas.height);
      ctx.stroke();
      ctx.restore();
    }

    // ── "HORA DE COMPRA" label — fixed at center-top of canvas, never moves ──
    {
      const openTrade = activeTrades.find((t) => !t.result);
      let countdownStr: string;
      if (openTrade) {
        const remMs = Math.max(0, openTrade.expiresAt - Date.now());
        const remS  = Math.ceil(remMs / 1000);
        countdownStr = `${String(Math.floor(remS / 60)).padStart(2,"0")}:${String(remS % 60).padStart(2,"0")}`;
      } else {
        const remS  = remSBar;
        countdownStr = `${String(Math.floor(remS / 60)).padStart(2,"0")}:${String(remS % 60).padStart(2,"0")}`;
      }

      ctx.save();
      ctx.textBaseline = "middle";
      ctx.textAlign    = "left";

      ctx.font = "bold 9px sans-serif";
      const labelW = ctx.measureText("COMPRA").width + 8;
      ctx.font = "bold 22px monospace";
      const numW = ctx.measureText(countdownStr).width;

      const padX = 8, bh = 38;
      const bw   = padX + labelW + 6 + numW + padX;
      const bx   = canvas.width / 2 - bw / 2; // fixed center of canvas
      const by   = 4;
      const midY = by + bh / 2;

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font      = "bold 8px sans-serif";
      ctx.fillText("HORA DE", bx + padX, midY - 7);
      ctx.fillText("COMPRA",  bx + padX, midY + 6);

      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(bx + padX + labelW + 2, by + 5);
      ctx.lineTo(bx + padX + labelW + 2, by + bh - 5);
      ctx.stroke();

      ctx.fillStyle    = "#ffffff";
      ctx.font         = "bold 22px monospace";
      ctx.textBaseline = "middle";
      ctx.fillText(countdownStr, bx + padX + labelW + 8, midY);
      ctx.restore();
    }

    // Solid red line at expiry time — drawn last so it's always on top
    if (expireX !== null) {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth   = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(expireX, 0);
      ctx.lineTo(expireX, canvas.height);
      ctx.stroke();
      ctx.restore();
    }

    // Re-draw white dashed line last too so it's always on top of drawings
    if (entryX !== null) {
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(entryX, 0);
      ctx.lineTo(entryX, canvas.height);
      ctx.stroke();
      ctx.restore();
    }

    // ── Bottom badges ────────────────────────────────────────────────────
    const badgeY = canvas.height - 18;
    const badgeR = 14;

    // White circle with clock icon at entry line
    if (entryX !== null) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(entryX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth   = 1;
      ctx.stroke();
      // clock face
      ctx.strokeStyle = "#333333";
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.arc(entryX, badgeY, badgeR * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      // clock hands
      ctx.beginPath();
      ctx.moveTo(entryX, badgeY);
      ctx.lineTo(entryX, badgeY - badgeR * 0.4); // 12 o'clock
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(entryX, badgeY);
      ctx.lineTo(entryX + badgeR * 0.3, badgeY); // 3 o'clock
      ctx.stroke();
      ctx.restore();
    }

    // Red circle with countdown seconds at expiry line
    if (expireX !== null) {
      const openTrade  = activeTrades.find((t) => !t.result);
      const remS = openTrade
        ? Math.ceil(Math.max(0, openTrade.expiresAt - Date.now()) / 1000)
        : remSBar + (expiryBars - 1) * barSeconds;
      const remLabel = remS >= 60
        ? `${Math.floor(remS / 60)}:${String(remS % 60).padStart(2,"0")}`
        : String(remS);

      ctx.save();
      ctx.beginPath();
      ctx.arc(expireX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.font         = `bold ${remLabel.length > 2 ? 8 : 10}px monospace`;
      ctx.fillStyle    = "#ffffff";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(remLabel, expireX, badgeY);
      ctx.restore();
    }
  }

  // ── Candle countdown clock + forward price line — drawn last, on top of everything ──
  if (candleData.length > 0 && currentPrice !== null) {
    const lastCandle = candleData[candleData.length - 1];
    const candleX = chart.timeScale().timeToCoordinate(lastCandle.time as UTCTimestamp) as number | null;
    const priceY  = series.priceToCoordinate(currentPrice) as number | null;
    if (candleX !== null && priceY !== null) {
      // Price line from current candle forward (right side only)
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(candleX, priceY);
      ctx.lineTo(canvas.width, priceY);
      ctx.stroke();
      ctx.restore();

      // Custom price label — white bg, black text, last 2 digits red
      const priceStr  = currentPrice.toFixed(currentPrice >= 100 ? 2 : 5);
      const mainPart  = priceStr.slice(0, -2);
      const redPart   = priceStr.slice(-2);
      const font      = "bold 11px monospace";
      ctx.save();
      ctx.font         = font;
      ctx.textBaseline = "middle";
      const mainW = ctx.measureText(mainPart).width;
      const redW  = ctx.measureText(redPart).width;
      const totalW = mainW + redW;
      const padX = 5, padY = 3;
      const lh   = 14;
      const lx   = canvas.width - totalW - padX * 2 - 2;
      const ly   = priceY - lh / 2 - padY;
      // white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(lx, ly, totalW + padX * 2, lh + padY * 2);
      // black main text
      ctx.fillStyle = "#000000";
      ctx.fillText(mainPart, lx + padX, priceY);
      // red last 2 digits
      ctx.fillStyle = "#ef4444";
      ctx.fillText(redPart, lx + padX + mainW, priceY);
      ctx.restore();

      // Countdown clock — white, fixed just after last candle regardless of zoom
      const nowSec    = Math.floor(Date.now() / 1000) - 3 * 3600; // BRT UTC-3
      const elapsed   = nowSec - lastCandle.time;
      const remaining = Math.max(0, barSeconds - (elapsed % barSeconds));
      const mm  = String(Math.floor(remaining / 60)).padStart(2, "0");
      const ss  = String(remaining % 60).padStart(2, "0");
      const label = `${mm}:${ss}`;
      ctx.save();
      ctx.font         = "bold 12px monospace";
      ctx.textBaseline = "bottom";
      ctx.textAlign    = "left";
      const tw = ctx.measureText(label).width;
      // Calculate bar width to find the right edge of the last candle
      let afterCandleX = candleX + 10;
      if (candleData.length >= 2) {
        const prevCandle  = candleData[candleData.length - 2];
        const prevX = chart.timeScale().timeToCoordinate(prevCandle.time as UTCTimestamp) as number | null;
        if (prevX !== null) {
          const barW = candleX - prevX;
          afterCandleX = candleX + barW / 2 + 4; // right edge of last candle + small gap
        }
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, afterCandleX, priceY - 5);
      ctx.restore();
    }
  }
}

/* ── Props ──────────────────────────────────────────────────────────── */
interface Props {
  tab: Tab;
  activeTrades: ActiveTrade[];
  onPriceChange: (price: number, time: number) => void;
  expiryMs: number;
  hoverDirection?: "up" | "down" | null;
}

/* ── Component ──────────────────────────────────────────────────────── */
export default function TradeChart({ tab, activeTrades, onPriceChange, expiryMs, hoverDirection = null }: Props) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const candles      = useRef<Candle[]>([]);
  const lastPrice    = useRef(0);
  const lastTime     = useRef(0);
  const realPriceRef   = useRef(0); // latest price from API, micro-tick drifts toward this
  const signalRef      = useRef<{ direction: "up" | "down"; strength: number } | null>(null);
  const activeKeyRef   = useRef(""); // tracks current tab.id+tf — stale async ops check this
  const pendingPt      = useRef<{ x: number; y: number; time: number; price: number } | null>(null);
  const freehandRef    = useRef<{ id: string; points: { time: number; price: number }[] } | null>(null);
  const isDrawingFree  = useRef(false);
  const previewRef     = useRef<{ type: Tool; p1?: { x: number; y: number }; mx: number; my: number } | null>(null);

  const [tf, setTf]           = useState("1m");
  const [price, setPrice]     = useState<number | null>(null);
  const [up, setUp]           = useState(true);
  const [loading, setLoading] = useState(true);
  const [tool, setTool]       = useState<Tool>("cursor");
  const [color, setColor]     = useState(COLORS[0]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [badges, setBadges] = useState<{ id: string; text: string; color: string; entryTime: number; entryPrice: number }[]>([]);

  // Persist drawings per tab+tf — survives re-renders, tab switches, and page refresh
  const LS_KEY = "xd_drawings";
  const drawingsStore = useRef<Record<string, Drawing[]>>({});
  const drawingsRef = useRef<Drawing[]>([]);
  drawingsRef.current = drawings;

  const persistedSetDrawings = (updater: Drawing[] | ((prev: Drawing[]) => Drawing[])) => {
    setDrawings((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const key  = `${tab.id}:${tfRef.current}`;
      drawingsStore.current[key] = next;
      try {
        const store = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
        store[key]  = next;
        localStorage.setItem(LS_KEY, JSON.stringify(store));
      } catch {}
      return next;
    });
  };
  const colorRef = useRef(color);
  colorRef.current = color;
  const selectedIdRef = useRef<string | null>(null);
  selectedIdRef.current = selectedId;
  const toolRef = useRef<Tool>("cursor");
  toolRef.current = tool;
  const priceRef = useRef<number | null>(null);
  priceRef.current = price;
  const tfRef = useRef("1m");
  tfRef.current = tf;
  const activeTradesRef = useRef(activeTrades);
  activeTradesRef.current = activeTrades;
  const expiryMsRef = useRef(expiryMs);
  expiryMsRef.current = expiryMs;
  const hoverDirectionRef = useRef(hoverDirection);
  hoverDirectionRef.current = hoverDirection;
  const dragRef = useRef<{ id: string; startX: number; startY: number; handle: "p1" | "p2" | "body" } | null>(null);


  /* ── clear old cache keys on first mount ─────────────────────────── */
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter((k) =>
          k.startsWith("xd_candles:")    ||
          k.startsWith("xd_candles_v2:") ||
          k.startsWith("xd_candles_v3:") ||
          k.startsWith("xd_candles_v4:") ||
          k.startsWith("xd_candles_v5:") ||
          k.startsWith("xd_candles_v7:") || // may contain corrupt candles from pre-fix sessions
          k.startsWith("xd_range:")         // old view positions
        )
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  }, []);

  /* ── mount chart once ─────────────────────────────────────────────── */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#111622" },
        textColor: "rgba(255,255,255,0.45)",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.07)" },
        horzLines: { color: "rgba(255,255,255,0.07)" },
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.2)" },
        horzLine: { color: "rgba(255,255,255,0.2)" },
      },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)", minimumWidth: 70 },
      timeScale: { borderColor: "rgba(255,255,255,0.08)", timeVisible: true, secondsVisible: false, rightOffset: 20, fixRightEdge: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", downColor: "#ef4444",
      borderUpColor: "#22c55e", borderDownColor: "#ef4444",
      wickUpColor: "#22c55e", wickDownColor: "#ef4444",
      priceLineVisible: false,
      lastValueVisible: false,
      // priceFormat set dynamically in applySource based on asset price magnitude
    });


    chartRef.current   = chart;
    seriesRef.current  = series;

    // Continuous rAF loop — canvas always stays in sync with chart coordinates
    let rafId: number;
    const loop = () => {
      const canvas = canvasRef.current;
      const s      = seriesRef.current;
      if (canvas && s) {
        // Merge saved drawings + freehand in progress
        const all = freehandRef.current
          ? [...drawingsRef.current, { id: freehandRef.current.id, type: "freehand" as const, points: freehandRef.current.points, color: colorRef.current }]
          : drawingsRef.current;
        const barSec = TF_SEC[tfRef.current] ?? 60;
        renderCanvas(canvas, all, previewRef.current, chart, s, candles.current, selectedIdRef.current, barSec, priceRef.current, activeTradesRef.current, expiryMsRef.current, hoverDirectionRef.current);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    // Distance from point (px,py) to segment (ax,ay)-(bx,by)
    const distToSegment = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
      const dx = bx - ax, dy = by - ay;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) return Math.hypot(px - ax, py - ay);
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    };

    // Shared hit-test: returns drawing id closest to (x,y) within THRESH pixels
    const hitTest = (x: number, y: number, s: typeof seriesRef.current): string | null => {
      if (!s) return null;
      const ts = chart.timeScale();
      const toX = (time: number) => {
        const c = ts.timeToCoordinate(time as UTCTimestamp);
        if (c !== null) return c as number;
        // extrapolate future
        if (candles.current.length < 2) return null;
        const last = candles.current[candles.current.length - 1];
        const prev = candles.current[candles.current.length - 2];
        const lc = ts.timeToCoordinate(last.time as UTCTimestamp) as number | null;
        const pc = ts.timeToCoordinate(prev.time as UTCTimestamp) as number | null;
        if (lc === null || pc === null) return null;
        return lc + (time - last.time) / (last.time - prev.time) * (lc - pc);
      };
      const toY = (price: number) => s.priceToCoordinate(price) as number | null;
      const THRESH = 10;
      let closest: string | null = null, minDist = THRESH;
      for (const d of drawingsRef.current) {
        let dist = Infinity;
        if (d.type === "hline") {
          const dy = toY(d.price);
          if (dy !== null) dist = Math.abs(dy - y);
        }
        if (d.type === "vline") {
          const dx = toX(d.time);
          if (dx !== null) dist = Math.abs(dx - x);
        }
        if (d.type === "trend" || d.type === "rect") {
          const x1 = toX(d.p1.time), y1 = toY(d.p1.price);
          const x2 = toX(d.p2.time), y2 = toY(d.p2.price);
          if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
            if (d.type === "trend") {
              dist = distToSegment(x, y, x1, y1, x2, y2);
            } else {
              // rect: check all 4 edges
              dist = Math.min(
                distToSegment(x, y, x1, y1, x2, y1),
                distToSegment(x, y, x2, y1, x2, y2),
                distToSegment(x, y, x2, y2, x1, y2),
                distToSegment(x, y, x1, y2, x1, y1),
              );
            }
          }
        }
        if (d.type === "freehand" && d.points.length > 1) {
          for (let i = 0; i < d.points.length - 1; i++) {
            const ax = toX(d.points[i].time),   ay = toY(d.points[i].price);
            const bx = toX(d.points[i+1].time), by = toY(d.points[i+1].price);
            if (ax !== null && ay !== null && bx !== null && by !== null)
              dist = Math.min(dist, distToSegment(x, y, ax, ay, bx, by));
          }
        }
        if (dist < minDist) { minDist = dist; closest = d.id; }
      }
      return closest;
    };

    // Cursor mode: use chart's native click so pan/zoom still works
    const handleChartClick = (param: { point?: { x: number; y: number } }) => {
      if (toolRef.current !== "cursor") return;
      if (!param.point) { setSelectedId(null); setCtxMenu(null); return; }
      const { x, y } = param.point;
      const hit = hitTest(x, y, seriesRef.current!);
      if (hit) {
        setSelectedId(hit);
        setCtxMenu({ x, y, id: hit });
      } else {
        setSelectedId(null);
        setCtxMenu(null);
      }
    };
    chart.subscribeClick(handleChartClick);

    // Drag drawings in cursor mode via native events on the chart container
    const onMouseDown = (e: MouseEvent) => {
      if (toolRef.current !== "cursor") return;
      const s = seriesRef.current;
      if (!s) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const closest = hitTest(x, y, s);
      if (!closest) return;
      // Determine which handle was clicked for two-point drawings
      let handle: "p1" | "p2" | "body" = "body";
      const d = drawingsRef.current.find((dr) => dr.id === closest);
      if (d && (d.type === "trend" || d.type === "rect")) {
        const ts = chart.timeScale();
        const x1 = ts.timeToCoordinate(d.p1.time as UTCTimestamp) as number | null;
        const y1 = s.priceToCoordinate(d.p1.price) as number | null;
        const x2 = ts.timeToCoordinate(d.p2.time as UTCTimestamp) as number | null;
        const y2 = s.priceToCoordinate(d.p2.price) as number | null;
        const HANDLE_THRESH = 12;
        if (x1 !== null && y1 !== null && Math.hypot(x1 - x, y1 - y) < HANDLE_THRESH) handle = "p1";
        else if (x2 !== null && y2 !== null && Math.hypot(x2 - x, y2 - y) < HANDLE_THRESH) handle = "p2";
      }
      // Start drag — disable chart pan
      dragRef.current = { id: closest, startX: x, startY: y, handle };
      chart.applyOptions({ handleScroll: false, handleScale: false });
      e.stopPropagation();
    };

    const onMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const s = seriesRef.current;
      if (!s) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      drag.startX = x;
      drag.startY = y;
      const id = drag.id;

      // Compute deltaTime and deltaPrice from pixel deltas using two reference pixels
      // anchor at center of canvas — always in visible (historical) area
      const anchorX = el.offsetWidth / 2;
      const anchorY = el.offsetHeight / 2;
      const t0 = coordToTime(anchorX, chart, candles.current);
      const t1 = coordToTime(anchorX + dx, chart, candles.current);
      const p0 = s.coordinateToPrice(anchorY) as number | null;
      const p1 = s.coordinateToPrice(anchorY + dy) as number | null;
      if (!t0 || !t1 || p0 === null || p1 === null) return;
      const deltaTime  = t1 - t0;
      const deltaPrice = (p1 as number) - (p0 as number);

      persistedSetDrawings((prev) => prev.map((d) => {
        if (d.id !== id) return d;
        const handle = drag.handle;
        if (d.type === "hline") {
          return { ...d, price: d.price + deltaPrice };
        }
        if (d.type === "vline") {
          return { ...d, time: d.time + deltaTime };
        }
        if (d.type === "trend" || d.type === "rect") {
          if (handle === "p1") return { ...d, p1: { time: d.p1.time + deltaTime, price: d.p1.price + deltaPrice } };
          if (handle === "p2") return { ...d, p2: { time: d.p2.time + deltaTime, price: d.p2.price + deltaPrice } };
          return {
            ...d,
            p1: { time: d.p1.time + deltaTime, price: d.p1.price + deltaPrice },
            p2: { time: d.p2.time + deltaTime, price: d.p2.price + deltaPrice },
          };
        }
        if (d.type === "freehand") {
          return { ...d, points: d.points.map((p) => ({ time: p.time + deltaTime, price: p.price + deltaPrice })) };
        }
        return d;
      }));
    };

    const onMouseUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      chart.applyOptions({ handleScroll: true, handleScale: true });
    };

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      chart.unsubscribeClick(handleChartClick);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      cancelAnimationFrame(rafId);
      chart.remove();
      chartRef.current   = null;
      seriesRef.current  = null;
    };
  }, []);



  /* ── spawn badge when a trade resolves ─────────────────────────────── */
  const shownBadgeIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const resolved = activeTrades.filter(t => t.result && !shownBadgeIds.current.has(t.id));
    if (!resolved.length) return;
    requestAnimationFrame(() => {
      const chart  = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series) return;
      const newBadges: typeof badges = [];
      for (const trade of resolved) {
        const entY = series.priceToCoordinate(trade.entryPrice) as number | null;
        if (entY === null) continue;
        const won    = trade.result === "win";
        const profit = won ? +(trade.amount * trade.payout / 100).toFixed(2) : trade.amount;
        newBadges.push({
          id:         trade.id,
          text:       won ? `+$${profit}` : `-$${profit}`,
          color:      won ? "#22c55e" : "#ef4444",
          entryTime:  trade.entryTime,
          entryPrice: trade.entryPrice,
        });
        shownBadgeIds.current.add(trade.id);
      }
      if (newBadges.length) {
        setBadges(prev => [...prev, ...newBadges]);
        // Auto-remove after 5s
        setTimeout(() => {
          const ids = new Set(newBadges.map(b => b.id));
          setBadges(prev => prev.filter(b => !ids.has(b.id)));
        }, 5000);
      }
    });
  }, [activeTrades]);


  /* ── restore drawings on tab/tf change (from localStorage) ──────── */
  useEffect(() => {
    try {
      const store = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
      const saved = store[`${tab.id}:${tf}`] ?? drawingsStore.current[`${tab.id}:${tf}`] ?? [];
      setDrawings(saved);
    } catch {
      setDrawings(drawingsStore.current[`${tab.id}:${tf}`] ?? []);
    }
  }, [tab.id, tf]);

  /* ── load candles + snap to real price before micro-tick starts ───── */
  useEffect(() => {
    const series = seriesRef.current;
    const chart  = chartRef.current;
    if (!series || !chart) return;

    // Mark this tab+tf as the active load — any stale async op checks this ref
    const activeKey = `${tab.id}:${tf}`;
    activeKeyRef.current = activeKey;

    candles.current = []; lastPrice.current = 0; lastTime.current = 0;
    realPriceRef.current = 0;
    series.setData([]); // immediately wipe old chart so it never bleeds through
    setPrice(null);
    setLoading(true);

    const cacheKey = `xd_candles_v7:${tab.id}:${tf}`;
    const BRT_OFFSET = -3 * 3600;

    // Minimal validation: array with enough real candles (close > 0)
    const isUsable = (arr: unknown): arr is Candle[] =>
      Array.isArray(arr) && arr.length >= 5 && arr.filter((c: Candle) => c.close > 0).length >= 3;

    // ── applySource: validate, clean, format and render candle data ─────
    const applySource = (source: Candle[], realP: number | null, alreadyBRT = false) => {
      // Guard: bail if this effect is no longer the active one
      if (activeKeyRef.current !== activeKey) return;

      const adjusted = alreadyBRT
        ? source
        : source.map((c) => ({ ...c, time: (c.time + BRT_OFFSET) as UTCTimestamp }));

      // Drop corrupt candles (any OHLC ≤ 0 or high < low)
      const clean = adjusted.filter((c) => c.open > 0 && c.high > 0 && c.low > 0 && c.close > 0 && c.high >= c.low);
      if (!clean.length) return;

      const startPrice = (realP != null && realP > 0) ? realP : clean[clean.length - 1].close;

      // Patch last candle's close only if startPrice is within ±20% (sanity)
      const last = clean[clean.length - 1];
      const patchedLast = (startPrice > 0 && Math.abs(startPrice - last.close) / last.close < 0.20)
        ? { ...last, close: startPrice, high: Math.max(last.high, startPrice), low: Math.min(last.low, startPrice) }
        : last;
      const patched = [...clean.slice(0, -1), patchedLast];

      // Auto-detect price format from magnitude
      const p0 = patchedLast.close;
      series.applyOptions({ priceFormat:
        p0 >= 500 ? { type: "price" as const, precision: 2, minMove: 0.01   } :
        p0 >= 10  ? { type: "price" as const, precision: 3, minMove: 0.001  } :
        p0 >= 1   ? { type: "price" as const, precision: 4, minMove: 0.0001 } :
                    { type: "price" as const, precision: 5, minMove: 0.00001 },
      });

      candles.current = patched;
      series.setData(patched);

      const applyView = () =>
        chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, patched.length - 30), to: patched.length + 3 });
      requestAnimationFrame(() => requestAnimationFrame(applyView));
      setTimeout(applyView, 200);

      const lc = patched[patched.length - 1];
      if (lc) {
        lastPrice.current    = lc.close;
        realPriceRef.current = (realP && realP > 0) ? realP : lc.close;
        lastTime.current     = lc.time;
        setPrice(startPrice);
        onPriceChange(startPrice, lc.time);
      }
    };

    // ── buildSeed: synthetic candles for micro-tick warm-up ──────────────
    const buildSeed = (seedP: number): Candle[] => {
      const period    = TF_SEC[tf] ?? 60;
      const nowBRT    = Math.floor(Date.now() / 1000) - 3 * 3600;
      const currentCt = Math.floor(nowBRT / period) * period;
      const path: number[] = [seedP];
      for (let i = 0; i < 99; i++)
        path.unshift(+(path[0] * (1 + (Math.random() - 0.5) * 0.0006)).toFixed(5));
      return path.slice(0, 100).map((open, i) => {
        const t     = (currentCt - (99 - i) * period) as UTCTimestamp;
        const close = +(path[i + 1] ?? open).toFixed(5);
        const move  = Math.abs(close - open) + open * 0.00008;
        return { time: t, open, high: +(Math.max(open, close) + move * 0.6).toFixed(5), low: +(Math.min(open, close) - move * 0.6).toFixed(5), close };
      });
    };

    const load = async () => {
      // Yield one frame → React paints loading overlay before any data touches the chart
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      if (activeKeyRef.current !== activeKey) return;

      const base     = tab.id.replace("-OTC", "");
      const isCrypto = !!BINANCE_MAP[base];

      if (isCrypto) {
        // ── Crypto ── fetch Binance history + price in parallel ─────────────
        console.log(`[chart] loading crypto ${tab.id} tf=${tf}`);
        const [data, realP] = await Promise.all([fetchCandles(tab.id, tf), fetchPrice(tab.id)]);
        if (activeKeyRef.current !== activeKey) {
          console.log(`[chart] ${tab.id} response discarded (stale)`);
          return;
        }
        console.log(`[chart] ${tab.id} Binance responded, candles=${data?.length ?? 0}`);
        const source = isUsable(data) ? data : null;
        if (!source) { if (realP && realP > 0) realPriceRef.current = realP; setLoading(false); return; }
        const brtSource = source.map((c) => ({ ...c, time: (c.time + BRT_OFFSET) as UTCTimestamp }));
        try { localStorage.setItem(cacheKey, JSON.stringify(brtSource.slice(-500))); } catch {}
        applySource(source, realP, false);
        setLoading(false);

      } else {
        // ── Forex ── fetch price first, then history ─────────────────────────
        console.log(`[chart] loading forex ${tab.id} tf=${tf}`);
        const realP = await fetchPrice(tab.id);
        if (activeKeyRef.current !== activeKey) {
          console.log(`[chart] ${tab.id} price discarded (stale)`);
          return;
        }
        console.log(`[chart] ${tab.id} price=${realP}`);
        if (realP && realP > 0) realPriceRef.current = realP;

        // Warm up micro-tick with seed candles (stays hidden under overlay)
        applySource(buildSeed(realP ?? seedPrice(tab.id)), realP, true);

        // Fetch Deriv history — overlay stays until this resolves (or times out)
        const fallbackTimer = setTimeout(() => {
          if (activeKeyRef.current !== activeKey) return;
          console.log(`[chart] ${tab.id} Deriv timeout — showing seed candles`);
          setLoading(false);
        }, 7000);

        fetchCandles(tab.id, tf).then((data) => {
          clearTimeout(fallbackTimer);
          if (activeKeyRef.current !== activeKey) {
            console.log(`[chart] ${tab.id} history discarded (stale)`);
            return;
          }
          console.log(`[chart] ${tab.id} Deriv history candles=${data?.length ?? 0}`);
          if (isUsable(data)) {
            const brtSource = data.map((c) => ({ ...c, time: (c.time + BRT_OFFSET) as UTCTimestamp }));
            try { localStorage.setItem(cacheKey, JSON.stringify(brtSource.slice(-500))); } catch {}
            applySource(data, realPriceRef.current, false);
          }
          setLoading(false);
        }).catch(() => {
          clearTimeout(fallbackTimer);
          if (activeKeyRef.current === activeKey) {
            console.log(`[chart] ${tab.id} Deriv fetch error — showing seed candles`);
            setLoading(false);
          }
        });
      }
    };

    load();
    return () => {
      activeKeyRef.current = "";
      console.log(`[chart] cleanup ${tab.id}:${tf}`);
    };
  }, [tab.id, tf]);


  /* ── real-time price feed ─────────────────────────────────────────── */
  useEffect(() => {
    const base = tab.id.replace("-OTC", "");
    const derivSym = DERIV_SYMBOL[base];

    if (derivSym) {
      // Forex → persistent Deriv WebSocket tick subscription (real-time stream)
      let ws: WebSocket | null = null;
      let dead = false;

      // Só atualiza o preço de referência a cada 2s — evita nervosismo visual
      let lastDerivUpdate = 0;

      const connect = () => {
        if (dead) return;
        ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
        ws.onopen = () => {
          ws?.send(JSON.stringify({ ticks: derivSym, subscribe: 1 }));
        };
        ws.onmessage = (e) => {
          const d = JSON.parse(e.data);
          const q = d?.tick?.quote;
          const now = Date.now();
          if (q && q > 0 && now - lastDerivUpdate >= 2000) {
            lastDerivUpdate = now;
            realPriceRef.current = q;
          }
        };
        ws.onerror = () => ws?.close();
        ws.onclose = () => { if (!dead) setTimeout(connect, 2000); };
      };

      connect();
      return () => { dead = true; ws?.close(); };
    } else {
      // Crypto → 1s Binance polling (WebSocket not needed, already near real-time)
      const fetchReal = async () => {
        const p = await fetchPrice(tab.id);
        if (!p) return;
        realPriceRef.current = p;
      };
      fetchReal();
      const iv = setInterval(fetchReal, 1000);
      return () => clearInterval(iv);
    }
  }, [tab.id]);

  /* ── OTC signal polling — fetch active signal every 2s ──────────── */
  useEffect(() => {
    const isOTC = tab.id.includes("OTC");
    if (!isOTC) { signalRef.current = null; return; }

    let dead = false;
    const poll = async () => {
      try {
        const r = await fetch(`/api/otc-signal?assetId=${encodeURIComponent(tab.id)}`);
        if (dead) return;
        const d = await r.json();
        const s = d.signal;
        signalRef.current = (s && s.expiresAt > Date.now())
          ? { direction: s.direction, strength: s.strength }
          : null;
      } catch { /* ignore */ }
    };
    poll();
    const iv = setInterval(poll, 2000);
    return () => { dead = true; clearInterval(iv); signalRef.current = null; };
  }, [tab.id]);

  /* ── micro-tick every 100ms for fluid movement ───────────────────── */
  useEffect(() => {
    const period = TF_SEC[tf] ?? 60;

    const microTick = () => {
      const series = seriesRef.current;
      const list   = candles.current;
      if (!series || !list.length || !lastPrice.current) return;

      const current = lastPrice.current;
      const real    = realPriceRef.current || current;
      const signal  = signalRef.current;

      const isCrypto = !!BINANCE_MAP[tab.id.replace("-OTC", "")];

      let drift: number;
      let noise: number;
      if (signal) {
        // Directional drift controlled by admin signal
        const dir = signal.direction === "up" ? 1 : -1;
        drift = current * 0.000015 * dir * signal.strength;
        noise = current * (Math.random() - 0.5) * 0.000003;
      } else if (isCrypto) {
        // Crypto: polling 1s Binance — drift rápido, pouco ruído
        drift = (real - current) * 0.25;
        noise = current * (Math.random() - 0.5) * 0.000008;
      } else {
        // Forex: preço muda só a cada 2s — drift muito suave, ruído mínimo
        drift = (real - current) * 0.03;
        noise = current * (Math.random() - 0.5) * 0.000003;
      }
      // toFixed(7) avoids rounding killing sub-pip moves; priceFormat handles display
      const p = +(current + drift + noise).toFixed(7);

      setUp(p >= lastPrice.current);
      lastPrice.current = p;
      setPrice(p);

      const now  = Math.floor(Date.now() / 1000) - 3 * 3600; // BRT UTC-3
      const ct   = (Math.floor(now / period) * period) as UTCTimestamp;
      const last = list[list.length - 1];

      if (last.time === ct) {
        const u = { ...last, close: p, high: Math.max(last.high, p), low: Math.min(last.low, p) };
        list[list.length - 1] = u;
        series.update(u);
        lastTime.current = ct;
        onPriceChange(p, ct);
      } else {
        const n: Candle = { time: ct, open: last.close, high: Math.max(last.close, p), low: Math.min(last.close, p), close: p };
        list.push(n);
        series.update(n);
        lastTime.current = ct;
        onPriceChange(p, ct);
        // Persist forex candles on each new candle (crypto uses Binance OHLC)
        if (!BINANCE_MAP[tab.id.replace("-OTC", "")]) {
          try { localStorage.setItem(`xd_candles_v7:${tab.id}:${tfRef.current}`, JSON.stringify(list.slice(-500))); } catch {}
        }
      }
    };

    const iv = setInterval(microTick, 100);
    return () => clearInterval(iv);
  }, [tab.id, tf]);

  /* ── canvas mouse handlers ────────────────────────────────────────── */
  const getTime = (chart: IChartApi, x: number): number =>
    coordToTime(x, chart, candles.current) ?? lastTime.current;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool !== "freehand") return;
    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const x     = e.clientX - rect.left;
    const y     = e.clientY - rect.top;
    const time  = getTime(chart, x);
    const price = series.coordinateToPrice(y);
    if (price === null || price === undefined) return;
    isDrawingFree.current = true;
    freehandRef.current = { id: `${Date.now()}`, points: [{ time, price }] };
  };

  const handleMouseUp = () => {
    if (tool !== "freehand" || !freehandRef.current) return;
    if (freehandRef.current.points.length > 2) {
      const { id, points } = freehandRef.current;
      persistedSetDrawings((d) => [...d, { id, type: "freehand", points, color }]);
    }
    freehandRef.current = null;
    isDrawingFree.current = false;
  };

  // Hit-test: find drawing near pixel (x, y), return its id or null
  const hitTest = (x: number, y: number): string | null => {
    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return null;
    const THRESH = 8;
    let closest: string | null = null, minDist = THRESH;
    for (const d of drawingsRef.current) {
      let dist = Infinity;
      if (d.type === "hline") {
        const dy = series.priceToCoordinate(d.price) as number | null;
        if (dy !== null) dist = Math.abs(dy - y);
      }
      if (d.type === "vline") {
        const dx = chart.timeScale().timeToCoordinate(d.time as UTCTimestamp) as number | null;
        if (dx !== null) dist = Math.abs(dx - x);
      }
      if (d.type === "trend" || d.type === "rect") {
        const x1 = chart.timeScale().timeToCoordinate(d.p1.time as UTCTimestamp) as number | null;
        const y1 = series.priceToCoordinate(d.p1.price) as number | null;
        const x2 = chart.timeScale().timeToCoordinate(d.p2.time as UTCTimestamp) as number | null;
        const y2 = series.priceToCoordinate(d.p2.price) as number | null;
        if (x1 !== null && y1 !== null) dist = Math.min(dist, Math.hypot(x1 - x, y1 - y));
        if (x2 !== null && y2 !== null) dist = Math.min(dist, Math.hypot(x2 - x, y2 - y));
        // also check midpoint of line segment
        if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          dist = Math.min(dist, Math.hypot(mx - x, my - y));
        }
      }
      if (d.type === "freehand" && d.points.length > 0) {
        const fp = d.points[0];
        const fx = chart.timeScale().timeToCoordinate(fp.time as UTCTimestamp) as number | null;
        const fy = series.priceToCoordinate(fp.price) as number | null;
        if (fx !== null && fy !== null) dist = Math.hypot(fx - x, fy - y);
      }
      if (dist < minDist) { minDist = dist; closest = d.id; }
    }
    return closest;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === "freehand") return;
    if (tool === "cursor") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hitTest(x, y);
      if (hit) {
        setSelectedId(hit);
        setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, id: hit });
      } else {
        setSelectedId(null);
        setCtxMenu(null);
      }
      return;
    }
    const chart  = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    const rect   = e.currentTarget.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const y      = e.clientY - rect.top;
    const time   = getTime(chart, x);
    const price  = series.coordinateToPrice(y);
    if (price === null || price === undefined) return;
    const id = `${Date.now()}`;

    if (tool === "hline") {
      persistedSetDrawings((d) => [...d, { id, type: "hline", price, color }]);
      return;
    }
    if (tool === "vline") {
      persistedSetDrawings((d) => [...d, { id, type: "vline", time, color }]);
      return;
    }
    if (tool === "erase") {
      persistedSetDrawings((d) => {
        let closest = -1, minDist = 20;
        d.forEach((drawing, i) => {
          let dist = Infinity;
          if (drawing.type === "hline") {
            const dy = series.priceToCoordinate(drawing.price) ?? Infinity;
            dist = Math.abs(dy - y);
          }
          if (drawing.type === "vline") {
            const dx = chart.timeScale().timeToCoordinate(drawing.time as UTCTimestamp) ?? Infinity;
            dist = Math.abs(dx - x);
          }
          if (drawing.type === "trend" || drawing.type === "rect") {
            const x1 = chart.timeScale().timeToCoordinate(drawing.p1.time as UTCTimestamp) ?? 0;
            const y1 = series.priceToCoordinate(drawing.p1.price) ?? 0;
            dist = Math.hypot(x1 - x, y1 - y);
          }
          if (drawing.type === "freehand" && drawing.points.length > 0) {
            const fx = chart.timeScale().timeToCoordinate(drawing.points[0].time as UTCTimestamp) ?? 0;
            const fy = series.priceToCoordinate(drawing.points[0].price) ?? 0;
            dist = Math.hypot(fx - x, fy - y);
          }
          if (dist < minDist) { minDist = dist; closest = i; }
        });
        return closest >= 0 ? d.filter((_, i) => i !== closest) : d;
      });
      return;
    }
    // Two-point tools (trend, rect)
    if (!pendingPt.current) {
      pendingPt.current = { x, y, time, price };
    } else {
      const p1 = { time: pendingPt.current.time, price: pendingPt.current.price };
      const p2 = { time, price };
      persistedSetDrawings((d) => [...d, { id, type: tool as "trend" | "rect", p1, p2, color }]);
      pendingPt.current = null;
      previewRef.current = null;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === "cursor" || tool === "hline" || tool === "vline" || tool === "erase") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Freehand: accumulate points while mouse is held
    if (tool === "freehand") {
      if (isDrawingFree.current && freehandRef.current) {
        const chart  = chartRef.current;
        const series = seriesRef.current;
        if (chart && series) {
          const time  = getTime(chart, mx);
          const price = series.coordinateToPrice(my);
          if (price !== null && price !== undefined) {
            freehandRef.current.points.push({ time, price });
          }
        }
      }
      return;
    }

    const p1px = pendingPt.current
      ? { x: pendingPt.current.x, y: pendingPt.current.y }
      : undefined;
    previewRef.current = { type: tool, p1: p1px, mx, my };
  };

  const dec = tab.id.replace("-OTC","").match(/BTC|ETH|SOL|BNB/) ? 2
    : tab.id.replace("-OTC","").match(/JPY/) ? 3 : 5;

  const TOOLS: { id: Tool; icon: React.ReactNode; title: string }[] = [
    { id: "cursor",   icon: <MousePointer2 className="w-4 h-4" />,         title: "Cursor" },
    { id: "hline",    icon: <Minus className="w-4 h-4" />,                 title: "Linha horizontal" },
    { id: "vline",    icon: <Minus className="w-4 h-4 rotate-90" />,       title: "Linha vertical" },
    { id: "trend",    icon: <TrendingUp className="w-4 h-4" />,            title: "Linha de tendência" },
    { id: "rect",     icon: <Square className="w-4 h-4" />,                title: "Retângulo" },
    { id: "freehand", icon: <Pen className="w-4 h-4" />,                   title: "Caneta livre" },
    { id: "erase",    icon: <Eraser className="w-4 h-4" />,                title: "Apagar" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>

      {/* Top toolbar */}
      <div
        className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ height: 44, borderBottom: "1px solid rgba(255,255,255,0.08)", background: "var(--color-third)" }}
      >
        <div className="flex items-center gap-2">
          {tab.icon_url && <img src={tab.icon_url} alt={tab.name} className="w-5 h-5 object-contain" />}
          <span className="font-semibold text-white text-sm">{tab.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.08)", color: "#64748b" }}>
            {tab.type}
          </span>
        </div>
        {price !== null && (
          <span className={`font-mono font-bold text-sm ${up ? "text-green-400" : "text-red-400"}`}>
            {price.toFixed(dec)}
          </span>
        )}
        <div className="flex gap-0.5 ml-auto">
          {TIMEFRAMES.map((t) => (
            <button key={t} onClick={() => setTf(t)}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ background: tf === t ? "var(--color-primary)" : "transparent", color: tf === t ? "#fff" : "#64748b" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Drawing toolbar (left) */}
        <div
          className="flex flex-col items-center py-2 gap-1 flex-shrink-0"
          style={{ width: 40, borderRight: "1px solid rgba(255,255,255,0.08)", background: "var(--color-third)" }}
        >
          {TOOLS.map((t) => (
            <button
              key={t.id}
              title={t.title}
              onClick={() => { setTool(t.id); pendingPt.current = null; previewRef.current = null; setCtxMenu(null); setSelectedId(null); }}
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{
                background: tool === t.id ? "rgba(249,115,22,0.2)" : "transparent",
                color:      tool === t.id ? "var(--color-primary)" : "#64748b",
                border:     tool === t.id ? "1px solid rgba(249,115,22,0.4)" : "1px solid transparent",
              }}
            >
              {t.icon}
            </button>
          ))}

          {/* Divider */}
          <div className="w-6 border-t my-1" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

          {/* Color palette */}
          {COLORS.map((c) => (
            <button
              key={c}
              title={c}
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110"
              style={{
                background: c,
                outline: color === c ? `2px solid ${c}` : "none",
                outlineOffset: 2,
              }}
            />
          ))}

          {/* Divider */}
          <div className="w-6 border-t my-1" style={{ borderColor: "rgba(255,255,255,0.08)" }} />

          {/* Clear all */}
          <button
            title="Limpar tudo"
            onClick={() => { persistedSetDrawings([]); pendingPt.current = null; previewRef.current = null; }}
            className="w-8 h-8 flex items-center justify-center rounded transition-colors"
            style={{ color: "#64748b" }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Chart + canvas overlay */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden" }}>
          {/* Zoom controls — horizontal, centered bottom */}
          <div style={{ position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)", zIndex: 5, display: "flex", flexDirection: "row", gap: 4 }}>
            {[
              { icon: <ZoomIn className="w-3.5 h-3.5" />, title: "Zoom in", action: () => {
                const c = chartRef.current; if (!c) return;
                const r = c.timeScale().getVisibleLogicalRange();
                if (!r) return;
                const mid = (r.from + r.to) / 2, half = (r.to - r.from) / 2 * 0.7;
                c.timeScale().setVisibleLogicalRange({ from: mid - half, to: mid + half });
              }},
              { icon: <ZoomOut className="w-3.5 h-3.5" />, title: "Zoom out", action: () => {
                const c = chartRef.current; if (!c) return;
                const r = c.timeScale().getVisibleLogicalRange();
                if (!r) return;
                const mid = (r.from + r.to) / 2, half = (r.to - r.from) / 2 * 1.4;
                c.timeScale().setVisibleLogicalRange({ from: mid - half, to: mid + half });
              }},
              { icon: <Crosshair className="w-3.5 h-3.5" />, title: "Centralizar", action: () => {
                const c = chartRef.current; if (!c) return;
                const total = candles.current.length;
                if (!total) return;
                c.timeScale().setVisibleLogicalRange({ from: Math.max(0, total - 150), to: total - 1 + 20 });
              }},
            ].map(({ icon, title, action }) => (
              <button key={title} title={title} onClick={action}
                className="w-7 h-7 flex items-center justify-center rounded transition-colors"
                style={{ background: "rgba(15,20,35,0.85)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}
              >{icon}</button>
            ))}
          </div>
          {/* wrapRef fills parent — autoSize ResizeObserver watches this element */}
          <div ref={wrapRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />

          {/* Loading overlay */}
          {loading && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              background: "#111622",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            }}>
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ animation: "zyro-spin 1s linear infinite" }}>
                <circle cx="20" cy="20" r="20" fill="#f97316" />
                <path d="M11 12h18l-14 16h14" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: "monospace" }}>carregando...</span>
              <style>{`@keyframes zyro-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {/* Drawing canvas sits on top */}
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}
          />
          {/* Result badges — positions recalculated every render so they follow zoom/pan */}
          {badges.map(b => {
            const chart  = chartRef.current;
            const series = seriesRef.current;
            if (!chart || !series) return null;
            const bx = chart.timeScale().timeToCoordinate(b.entryTime as UTCTimestamp) as number | null;
            const by = series.priceToCoordinate(b.entryPrice) as number | null;
            if (bx === null || by === null) return null;
            return (
              <div key={b.id} onClick={() => setBadges(prev => prev.filter(x => x.id !== b.id))}
                style={{
                  position: "absolute", zIndex: 8, cursor: "pointer",
                  left: bx, top: by,
                  transform: "translate(-50%, -50%)",
                  background: b.color,
                  borderRadius: 10, padding: "8px 20px",
                  color: "#fff", fontWeight: "bold", fontSize: 22,
                  fontFamily: "monospace", whiteSpace: "nowrap",
                  userSelect: "none",
                  animation: "fadeInPop 0.25s ease",
                }}
              >{b.text}</div>
            );
          })}
          <style>{`@keyframes fadeInPop { from { opacity:0; transform:translate(-50%,-50%) scale(0.7); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>

          {/* Drawing overlay — only active when not in cursor mode so pan/zoom works */}
          {tool !== "cursor" && (
            <div
              style={{ position: "absolute", inset: 0, cursor: tool === "erase" ? "cell" : "crosshair", zIndex: 3 }}
              onClick={handleCanvasClick}
              onMouseMove={handleCanvasMouseMove}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            />
          )}
          {/* Context menu on selected drawing */}
          {ctxMenu && (
            <div
              style={{
                position: "absolute",
                left: ctxMenu.x + 8,
                top: ctxMenu.y - 16,
                zIndex: 10,
                background: "#1e2535",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "6px 8px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              {/* Color swatches */}
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    persistedSetDrawings((d) => d.map((dr) => dr.id === ctxMenu.id ? { ...dr, color: c } : dr));
                    setCtxMenu(null); setSelectedId(null);
                  }}
                  style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: selectedId && drawings.find(d => d.id === ctxMenu.id)?.color === c ? "2px solid white" : "2px solid transparent", cursor: "pointer" }}
                />
              ))}
              <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)" }} />
              {/* Delete */}
              <button
                onClick={() => {
                  persistedSetDrawings((d) => d.filter((dr) => dr.id !== ctxMenu.id));
                  setCtxMenu(null); setSelectedId(null);
                }}
                style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
                title="Apagar"
              >
                <Trash2 style={{ width: 14, height: 14 }} />
              </button>
              {/* Close */}
              <button
                onClick={() => { setCtxMenu(null); setSelectedId(null); }}
                style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 14, lineHeight: 1 }}
              >✕</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
