/**
 * Auto-downloads OTC history on server boot if the DB is missing data.
 * Runs once, asynchronously, in the background — server keeps responding
 * normally; OTC pairs become available as each pair finishes downloading.
 */

import db from "@/lib/db";

const PAIRS: { asset: string; deriv: string }[] = [
  { asset: "AUDCAD", deriv: "frxAUDCAD" },
  { asset: "AUDCHF", deriv: "frxAUDCHF" },
  { asset: "AUDJPY", deriv: "frxAUDJPY" },
  { asset: "AUDNZD", deriv: "frxAUDNZD" },
  { asset: "EURAUD", deriv: "frxEURAUD" },
  { asset: "EURCHF", deriv: "frxEURCHF" },
  { asset: "EURGBP", deriv: "frxEURGBP" },
  { asset: "EURJPY", deriv: "frxEURJPY" },
  { asset: "EURUSD", deriv: "frxEURUSD" },
  { asset: "GBPCHF", deriv: "frxGBPCHF" },
  { asset: "GBPJPY", deriv: "frxGBPJPY" },
  { asset: "GBPNZD", deriv: "frxGBPNZD" },
];

const MIN_CANDLES = 50_000; // ~35 days; below this we re-download

let started = false;

export function ensureOtcHistory() {
  if (started) return;
  started = true;

  // Defer so server boot completes first
  setTimeout(() => { runDownloads().catch((e) => console.error("[otc-auto] fatal:", e)); }, 5000);
}

async function runDownloads() {
  // Check which pairs need downloading
  const needed: typeof PAIRS = [];
  for (const p of PAIRS) {
    const row = db.prepare("SELECT COUNT(*) AS n FROM otc_history WHERE asset = ?").get(p.asset) as { n: number };
    if (row.n < MIN_CANDLES) needed.push(p);
  }

  if (needed.length === 0) {
    console.log("[otc-auto] DB has all 12 pairs, skipping download");
    return;
  }

  console.log(`[otc-auto] Need to download ${needed.length} pairs:`, needed.map((p) => p.asset).join(", "));

  // Lazy import ws to avoid client bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WebSocket = require("ws");

  function derivCall<T>(msg: object): Promise<T> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
      const timer = setTimeout(() => { ws.close(); reject(new Error("timeout")); }, 30_000);
      ws.on("open", () => ws.send(JSON.stringify(msg)));
      ws.on("message", (data: any) => {
        clearTimeout(timer);
        ws.close();
        const d = JSON.parse(data.toString());
        if (d.error) reject(new Error(d.error.message));
        else resolve(d as T);
      });
      ws.on("error", () => { clearTimeout(timer); reject(new Error("ws error")); });
    });
  }

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO otc_history (asset, minute_idx, open, high, low, close)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((rows: any[]) => {
    for (const r of rows) insertStmt.run(r.asset, r.idx, r.o, r.h, r.l, r.c);
  });

  for (const { asset, deriv } of needed) {
    console.log(`[otc-auto] 📥 ${asset}`);
    type C = { epoch: number; open: number; high: number; low: number; close: number };
    const all: C[] = [];
    const seen = new Set<number>();
    let cursor = Math.floor(Date.now() / 1000);
    let consecutiveErrors = 0;
    let chunks = 0;

    while (chunks < 200 && consecutiveErrors < 8) {
      try {
        const data: any = await derivCall({
          ticks_history: deriv,
          style:         "candles",
          granularity:   60,
          end:           cursor,
          count:         5000,
        });
        consecutiveErrors = 0;
        const cs: C[] = data?.candles ?? [];
        if (!cs.length) break;
        const novos = cs.filter((c) => !seen.has(c.epoch));
        if (!novos.length) break;
        for (const c of novos) { seen.add(c.epoch); all.push(c); }
        cursor = cs[0].epoch - 60;
        chunks++;
        await new Promise((r) => setTimeout(r, 300));
      } catch (e: any) {
        consecutiveErrors++;
        console.log(`[otc-auto]   ⚠️  ${asset} err ${consecutiveErrors}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 4000 * consecutiveErrors));
      }
    }

    if (!all.length) {
      console.log(`[otc-auto]   ❌ ${asset}: no data`);
      continue;
    }

    all.sort((a, b) => a.epoch - b.epoch);
    db.prepare("DELETE FROM otc_history WHERE asset = ?").run(asset);
    insertMany(all.map((c, idx) => ({ asset, idx, o: c.open, h: c.high, l: c.low, c: c.close })));
    console.log(`[otc-auto]   ✅ ${asset}: ${all.length} candles`);
  }

  console.log("[otc-auto] all done");
}
