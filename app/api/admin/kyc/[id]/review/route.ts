import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { action, note } = await req.json();
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const doc = db.prepare("SELECT * FROM kyc_documents WHERE id = ?").get(Number(id)) as any;
  if (!doc) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const status = action === "approve" ? "approved" : "rejected";
  db.prepare("UPDATE kyc_documents SET status = ?, rejection_note = ?, reviewed_at = ? WHERE id = ?")
    .run(status, note ?? null, Date.now(), Number(id));
  db.prepare("UPDATE users SET kyc_status = ? WHERE id = ?").run(status, doc.user_id);

  return NextResponse.json({ ok: true });
}
