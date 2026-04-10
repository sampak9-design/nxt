import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const withdrawals = db.prepare(`
    SELECT w.*, u.first_name || ' ' || u.last_name AS user_name, u.email
    FROM withdrawals w
    LEFT JOIN users u ON u.id = w.user_id
    ORDER BY w.created_at DESC
    LIMIT 500
  `).all();
  return NextResponse.json({ withdrawals });
}

export async function POST(req: NextRequest) {
  const { id, action } = await req.json();
  if (!id || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const w = db.prepare("SELECT * FROM withdrawals WHERE id = ?").get(id) as any;
  if (!w) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (w.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  db.prepare("UPDATE withdrawals SET status = ?, reviewed_at = ? WHERE id = ?")
    .run(action, Date.now(), id);

  // If rejected, refund the amount back to user
  if (action === "rejected") {
    db.prepare("UPDATE users SET real_balance = real_balance + ? WHERE id = ?")
      .run(w.amount, w.user_id);
  }

  return NextResponse.json({ ok: true });
}
