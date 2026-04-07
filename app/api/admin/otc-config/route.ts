import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { OTC_ASSETS, invalidateConfig } from "@/lib/otc/replayer";

// GET /api/admin/otc-config — list all assets with current effective config
export async function GET() {
  const rows = db.prepare("SELECT * FROM otc_asset_config").all() as Array<{
    asset: string; base: number; vol: number;
    mean_reversion: number; wick_intensity: number; decimals: number;
  }>;
  const overrides: Record<string, any> = {};
  for (const r of rows) overrides[r.asset] = r;

  const assets = Object.entries(OTC_ASSETS).map(([asset, def]) => {
    const ov = overrides[asset];
    return {
      asset,
      base:           ov?.base           ?? def.base,
      vol:            ov?.vol            ?? def.vol,
      mean_reversion: ov?.mean_reversion ?? 0.0002,
      wick_intensity: ov?.wick_intensity ?? 1.2,
      decimals:       ov?.decimals       ?? def.decimals,
      hasOverride:    !!ov,
    };
  });

  return NextResponse.json({ assets });
}

// POST /api/admin/otc-config  body: { asset, base?, vol?, mean_reversion?, wick_intensity?, decimals? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const asset = String(body.asset || "").toUpperCase();
  if (!OTC_ASSETS[asset]) {
    return NextResponse.json({ error: "Unknown asset" }, { status: 400 });
  }
  const def = OTC_ASSETS[asset];
  const stmt = db.prepare(`
    INSERT INTO otc_asset_config (asset, base, vol, mean_reversion, wick_intensity, decimals)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(asset) DO UPDATE SET
      base = excluded.base,
      vol  = excluded.vol,
      mean_reversion = excluded.mean_reversion,
      wick_intensity = excluded.wick_intensity,
      decimals = excluded.decimals
  `);
  stmt.run(
    asset,
    Number(body.base ?? def.base),
    Number(body.vol ?? def.vol),
    Number(body.mean_reversion ?? 0.0002),
    Number(body.wick_intensity ?? 1.2),
    Number(body.decimals ?? def.decimals),
  );
  invalidateConfig();
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/otc-config?asset=EURUSD — reset to defaults
export async function DELETE(req: NextRequest) {
  const asset = new URL(req.url).searchParams.get("asset") || "";
  db.prepare("DELETE FROM otc_asset_config WHERE asset = ?").run(asset.toUpperCase());
  invalidateConfig();
  return NextResponse.json({ ok: true });
}
