import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/admin/deposits — list all deposits
export async function GET() {
  const deposits = db.prepare(`
    SELECT d.*, u.first_name || ' ' || u.last_name AS user_name, u.email
    FROM deposits d
    LEFT JOIN users u ON u.id = d.user_id
    ORDER BY d.created_at DESC
    LIMIT 500
  `).all();
  return NextResponse.json({ deposits });
}

// POST /api/admin/deposits — approve/reject a deposit
export async function POST(req: NextRequest) {
  const { id, action } = await req.json();
  if (!id || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const deposit = db.prepare("SELECT * FROM deposits WHERE id = ?").get(id) as any;
  if (!deposit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (deposit.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  db.prepare("UPDATE deposits SET status = ?, reviewed_at = ? WHERE id = ?")
    .run(action, Date.now(), id);

  // If approved, add to user balance
  if (action === "approved") {
    db.prepare("UPDATE users SET real_balance = real_balance + ? WHERE id = ?")
      .run(deposit.amount, deposit.user_id);
  }

  return NextResponse.json({ ok: true });
}
