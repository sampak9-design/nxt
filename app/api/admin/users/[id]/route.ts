import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json();

  if (body.is_marketing !== undefined) {
    db.prepare("UPDATE users SET is_marketing = ? WHERE id = ?").run(body.is_marketing ? 1 : 0, id);
  }
  if (body.real_balance !== undefined) {
    db.prepare("UPDATE users SET real_balance = ? WHERE id = ?").run(Number(body.real_balance), id);
  }

  const user = db.prepare(
    `SELECT id, first_name, last_name, email, real_balance, demo_balance, is_marketing, created_at FROM users WHERE id = ?`
  ).get(id);
  return NextResponse.json({ user });
}
