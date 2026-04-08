/**
 * Composes base + delta into the final candles the user sees.
 */

import db from "@/lib/db";
import type { Candle } from "./base-feed";

type Row = {
  time: number;
  bo: number; bh: number; bl: number; bc: number;
  do_: number; dh: number; dl: number; dc: number;
};

export function composeCandles(asset: string, count = 500): Candle[] {
  try {
    const rows = db.prepare(`
      SELECT b.time AS time,
             b.open AS bo, b.high AS bh, b.low AS bl, b.close AS bc,
             COALESCE(d.open, 0)  AS do_,
             COALESCE(d.high, 0)  AS dh,
             COALESCE(d.low, 0)   AS dl,
             COALESCE(d.close, 0) AS dc
      FROM otc_base b
      LEFT JOIN otc_delta d ON d.asset = b.asset AND d.time = b.time
      WHERE b.asset = ?
      ORDER BY b.time DESC
      LIMIT ?
    `).all(asset, count) as Row[];

    return rows.reverse().map((r): Candle => ({
      time:  r.time,
      open:  r.bo + r.do_,
      high:  r.bh + r.dh,
      low:   r.bl + r.dl,
      close: r.bc + r.dc,
    }));
  } catch { return []; }
}
