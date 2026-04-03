import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return new NextResponse(null, { status: 404 });

  const DATA_DIR = process.env.DB_DIR ?? path.join(process.cwd(), "data");
  const dir = path.join(DATA_DIR, "avatars");

  for (const ext of ["jpg", "png", "webp", "gif"]) {
    const fp = path.join(dir, `${userId}.${ext}`);
    if (fs.existsSync(fp)) {
      const buf = fs.readFileSync(fp);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": `image/${ext === "jpg" ? "jpeg" : ext}`,
          "Cache-Control": "no-cache",
        },
      });
    }
  }
  return new NextResponse(null, { status: 404 });
}
