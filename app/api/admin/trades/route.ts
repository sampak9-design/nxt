import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const trades = db.prepare(`
    SELECT t.*, u.first_name || ' ' || u.last_name AS user_name
    FROM trades t
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.started_at DESC
    LIMIT 500
  `).all();
  return NextResponse.json({ trades });
}
