import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, COOKIE } from "@/lib/auth";

async function getUser(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/trades?account=practice&limit=50
export async function GET(req: NextRequest) {
  const payload = await getUser(req);
  if (!payload) return NextResponse.json({ detail: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const account = searchParams.get("account"); // "practice" | "real" | null (all)
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);

  const rows = account
    ? db.prepare("SELECT *, COALESCE(is_copy, 0) as is_copy FROM trades WHERE user_id = ? AND account_type = ? ORDER BY started_at DESC LIMIT ?").all(payload.userId, account, limit)
    : db.prepare("SELECT *, COALESCE(is_copy, 0) as is_copy FROM trades WHERE user_id = ? ORDER BY started_at DESC LIMIT ?").all(payload.userId, limit);

  return NextResponse.json({ trades: rows });
}

// POST /api/trades  — save one resolved trade
export async function POST(req: NextRequest) {
  const payload = await getUser(req);
  if (!payload) return NextResponse.json({ detail: "Não autorizado." }, { status: 401 });

  const body = await req.json();
  const { id, account_type, asset_id, asset_name, direction, amount, payout,
          entry_price, exit_price, result, net_profit, started_at, resolved_at, expires_at } = body;

  if (!id || !account_type || !asset_id || !direction || !result) {
    return NextResponse.json({ detail: "Dados incompletos." }, { status: 400 });
  }

  // Check if trade already exists (copy trades are pre-inserted)
  const existing = db.prepare("SELECT id, result FROM trades WHERE id = ?").get(id) as any;

  if (existing) {
    // Update existing trade with resolution data (copy trade resolving)
    if (!existing.result && result) {
      db.prepare("UPDATE trades SET exit_price = ?, result = ?, net_profit = ?, resolved_at = ? WHERE id = ?")
        .run(exit_price ?? null, result, net_profit ?? null, resolved_at ?? null, id);
      // Update balance for copy trade resolution
      if (account_type === "real" && net_profit != null) {
        const gain = result === "win" ? amount + net_profit : 0;
        if (gain > 0) db.prepare("UPDATE users SET real_balance = real_balance + ? WHERE id = ?").run(gain, payload.userId);
      }
    }
  } else {
    // Insert new trade
    db.prepare(`
      INSERT INTO trades
        (id, user_id, account_type, asset_id, asset_name, direction, amount, payout,
         entry_price, exit_price, result, net_profit, started_at, resolved_at, expires_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, payload.userId, account_type, asset_id, asset_name, direction,
           amount, payout, entry_price, exit_price ?? null, result, net_profit ?? null,
           started_at, resolved_at ?? null, expires_at);
    // Update user balance
    if (account_type === "practice") {
      db.prepare("UPDATE users SET demo_balance = demo_balance + ? WHERE id = ?").run(net_profit ?? 0, payload.userId);
    } else {
      db.prepare("UPDATE users SET real_balance = real_balance + ? WHERE id = ?").run(net_profit ?? 0, payload.userId);
    }
  }

  return NextResponse.json({ ok: true });
}
