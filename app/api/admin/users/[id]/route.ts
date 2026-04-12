import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();

  if (body.is_marketing !== undefined) {
    db.prepare("UPDATE users SET is_marketing = ? WHERE id = ?").run(body.is_marketing ? 1 : 0, id);
  }
  if (body.real_balance !== undefined) {
    db.prepare("UPDATE users SET real_balance = ? WHERE id = ?").run(Number(body.real_balance), id);
  }
  if (body.is_admin !== undefined) {
    db.prepare("UPDATE users SET is_admin = ? WHERE id = ?").run(body.is_admin ? 1 : 0, id);
  }
  if (body.is_blocked !== undefined) {
    db.prepare("UPDATE users SET is_blocked = ? WHERE id = ?").run(body.is_blocked ? 1 : 0, id);
  }

  const user = db.prepare(
    `SELECT id, first_name, last_name, email, real_balance, demo_balance,
            COALESCE(is_marketing, 0) as is_marketing,
            COALESCE(is_blocked, 0) as is_blocked,
            COALESCE(is_admin, 0) as is_admin, created_at
     FROM users WHERE id = ?`
  ).get(id);
  return NextResponse.json({ user });
}
