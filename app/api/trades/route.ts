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
    ? db.prepare("SELECT * FROM trades WHERE user_id = ? AND account_type = ? ORDER BY resolved_at DESC LIMIT ?").all(payload.userId, account, limit)
    : db.prepare("SELECT * FROM trades WHERE user_id = ? ORDER BY resolved_at DESC LIMIT ?").all(payload.userId, limit);

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

  // Upsert — ignore if already saved (duplicate resolution calls)
  db.prepare(`
    INSERT OR IGNORE INTO trades
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

  return NextResponse.json({ ok: true });
}
