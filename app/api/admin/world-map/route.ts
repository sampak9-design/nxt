import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import db from "@/lib/db";

const DATA_DIR = process.env.DB_DIR ?? path.join(process.cwd(), "data");
const MAP_DIR  = path.join(DATA_DIR, "world-map");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ detail: "Arquivo não enviado." }, { status: 400 });
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ detail: "Apenas imagens são permitidas." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ detail: "Imagem muito grande. Máximo 10MB." }, { status: 400 });
  }

  fs.mkdirSync(MAP_DIR, { recursive: true });
  // remove old files
  for (const f of fs.readdirSync(MAP_DIR)) {
    try { fs.unlinkSync(path.join(MAP_DIR, f)); } catch {}
  }

  const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg").replace("svg+xml", "svg");
  const filename = `world.${ext}`;
  const filepath = path.join(MAP_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  const url = `/api/admin/world-map?v=${Date.now()}`;
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("world_map_url", url);

  return NextResponse.json({ url });
}

export async function DELETE() {
  if (fs.existsSync(MAP_DIR)) {
    for (const f of fs.readdirSync(MAP_DIR)) {
      try { fs.unlinkSync(path.join(MAP_DIR, f)); } catch {}
    }
  }
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run("world_map_url", "");
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!fs.existsSync(MAP_DIR)) return new NextResponse(null, { status: 404 });
  for (const ext of ["png", "jpg", "webp", "svg", "gif"]) {
    const fp = path.join(MAP_DIR, `world.${ext}`);
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      const mime = ext === "jpg" ? "image/jpeg" : ext === "svg" ? "image/svg+xml" : `image/${ext}`;
      return new NextResponse(buf, { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=300" } });
    }
  }
  return new NextResponse(null, { status: 404 });
}
