import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";
import { verifyToken, COOKIE } from "@/lib/auth";

const DATA_DIR = process.env.DB_DIR ?? path.join(process.cwd(), "data");
const AVATAR_DIR = path.join(DATA_DIR, "avatars");

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return NextResponse.json({ detail: "Não autorizado." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return NextResponse.json({ detail: "Arquivo não enviado." }, { status: 400 });

  // Only allow images
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ detail: "Apenas imagens são permitidas." }, { status: 400 });
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ detail: "Imagem muito grande. Máximo 5MB." }, { status: 400 });
  }

  fs.mkdirSync(AVATAR_DIR, { recursive: true });

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const filename = `${payload.userId}.${ext}`;
  const filepath = path.join(AVATAR_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  const avatarUrl = `/api/user/avatar/${payload.userId}`;
  db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatarUrl, payload.userId);

  return NextResponse.json({ avatar_url: avatarUrl });
}

export async function GET(req: NextRequest) {
  // Serve avatar file for /api/user/avatar (own user)
  const token = req.cookies.get(COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return new NextResponse(null, { status: 401 });

  return serveAvatar(payload.userId);
}

function serveAvatar(userId: number) {
  const DATA_DIR2 = process.env.DB_DIR ?? path.join(process.cwd(), "data");
  const dir = path.join(DATA_DIR2, "avatars");
  for (const ext of ["jpg", "png", "webp", "gif"]) {
    const fp = path.join(dir, `${userId}.${ext}`);
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      return new NextResponse(buf, { headers: { "Content-Type": `image/${ext === "jpg" ? "jpeg" : ext}`, "Cache-Control": "no-cache" } });
    }
  }
  return new NextResponse(null, { status: 404 });
}
