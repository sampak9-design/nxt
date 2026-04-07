import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { OTC_ASSETS, invalidateConfig, getGlobalConfig, setGlobalConfig } from "@/lib/otc/replayer";

const FIELDS = [
  "base", "vol", "mean_reversion", "wick_intensity", "decimals",
  "spike_chance", "spike_magnitude", "momentum_strength", "momentum_duration",
  "drift_bias", "liquidity", "seasonality_on",
];

const DEFAULTS: Record<string, number> = {
  mean_reversion:    0.0002,
  wick_intensity:    1.2,
  spike_chance:      0.005,
  spike_magnitude:   0.0008,
  momentum_strength: 0.3,
  momentum_duration: 90,
  drift_bias:        0,
  liquidity:         1.0,
  seasonality_on:    1,
};

// GET /api/admin/otc-config — list all assets + global
export async function GET() {
  const rows = db.prepare("SELECT * FROM otc_asset_config").all() as Array<any>;
  const overrides: Record<string, any> = {};
  for (const r of rows) overrides[r.asset] = r;

  const assets = Object.entries(OTC_ASSETS).map(([asset, def]) => {
    const ov = overrides[asset] ?? {};
    return {
      asset,
      base:              ov.base              ?? def.base,
      vol:               ov.vol               ?? def.vol,
      mean_reversion:    ov.mean_reversion    ?? DEFAULTS.mean_reversion,
      wick_intensity:    ov.wick_intensity    ?? DEFAULTS.wick_intensity,
      decimals:          ov.decimals          ?? def.decimals,
      spike_chance:      ov.spike_chance      ?? DEFAULTS.spike_chance,
      spike_magnitude:   ov.spike_magnitude   ?? DEFAULTS.spike_magnitude,
      momentum_strength: ov.momentum_strength ?? DEFAULTS.momentum_strength,
      momentum_duration: ov.momentum_duration ?? DEFAULTS.momentum_duration,
      drift_bias:        ov.drift_bias        ?? DEFAULTS.drift_bias,
      liquidity:         ov.liquidity         ?? DEFAULTS.liquidity,
      seasonality_on:    ov.seasonality_on    ?? DEFAULTS.seasonality_on,
      hasOverride:       !!overrides[asset],
    };
  });

  return NextResponse.json({ assets, global: getGlobalConfig() });
}

// POST /api/admin/otc-config  body: per-asset OR { global: {...} }
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Global config update
  if (body.global) {
    const g = body.global;
    const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    if (g.volMultiplier   != null) stmt.run("otc_global_vol_mult",  String(g.volMultiplier));
    if (g.marketMode      != null) stmt.run("otc_global_mode",      String(g.marketMode));
    if (g.spikeMultiplier != null) stmt.run("otc_global_spike_mult", String(g.spikeMultiplier));
    if (g.seasonalityOn   != null) stmt.run("otc_global_seasonality", g.seasonalityOn ? "1" : "0");
    setGlobalConfig({
      volMultiplier:   g.volMultiplier,
      marketMode:      g.marketMode,
      spikeMultiplier: g.spikeMultiplier,
      seasonalityOn:   g.seasonalityOn,
    });
    return NextResponse.json({ ok: true });
  }

  const asset = String(body.asset || "").toUpperCase();
  if (!OTC_ASSETS[asset]) {
    return NextResponse.json({ error: "Unknown asset" }, { status: 400 });
  }
  const def = OTC_ASSETS[asset];

  const values: Record<string, number> = {
    base:              Number(body.base              ?? def.base),
    vol:               Number(body.vol               ?? def.vol),
    mean_reversion:    Number(body.mean_reversion    ?? DEFAULTS.mean_reversion),
    wick_intensity:    Number(body.wick_intensity    ?? DEFAULTS.wick_intensity),
    decimals:          Number(body.decimals          ?? def.decimals),
    spike_chance:      Number(body.spike_chance      ?? DEFAULTS.spike_chance),
    spike_magnitude:   Number(body.spike_magnitude   ?? DEFAULTS.spike_magnitude),
    momentum_strength: Number(body.momentum_strength ?? DEFAULTS.momentum_strength),
    momentum_duration: Number(body.momentum_duration ?? DEFAULTS.momentum_duration),
    drift_bias:        Number(body.drift_bias        ?? DEFAULTS.drift_bias),
    liquidity:         Number(body.liquidity         ?? DEFAULTS.liquidity),
    seasonality_on:    body.seasonality_on ? 1 : 0,
  };

  const cols = FIELDS.join(", ");
  const placeholders = FIELDS.map(() => "?").join(", ");
  const updates = FIELDS.map((f) => `${f} = excluded.${f}`).join(", ");
  const stmt = db.prepare(`
    INSERT INTO otc_asset_config (asset, ${cols})
    VALUES (?, ${placeholders})
    ON CONFLICT(asset) DO UPDATE SET ${updates}
  `);
  stmt.run(asset, ...FIELDS.map((f) => values[f]));
  invalidateConfig();
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const asset = new URL(req.url).searchParams.get("asset") || "";
  db.prepare("DELETE FROM otc_asset_config WHERE asset = ?").run(asset.toUpperCase());
  invalidateConfig();
  return NextResponse.json({ ok: true });
}
