import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, COOKIE } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Check if already approved
  const user = db.prepare("SELECT kyc_status FROM users WHERE id = ?").get(payload.userId) as any;
  if (user?.kyc_status === "approved") {
    return NextResponse.json({ error: "Documentos já aprovados." }, { status: 400 });
  }

  const formData = await req.formData();
  const fullName = (formData.get("full_name") as string)?.trim();
  const cpf      = (formData.get("cpf") as string)?.trim();
  const front    = formData.get("doc_front") as File | null;
  const back     = formData.get("doc_back")  as File | null;

  if (!fullName || !cpf || !front || !back) {
    return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "kyc");
  await mkdir(uploadDir, { recursive: true });

  const ts = Date.now();
  const frontExt = front.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const backExt  = back.name.split(".").pop()?.toLowerCase()  ?? "jpg";
  const frontName = `${payload.userId}_${ts}_front.${frontExt}`;
  const backName  = `${payload.userId}_${ts}_back.${backExt}`;

  await writeFile(path.join(uploadDir, frontName), Buffer.from(await front.arrayBuffer()));
  await writeFile(path.join(uploadDir, backName),  Buffer.from(await back.arrayBuffer()));

  db.prepare(`
    INSERT INTO kyc_documents (user_id, full_name, cpf, doc_front_path, doc_back_path, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(payload.userId, fullName, cpf, `/uploads/kyc/${frontName}`, `/uploads/kyc/${backName}`, ts);

  db.prepare("UPDATE users SET kyc_status = 'pending' WHERE id = ?").run(payload.userId);

  return NextResponse.json({ ok: true });
}
