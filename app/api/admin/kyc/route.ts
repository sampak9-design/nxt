import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const rows = db.prepare(`
    SELECT k.*, u.first_name, u.last_name, u.email
    FROM kyc_documents k
    JOIN users u ON u.id = k.user_id
    ORDER BY k.submitted_at DESC
  `).all();
  return NextResponse.json({ docs: rows });
}
