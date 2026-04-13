import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { signToken, verifyToken, COOKIE, MAX_AGE } from "@/lib/auth";

const ADMIN_COOKIE = "zyro_admin";

// POST /api/admin/auth — login admin
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const isAdmin = user.is_admin === 1;
    if (!isAdmin) {
      return NextResponse.json({ error: "Sem permissão de administrador." }, { status: 403 });
    }

    const token = await signToken({ userId: user.id, email: user.email });
    const res = NextResponse.json({ ok: true, name: `${user.first_name} ${user.last_name}` });
    res.cookies.set(ADMIN_COOKIE, token, { httpOnly: true, maxAge: MAX_AGE, path: "/", sameSite: "lax" });
    return res;
  } catch (e) {
    console.error("admin login error", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// GET /api/admin/auth — check admin session
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ admin: false }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ admin: false }, { status: 401 });

  const user = db.prepare("SELECT id, first_name, last_name, email, COALESCE(is_admin, 0) as is_admin FROM users WHERE id = ?").get(payload.userId) as any;
  if (!user || !user.is_admin) return NextResponse.json({ admin: false }, { status: 401 });

  return NextResponse.json({ admin: true, user: { id: user.id, name: `${user.first_name} ${user.last_name}`, email: user.email } });
}

// DELETE /api/admin/auth — logout admin
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
