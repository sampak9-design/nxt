"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Sliders, ChevronDown, ChevronRight, Globe } from "lucide-react";

type Row = {
  asset:             string;
  base:              number;
  vol:               number;
  mean_reversion:    number;
  wick_intensity:    number;
  decimals:          number;
  spike_chance:      number;
  spike_magnitude:   number;
  momentum_strength: number;
  momentum_duration: number;
  drift_bias:        number;
  liquidity:         number;
  seasonality_on:    number;
  hasOverride:       boolean;
};

type GlobalConfig = {
  volMultiplier:   number;
  marketMode:      "calm" | "normal" | "nervous";
  spikeMultiplier: number;
  seasonalityOn:   boolean;
};

const PRESETS: Record<string, Partial<Row>> = {
  Calmo: {
    vol: 0.035, mean_reversion: 0.0008, wick_intensity: 0.8,
    spike_chance: 0.001, spike_magnitude: 0.0004,
    momentum_strength: 0.15, momentum_duration: 180, liquidity: 1.4,
  },
  Normal: {
    vol: 0.070, mean_reversion: 0.0002, wick_intensity: 1.2,
    spike_chance: 0.005, spike_magnitude: 0.0008,
    momentum_strength: 0.30, momentum_duration: 90, liquidity: 1.0,
  },
  Agressivo: {
    vol: 0.110, mean_reversion: 0.00005, wick_intensity: 2.0,
    spike_chance: 0.012, spike_magnitude: 0.0014,
    momentum_strength: 0.55, momentum_duration: 60, liquidity: 0.7,
  },
  Lateral: {
    vol: 0.020, mean_reversion: 0.0030, wick_intensity: 0.6,
    spike_chance: 0.0005, spike_magnitude: 0.0003,
    momentum_strength: 0.05, momentum_duration: 240, liquidity: 1.6,
  },
  Volatil: {
    vol: 0.150, mean_reversion: 0.00003, wick_intensity: 2.5,
    spike_chance: 0.020, spike_magnitude: 0.0025,
    momentum_strength: 0.70, momentum_duration: 45, liquidity: 0.5,
  },
  Noticia: {
    vol: 0.090, mean_reversion: 0.0001, wick_intensity: 1.8,
    spike_chance: 0.040, spike_magnitude: 0.0035,
    momentum_strength: 0.40, momentum_duration: 30, liquidity: 0.8,
  },
  Tendencia: {
    vol: 0.060, mean_reversion: 0.00002, wick_intensity: 1.0,
    spike_chance: 0.003, spike_magnitude: 0.0006,
    momentum_strength: 0.85, momentum_duration: 300, liquidity: 1.0,
  },
};

