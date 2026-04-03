import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signToken, COOKIE, MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { first_name, last_name, email, phone, password } = await req.json();

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ detail: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ detail: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json({ detail: "Este e-mail já está cadastrado." }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      "INSERT INTO users (first_name, last_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?)"
    ).run(first_name, last_name, email, phone ?? null, password_hash);

    const token = await signToken({ userId: result.lastInsertRowid as number, email });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, token, { httpOnly: true, maxAge: MAX_AGE, path: "/", sameSite: "lax" });
    return res;
  } catch (e) {
    console.error("register error", e);
    return NextResponse.json({ detail: "Erro interno." }, { status: 500 });
  }
}
