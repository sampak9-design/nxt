import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const row = db.prepare("SELECT kyc_status FROM users WHERE id = ?").get(payload.userId) as any;
  const doc = db.prepare("SELECT * FROM kyc_documents WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1").get(payload.userId) as any;

  return NextResponse.json({ status: row?.kyc_status ?? "none", doc: doc ?? null });
}
