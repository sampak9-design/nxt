import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    try { db.exec(`ALTER TABLE users ADD COLUMN is_marketing INTEGER NOT NULL DEFAULT 0`); } catch {}

    const users = db.prepare(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.real_balance, u.demo_balance,
             COALESCE(u.is_marketing, 0) as is_marketing, u.created_at,
             (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND result = 'win') as wins,
             (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND result = 'lose') as loses,
             (SELECT COUNT(*) FROM trades WHERE user_id = u.id) as total_trades
      FROM users u ORDER BY u.created_at DESC
    `).all();
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, users: [] }, { status: 500 });
  }
}
