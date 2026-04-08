import { NextRequest, NextResponse } from "next/server";
import { getConfig, saveConfig, getExposureStats, listExposures, type ManipulationMode } from "@/lib/otc/manipulation";

export async function GET() {
  return NextResponse.json({
    config: getConfig(),
    stats:  getExposureStats(),
    open:   listExposures().length,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const patch: any = {};
  if (body.mode) {
    const valid: ManipulationMode[] = ["off", "always", "vip_safe"];
    if (!valid.includes(body.mode)) return NextResponse.json({ error: "invalid mode" }, { status: 400 });
    patch.mode = body.mode;
  }
  if (typeof body.driftWindowSec === "number") patch.driftWindowSec = body.driftWindowSec;
  if (typeof body.driftMaxPct === "number")    patch.driftMaxPct    = body.driftMaxPct;
  saveConfig(patch);
  return NextResponse.json({ ok: true, config: getConfig() });
}
