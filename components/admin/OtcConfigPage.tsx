"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw, Sliders } from "lucide-react";

type Row = {
  asset:           string;
  base:            number;
  vol:             number;
  mean_reversion:  number;
  wick_intensity:  number;
  decimals:        number;
  hasOverride:     boolean;
};

const PRESETS: Record<string, { vol: number; mean_reversion: number; wick_intensity: number }> = {
  Calmo:     { vol: 0.035, mean_reversion: 0.0008, wick_intensity: 0.8 },
  Normal:    { vol: 0.070, mean_reversion: 0.0002, wick_intensity: 1.2 },
  Agressivo: { vol: 0.110, mean_reversion: 0.00005, wick_intensity: 2.0 },
  Lateral:   { vol: 0.020, mean_reversion: 0.0020, wick_intensity: 0.6 },
};

export default function OtcConfigPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/otc-config")
      .then((r) => r.json())
      .then((d) => setRows(d.assets || []))
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
        body: JSON.stringify(row),
      });
      await new Promise((r) => setTimeout(r, 200));
      load();
    } finally {
      setSavingId(null);
    }
  };

  const reset = async (asset: string) => {
    if (!confirm(`Resetar ${asset} para os valores padrão?`)) return;
    await fetch(`/api/admin/otc-config?asset=${asset}`, { method: "DELETE" });
    load();
  };

  const applyPreset = (row: Row, presetName: string) => {
    const p = PRESETS[presetName];
    if (!p) return;
    update(row.asset, p);
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <Sliders className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-bold text-white">Configuração de Ativos OTC</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Controle a volatilidade, mean reversion (força de retorno ao preço base) e
        intensidade dos pavios de cada ativo OTC. As mudanças se aplicam imediatamente
        no traderoom.
      </p>

      <div className="overflow-x-auto rounded-xl" style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-gray-500" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <th className="text-left py-3 px-3 font-semibold">Ativo</th>
              <th className="text-right py-3 px-3 font-semibold">Preço base</th>
              <th className="text-right py-3 px-3 font-semibold">Volatilidade</th>
              <th className="text-right py-3 px-3 font-semibold">Mean reversion</th>
              <th className="text-right py-3 px-3 font-semibold">Pavios</th>
              <th className="text-center py-3 px-3 font-semibold">Preset</th>
              <th className="text-center py-3 px-3 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.asset} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="py-2 px-3">
                  <div className="font-semibold text-white">{r.asset}</div>
                  {r.hasOverride && <div className="text-[9px] text-orange-400 mt-0.5">CUSTOMIZADO</div>}
                </td>
                <td className="py-2 px-3">
                  <input
                    type="number"
                    step="0.0001"
                    value={r.base}
                    onChange={(e) => update(r.asset, { base: parseFloat(e.target.value) || 0 })}
                    className="w-24 px-2 py-1 rounded text-right font-mono text-[11px]"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0" }}
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="range"
                      min="0.005"
                      max="0.2"
                      step="0.005"
                      value={r.vol}
                      onChange={(e) => update(r.asset, { vol: parseFloat(e.target.value) })}
                      className="w-20"
                    />
                    <span className="font-mono text-[11px] text-gray-300 w-12 text-right">
                      {(r.vol * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="range"
                      min="0"
                      max="0.005"
                      step="0.0001"
                      value={r.mean_reversion}
                      onChange={(e) => update(r.asset, { mean_reversion: parseFloat(e.target.value) })}
                      className="w-20"
                    />
                    <span className="font-mono text-[11px] text-gray-300 w-14 text-right">
                      {r.mean_reversion.toFixed(4)}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-end gap-2">
                    <input
                      type="range"
                      min="0.3"
                      max="3"
                      step="0.1"
                      value={r.wick_intensity}
                      onChange={(e) => update(r.asset, { wick_intensity: parseFloat(e.target.value) })}
                      className="w-20"
                    />
                    <span className="font-mono text-[11px] text-gray-300 w-10 text-right">
                      {r.wick_intensity.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3">
                  <select
                    onChange={(e) => { applyPreset(r, e.target.value); e.target.value = ""; }}
                    className="px-2 py-1 rounded text-[11px]"
                    style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1" }}
                    defaultValue=""
                  >
                    <option value="">—</option>
                    {Object.keys(PRESETS).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
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
                      title="Salvar"
                    >
                      <Save className="w-3 h-3" />
                      {savingId === r.asset ? "..." : "Salvar"}
                    </button>
                    {r.hasOverride && (
                      <button
                        onClick={() => reset(r.asset)}
                        className="flex items-center justify-center w-7 h-7 rounded text-[11px]"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                        title="Resetar"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
