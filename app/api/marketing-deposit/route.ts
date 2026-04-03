import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const user = db.prepare("SELECT id, is_marketing FROM users WHERE id = ?").get(payload.userId) as any;
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (!user.is_marketing) return NextResponse.json({ error: "Conta não autorizada para depósito direto" }, { status: 403 });

  const { amount } = await req.json();
  const num = parseFloat(amount);
  if (!num || num <= 0) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });

  db.prepare("UPDATE users SET real_balance = real_balance + ? WHERE id = ?").run(num, user.id);
  const updated = db.prepare("SELECT real_balance FROM users WHERE id = ?").get(user.id) as any;

  return NextResponse.json({ real_balance: updated.real_balance });
}
