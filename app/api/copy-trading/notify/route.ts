import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";
import db from "@/lib/db";

// POST /api/copy-trading/notify — called when a trader opens a trade
// Creates active (unresolved) trades for all followers, same expiry
export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const traderId = payload.userId;
  const body = await req.json();
  const { asset_id, asset_name, direction, entry_price, expires_at, payout } = body;

  // Find rooms where this user is the trader
  const rooms = db.prepare(
    "SELECT id, max_pct FROM copy_rooms WHERE trader_id = ? AND is_active = 1"
  ).all(traderId) as { id: number; max_pct: number }[];

  if (rooms.length === 0) return NextResponse.json({ copied: 0 });

  let copied = 0;
  const now = Date.now();

  for (const room of rooms) {
    const followers = db.prepare(
      "SELECT cf.user_id, u.real_balance FROM copy_followers cf JOIN users u ON u.id = cf.user_id WHERE cf.room_id = ? AND cf.status = 'active'"
    ).all(room.id) as { user_id: number; real_balance: number }[];

    for (const f of followers) {
      const copyAmount = Math.min(
        +(f.real_balance * (room.max_pct / 100)).toFixed(2),
        f.real_balance
      );
      if (copyAmount < 1) continue;

      const tradeId = `copy-${now}-${f.user_id}-${Math.random().toString(36).slice(2, 6)}`;

      // Insert as ACTIVE trade (no result yet, no exit_price, no resolved_at)
      db.prepare(`
        INSERT OR IGNORE INTO trades
          (id, user_id, account_type, asset_id, asset_name, direction, amount, payout,
           entry_price, exit_price, result, net_profit, started_at, resolved_at, expires_at, is_copy)
        VALUES (?,?,'real',?,?,?,?,?,?,NULL,NULL,NULL,?,NULL,?,1)
      `).run(tradeId, f.user_id, asset_id, asset_name, direction, copyAmount, payout,
             entry_price, now, expires_at);

      // Deduct balance
      db.prepare("UPDATE users SET real_balance = real_balance - ? WHERE id = ? AND real_balance >= ?")
        .run(copyAmount, f.user_id, copyAmount);

      copied++;
    }
  }

  return NextResponse.json({ copied });
}
