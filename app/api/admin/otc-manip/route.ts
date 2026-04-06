import { NextRequest, NextResponse } from "next/server";
import { getMode, setMode, getExposureStats, type ManipulationMode } from "@/lib/otc/manipulation";

export async function GET() {
  return NextResponse.json({ mode: getMode(), stats: getExposureStats() });
}

export async function POST(req: NextRequest) {
  const { mode } = await req.json();
  const valid: ManipulationMode[] = ["off", "always", "vip_safe"];
  if (!valid.includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }
  setMode(mode);
  return NextResponse.json({ ok: true, mode });
}
