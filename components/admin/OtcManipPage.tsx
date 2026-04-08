"use client";

import { useEffect, useState } from "react";
import { Zap, Save, Activity } from "lucide-react";

type Mode = "off" | "always" | "vip_safe";
type Config = { mode: Mode; driftWindowSec: number; driftMaxPct: number };
type Stats = Record<string, { up: number; down: number; count: number }>;

export default function OtcManipPage() {
  const [cfg, setCfg] = useState<Config>({ mode: "always", driftWindowSec: 10, driftMaxPct: 0.0015 });
  const [stats, setStats] = useState<Stats>({});
  const [open, setOpen] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = () => {
    fetch("/api/admin/otc-manip")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) setCfg(d.config);
        if (d.stats) setStats(d.stats);
        if (typeof d.open === "number") setOpen(d.open);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  const save = async (patch: Partial<Config>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    setSaving(true);
    try {
      await fetch("/api/admin/otc-manip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-bold text-white">Manipulação OTC</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Controla o motor de manipulação dos ativos OTC. O drift é aplicado nos últimos
        N segundos antes do expiry, empurrando o preço contra o lado com mais volume
        de apostas.
      </p>

      {/* Mode */}
      <div className="rounded-xl p-5 mb-5" style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-semibold text-white mb-3">Modo de operação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            { id: "off",      label: "Desligado",         desc: "Preço real, sem manipulação" },
            { id: "always",   label: "Casa sempre ganha", desc: "Força contra a maioria" },
            { id: "vip_safe", label: "VIP seguro",        desc: "VIP recebe preço real" },
          ] as const).map((opt) => {
            const active = cfg.mode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => save({ mode: opt.id })}
                className="text-left p-3 rounded-lg transition-colors"
                style={{
                  background: active ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "#f97316" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div className="text-[13px] font-semibold" style={{ color: active ? "#f97316" : "#e2e8f0" }}>{opt.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drift parameters */}
      <div className="rounded-xl p-5 mb-5" style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h2 className="text-sm font-semibold text-white mb-4">Parâmetros do drift</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Janela de drift</span>
              <span className="text-[12px] font-mono text-white">{cfg.driftWindowSec}s</span>
            </div>
            <input
              type="range" min="2" max="30" step="1"
              value={cfg.driftWindowSec}
              onChange={(e) => save({ driftWindowSec: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="text-[10px] text-gray-600 mt-1">Quantos segundos antes do expiry o drift começa</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Intensidade máxima</span>
              <span className="text-[12px] font-mono text-white">{(cfg.driftMaxPct * 100).toFixed(3)}%</span>
            </div>
            <input
              type="range" min="0.0001" max="0.005" step="0.0001"
              value={cfg.driftMaxPct}
              onChange={(e) => save({ driftMaxPct: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="text-[10px] text-gray-600 mt-1">% máxima de movimento aplicada (0.15% = ~15 pips)</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          {saving ? "Salvando..." : savedFlash && <span className="text-emerald-400">✓ Salvo</span>}
        </div>
      </div>

      {/* Live exposure */}
      <div className="rounded-xl p-5" style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-white">Exposição ao vivo</h2>
          </div>
          <span className="text-xs text-gray-500">{open} trade{open === 1 ? "" : "s"} aberta{open === 1 ? "" : "s"}</span>
        </div>
        {Object.keys(stats).length === 0 ? (
          <div className="text-xs text-gray-600 py-6 text-center">Sem trades abertas no momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-gray-500" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th className="text-left py-2 px-2 font-medium">Ativo</th>
                  <th className="text-right py-2 px-2 font-medium">Trades</th>
                  <th className="text-right py-2 px-2 font-medium">UP (R$)</th>
                  <th className="text-right py-2 px-2 font-medium">DOWN (R$)</th>
                  <th className="text-right py-2 px-2 font-medium">Casa força</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats).map(([asset, s]) => (
                  <tr key={asset} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-2 px-2 text-white font-medium">{asset}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{s.count}</td>
                    <td className="py-2 px-2 text-right text-emerald-400">{s.up.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-red-400">{s.down.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right font-semibold" style={{ color: "#f97316" }}>
                      {s.up > s.down ? "↓ DOWN" : s.down > s.up ? "↑ UP" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
