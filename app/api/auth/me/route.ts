import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ user: null });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  const user = db.prepare("SELECT id, first_name, last_name, email, demo_balance, real_balance, avatar_url, is_marketing FROM users WHERE id = ?").get(payload.userId) as any;
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user });
}
