import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const users = db.prepare(
    `SELECT id, first_name, last_name, email, real_balance, demo_balance, is_marketing, created_at
     FROM users ORDER BY created_at DESC`
  ).all();
  return NextResponse.json({ users });
}