export default function OtcConfigPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [globalCfg, setGlobalCfg] = useState<GlobalConfig>({
    volMultiplier: 1.0, marketMode: "normal", spikeMultiplier: 1.0, seasonalityOn: true,
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = () => {
    fetch("/api/admin/otc-config")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.assets || []);
        if (d.global) setGlobalCfg(d.global);
      })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const update = (asset: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.asset === asset ? { ...r, ...patch } : r)));
  };

  const save = async (row: Row) => {
    setSavingId(row.asset);
    try {
      await fetch("/api/admin/otc-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...row, seasonality_on: !!row.seasonality_on }),
      });
      await new Promise((r) => setTimeout(r, 200));
      load();
    } finally {
      setSavingId(null);
    }
  };

  const reset = async (asset: string) => {
    if (!confirm(`Resetar ${asset}?`)) return;
    await fetch(`/api/admin/otc-config?asset=${asset}`, { method: "DELETE" });
    load();
  };

  const applyPreset = (row: Row, presetName: string) => {
    const p = PRESETS[presetName];
    if (!p) return;
    update(row.asset, p);
  };

  const saveGlobal = async (patch: Partial<GlobalConfig>) => {
    const next = { ...globalCfg, ...patch };
    setGlobalCfg(next);
    setSavingGlobal(true);
    try {
      await fetch("/api/admin/otc-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ global: next }),
      });
    } finally {
      setSavingGlobal(false);
    }
  };

  const toggleExpand = (asset: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(asset)) next.delete(asset);
      else next.add(asset);
      return next;
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sliders className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-bold text-white">Configuração de Ativos OTC</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Controle completo da movimentação dos preços OTC: volatilidade, tendências, pavios, spikes, sessões, drift e liquidez.
      </p>

      {/* Global controls */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-white">Configuração global</h2>
          {savingGlobal && <span className="text-xs text-gray-500">salvando…</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="text-xs text-gray-500 mb-2">Modo de mercado</div>
            <div className="flex gap-2">
              {(["calm", "normal", "nervous"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => saveGlobal({ marketMode: m })}
                  className="flex-1 px-3 py-2 rounded text-[12px] font-medium transition-colors"
                  style={{
                    background: globalCfg.marketMode === m ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
                    color:      globalCfg.marketMode === m ? "#f97316" : "#cbd5e1",
                    border: `1px solid ${globalCfg.marketMode === m ? "#f97316" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  {m === "calm" ? "Calmo" : m === "nervous" ? "Nervoso" : "Normal"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">Multiplicador de volatilidade global</div>
            <div className="flex items-center gap-3">
              <input
                type="range" min="0.3" max="3" step="0.1"
                value={globalCfg.volMultiplier}
                onChange={(e) => saveGlobal({ volMultiplier: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="font-mono text-[12px] text-white w-12 text-right">{globalCfg.volMultiplier.toFixed(1)}x</span>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">Multiplicador de spikes</div>
            <div className="flex items-center gap-3">
              <input
                type="range" min="0" max="3" step="0.1"
                value={globalCfg.spikeMultiplier}
                onChange={(e) => saveGlobal({ spikeMultiplier: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="font-mono text-[12px] text-white w-12 text-right">{globalCfg.spikeMultiplier.toFixed(1)}x</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={globalCfg.seasonalityOn}
                onChange={(e) => saveGlobal({ seasonalityOn: e.target.checked })}
              />
              <span className="text-[12px] text-gray-200">Sazonalidade ativa (sessões Londres/NY)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Per-asset table */}
      <div className="overflow-x-auto rounded-xl" style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-gray-500" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th className="text-left py-3 px-3 font-semibold w-8"></th>
              <th className="text-left py-3 px-3 font-semibold">Ativo</th>
              <th className="text-right py-3 px-3 font-semibold">Volatilidade</th>
              <th className="text-right py-3 px-3 font-semibold">Mean rev.</th>
              <th className="text-right py-3 px-3 font-semibold">Pavios</th>
              <th className="text-center py-3 px-3 font-semibold">Preset</th>
              <th className="text-center py-3 px-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isExp = expanded.has(r.asset);
              return (
                <>
                  <tr key={r.asset} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-2 px-3">
                      <button onClick={() => toggleExpand(r.asset)} className="text-gray-500 hover:text-white">
                        {isExp ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-white">{r.asset}</div>
                      {r.hasOverride && <div className="text-[9px] text-orange-400 mt-0.5">CUSTOMIZADO</div>}
                    </td>
                    <td className="py-2 px-3">
                      <SliderInline value={r.vol} min={0.005} max={0.2} step={0.005}
                        onChange={(v) => update(r.asset, { vol: v })}
                        format={(v) => `${(v * 100).toFixed(1)}%`} />
                    </td>
                    <td className="py-2 px-3">
                      <SliderInline value={r.mean_reversion} min={0} max={0.005} step={0.0001}
                        onChange={(v) => update(r.asset, { mean_reversion: v })}
                        format={(v) => v.toFixed(4)} />
                    </td>
                    <td className="py-2 px-3">
                      <SliderInline value={r.wick_intensity} min={0.3} max={3} step={0.1}
                        onChange={(v) => update(r.asset, { wick_intensity: v })}
                        format={(v) => v.toFixed(1)} />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        onChange={(e) => { applyPreset(r, e.target.value); e.target.value = ""; }}
                        className="px-2 py-1 rounded text-[11px]"
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }}
                        defaultValue=""
                      >
                        <option value="">—</option>
                        {Object.keys(PRESETS).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => save(r)}
                          disabled={savingId === r.asset}
                          className="flex items-center gap-1 px-3 py-1 rounded text-[11px] font-medium"
                          style={{
                            background: savingId === r.asset ? "rgba(255,255,255,0.05)" : "#22c55e",
                            color: savingId === r.asset ? "#64748b" : "#fff",
                          }}
                        >
                          <Save className="w-3 h-3" />{savingId === r.asset ? "..." : "Salvar"}
                        </button>
                        {r.hasOverride && (
                          <button
                            onClick={() => reset(r.asset)}
                            className="flex items-center justify-center w-7 h-7 rounded text-[11px]"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                          ><RotateCcw className="w-3 h-3" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExp && (
                    <tr key={r.asset + "-exp"} style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td colSpan={7} className="py-4 px-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                          <ExpandedField label="Preço base">
                            <input type="number" step="0.0001" value={r.base}
                              onChange={(e) => update(r.asset, { base: parseFloat(e.target.value) || 0 })}
                              className="w-32 px-2 py-1 rounded text-right font-mono text-[11px]"
                              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0" }} />
                          </ExpandedField>
                          <ExpandedField label="Decimais">
                            <input type="number" step="1" min="2" max="6" value={r.decimals}
                              onChange={(e) => update(r.asset, { decimals: parseInt(e.target.value) || 5 })}
                              className="w-20 px-2 py-1 rounded text-right font-mono text-[11px]"
                              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0" }} />
                          </ExpandedField>
                          <ExpandedField label="Chance de spike (por minuto)">
                            <SliderInline value={r.spike_chance} min={0} max={0.05} step={0.001}
                              onChange={(v) => update(r.asset, { spike_chance: v })}
                              format={(v) => `${(v * 100).toFixed(2)}%`} />
                          </ExpandedField>
                          <ExpandedField label="Magnitude do spike">
                            <SliderInline value={r.spike_magnitude} min={0.0001} max={0.005} step={0.0001}
                              onChange={(v) => update(r.asset, { spike_magnitude: v })}
                              format={(v) => `${(v * 10000).toFixed(1)} pip`} />
                          </ExpandedField>
                          <ExpandedField label="Força de momentum">
                            <SliderInline value={r.momentum_strength} min={0} max={1} step={0.05}
                              onChange={(v) => update(r.asset, { momentum_strength: v })}
                              format={(v) => v.toFixed(2)} />
                          </ExpandedField>
                          <ExpandedField label="Duração média do momentum (s)">
                            <SliderInline value={r.momentum_duration} min={15} max={600} step={15}
                              onChange={(v) => update(r.asset, { momentum_duration: v })}
                              format={(v) => `${v}s`} />
                          </ExpandedField>
                          <ExpandedField label="Drift bias (-1=baixa, +1=alta)">
                            <SliderInline value={r.drift_bias} min={-1} max={1} step={0.05}
                              onChange={(v) => update(r.asset, { drift_bias: v })}
                              format={(v) => v.toFixed(2)} />
                          </ExpandedField>
                          <ExpandedField label="Liquidez (menor = mais movimento)">
                            <SliderInline value={r.liquidity} min={0.3} max={2} step={0.1}
                              onChange={(v) => update(r.asset, { liquidity: v })}
                              format={(v) => v.toFixed(1)} />
                          </ExpandedField>
                          <ExpandedField label="Sazonalidade (sessões)">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={!!r.seasonality_on}
                                onChange={(e) => update(r.asset, { seasonality_on: e.target.checked ? 1 : 0 })} />
                              <span className="text-[11px] text-gray-300">Ativo</span>
                            </label>
                          </ExpandedField>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SliderInline({ value, min, max, step, onChange, format }: {
  value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} className="w-24" />
      <span className="font-mono text-[11px] text-gray-300 w-16 text-right">{format(value)}</span>
    </div>
  );
}

function ExpandedField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-[11px] text-gray-400 flex-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
