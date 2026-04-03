import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signToken, COOKIE, MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username_or_email, password } = await req.json();

    if (!username_or_email || !password) {
      return NextResponse.json({ detail: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(username_or_email) as any;
    if (!user) {
      return NextResponse.json({ detail: "Credenciais inválidas." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ detail: "Credenciais inválidas." }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, first_name: user.first_name });
    res.cookies.set(COOKIE, token, { httpOnly: true, maxAge: MAX_AGE, path: "/", sameSite: "lax" });
    return res;
  } catch (e) {
    console.error("login error", e);
    return NextResponse.json({ detail: "Erro interno." }, { status: 500 });
  }
}
