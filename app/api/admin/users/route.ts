import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    // ensure column exists
    try { db.exec(`ALTER TABLE users ADD COLUMN is_marketing INTEGER NOT NULL DEFAULT 0`); } catch {}

    const users = db.prepare(
      `SELECT id, first_name, last_name, email, real_balance, demo_balance,
              COALESCE(is_marketing, 0) as is_marketing,
              COALESCE(is_blocked, 0) as is_blocked, created_at
       FROM users ORDER BY created_at DESC`
    ).all();
    return NextResponse.json({ users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, users: [] }, { status: 500 });
  }
}
