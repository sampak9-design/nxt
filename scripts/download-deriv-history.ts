/**
 * Downloads as many M1 candles as Deriv will give us for the 21 OTC forex
 * pairs by paginating BACKWARD from "now" until the API stops returning new
 * data. The deepest available history is used as the playback loop.
 *
 * Run with:  npx tsx scripts/download-deriv-history.ts
 *
 * Re-running is safe (INSERT OR REPLACE).
 */

import db from "@/lib/db";
import WebSocket from "ws";

const PAIRS: { asset: string; deriv: string }[] = [
  { asset: "AUDCAD", deriv: "frxAUDCAD" },
  { asset: "AUDCHF", deriv: "frxAUDCHF" },
  { asset: "AUDJPY", deriv: "frxAUDJPY" },
  { asset: "AUDNZD", deriv: "frxAUDNZD" },
  { asset: "CADCHF", deriv: "frxCADCHF" },
  { asset: "EURAUD", deriv: "frxEURAUD" },
  { asset: "EURCHF", deriv: "frxEURCHF" },
  { asset: "EURGBP", deriv: "frxEURGBP" },
  { asset: "EURJPY", deriv: "frxEURJPY" },
  { asset: "EURUSD", deriv: "frxEURUSD" },
  { asset: "GBPCHF", deriv: "frxGBPCHF" },
  { asset: "GBPJPY", deriv: "frxGBPJPY" },
  { asset: "GBPNZD", deriv: "frxGBPNZD" },
  { asset: "GBPUSD", deriv: "frxGBPUSD" },
  { asset: "NZDCAD", deriv: "frxNZDCAD" },
  { asset: "NZDCHF", deriv: "frxNZDCHF" },
  { asset: "NZDJPY", deriv: "frxNZDJPY" },
  { asset: "NZDUSD", deriv: "frxNZDUSD" },
  { asset: "USDCAD", deriv: "frxUSDCAD" },
  { asset: "USDCHF", deriv: "frxUSDCHF" },
  { asset: "USDJPY", deriv: "frxUSDJPY" },
];

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
const insertMany = db.transaction((rows: Array<{ asset: string; idx: number; o: number; h: number; l: number; c: number }>) => {
  for (const r of rows) insertStmt.run(r.asset, r.idx, r.o, r.h, r.l, r.c);
});

async function downloadPair(asset: string, deriv: string) {
  console.log(`\n📥 ${asset} (${deriv})...`);

  // If already has plenty of data, skip
  const existing = db.prepare("SELECT COUNT(*) AS n FROM otc_history WHERE asset = ?").get(asset) as { n: number };
  if (existing.n >= 100000) {
    console.log(`  ⏭️  already has ${existing.n} candles, skipping`);
    return;
  }

  type C = { epoch: number; open: number; high: number; low: number; close: number };
  const allCandles: C[] = [];
  const seenEpochs = new Set<number>();
  let endCursor = Math.floor(Date.now() / 1000);
  let chunks = 0;
  let stagnant = 0;
  let consecutiveErrors = 0;

  while (chunks < 200 && stagnant < 3 && consecutiveErrors < 5) {
    try {
      const data: any = await derivCall({
        ticks_history: deriv,
        style:         "candles",
        granularity:   60,
        end:           endCursor,
        count:         5000,
      });
      consecutiveErrors = 0;
      const candles: C[] = data?.candles ?? [];
      if (!candles.length) { console.log(`\n  empty response, stopping`); break; }
      const newOnes = candles.filter((c) => !seenEpochs.has(c.epoch));
      if (newOnes.length === 0) {
        stagnant++;
        endCursor = (candles[0]?.epoch ?? endCursor) - 60;
        continue;
      }
      stagnant = 0;
      for (const c of newOnes) { seenEpochs.add(c.epoch); allCandles.push(c); }
      chunks++;
      const oldest = candles[0].epoch;
      const newest = candles[candles.length - 1].epoch;
      process.stdout.write(`  chunk ${chunks}: ${new Date(oldest * 1000).toISOString().slice(0, 16)} → ${new Date(newest * 1000).toISOString().slice(0, 16)} (${allCandles.length} total)\r`);
      endCursor = oldest - 60;
      // Throttle to avoid rate limit
      await new Promise((r) => setTimeout(r, 250));
    } catch (e: any) {
      consecutiveErrors++;
      console.log(`\n  ⚠️  error ${consecutiveErrors}/5: ${e.message}`);
      // Back off
      await new Promise((r) => setTimeout(r, 3000 * consecutiveErrors));
    }
  }

  if (!allCandles.length) {
    console.log(`\n  ⚠️  no data`);
    return;
  }

  // Sort ascending by epoch and assign sequential minute_idx (0..N-1)
  allCandles.sort((a, b) => a.epoch - b.epoch);
  const rows = allCandles.map((c, i) => ({
    asset, idx: i, o: c.open, h: c.high, l: c.low, c: c.close,
  }));

  // Wipe previous data for this asset before bulk insert
  db.prepare("DELETE FROM otc_history WHERE asset = ?").run(asset);
  insertMany(rows);

  const hours = Math.floor(allCandles.length / 60);
  console.log(`\n  ✅ ${asset}: ${allCandles.length} candles (${hours}h of data)`);
}

(async () => {
  for (const p of PAIRS) {
    await downloadPair(p.asset, p.deriv);
  }

  console.log("\n📊 Final stats:");
  const stats = db.prepare("SELECT asset, COUNT(*) as candles, MAX(minute_idx) - MIN(minute_idx) + 1 as span FROM otc_history GROUP BY asset").all();
  console.table(stats);
  process.exit(0);
})();
