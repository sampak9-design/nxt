"use client";

import { useEffect, useState } from "react";
import { Zap, Activity, CheckCircle2 } from "lucide-react";

type Mode = "off" | "always" | "vip_safe";
type Config = { mode: Mode; driftWindowSec: number; driftMaxPct: number };
type Stats = Record<string, { up: number; down: number; count: number }>;

const glowCard = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

const sliderCSS = `
  .otc-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.08); outline: none; transition: background 0.2s; }
  .otc-slider:hover { background: rgba(255,255,255,0.12); }
  .otc-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 0 10px rgba(249,115,22,0.4); cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
  .otc-slider::-webkit-slider-thumb:hover { transform: scale(1.15); box-shadow: 0 0 16px rgba(249,115,22,0.6); }
  .otc-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 0 10px rgba(249,115,22,0.4); cursor: pointer; border: none; }
  @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  .live-pulse { animation: livePulse 2s ease-in-out infinite; }
`;

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

  const modeOptions = [
    { id: "off" as const,      label: "Desligado",         desc: "Preço real, sem manipulação",  icon: "opacity-40" },
    { id: "always" as const,   label: "Casa sempre ganha", desc: "Força contra a maioria",       icon: "" },
    { id: "vip_safe" as const, label: "VIP seguro",        desc: "VIP recebe preço real",        icon: "" },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <style dangerouslySetInnerHTML={{ __html: sliderCSS }} />

      {/* Page title */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Zap className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Manipulação OTC</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 ml-8">
          Controla o motor de manipulação dos ativos OTC
        </p>
      </div>

      {/* Mode selector */}
      <div className="rounded-2xl p-5" style={glowCard}>
        <h2 className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-4">Modo de operação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modeOptions.map((opt) => {
            const active = cfg.mode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => save({ mode: opt.id })}
                className="text-left p-4 rounded-xl transition-all duration-300 hover:-translate-y-[1px]"
                style={{
                  background: active
                    ? "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.06))"
                    : "rgba(255,255,255,0.02)",
                  border: active
                    ? "1px solid rgba(249,115,22,0.5)"
                    : "1px solid rgba(255,255,255,0.05)",
                  boxShadow: active
                    ? "0 0 20px rgba(249,115,22,0.15), inset 0 1px 0 rgba(249,115,22,0.1)"
                    : "none",
                }}
              >
                <div className="text-sm font-extrabold" style={{ color: active ? "#f97316" : "#e2e8f0" }}>
                  {opt.label}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drift parameters */}
      <div className="rounded-2xl p-5" style={glowCard}>
        <h2 className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-5">Parâmetros do drift</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">Janela de drift</span>
              <span className="text-sm font-extrabold font-mono text-white"
                style={{ textShadow: "0 0 8px rgba(249,115,22,0.3)" }}>
                {cfg.driftWindowSec}s
              </span>
            </div>
            <input
              type="range" min="2" max="30" step="1"
              value={cfg.driftWindowSec}
              onChange={(e) => save({ driftWindowSec: parseInt(e.target.value) })}
              className="otc-slider"
            />
            <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-2">
              Segundos antes do expiry para iniciar drift
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">Intensidade máxima</span>
              <span className="text-sm font-extrabold font-mono text-white"
                style={{ textShadow: "0 0 8px rgba(249,115,22,0.3)" }}>
                {(cfg.driftMaxPct * 100).toFixed(3)}%
              </span>
            </div>
            <input
              type="range" min="0.0001" max="0.005" step="0.0001"
              value={cfg.driftMaxPct}
              onChange={(e) => save({ driftMaxPct: parseFloat(e.target.value) })}
              className="otc-slider"
            />
            <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-2">
              % máxima de movimento aplicada
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-5 text-xs">
          {saving ? (
            <span className="text-gray-500">Salvando...</span>
          ) : savedFlash ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Salvo
            </span>
          ) : null}
        </div>
      </div>

      {/* Live exposure */}
      <div className="rounded-2xl p-5" style={glowCard}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Activity className="w-5 h-5 text-orange-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400 live-pulse" />
            </div>
            <h2 className="text-sm font-extrabold text-white">Exposição ao vivo</h2>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(249,115,22,0.1)", color: "#f97316" }}>
            {open} trade{open === 1 ? "" : "s"} aberta{open === 1 ? "" : "s"}
          </span>
        </div>
        {Object.keys(stats).length === 0 ? (
          <div className="text-xs text-gray-600 py-8 text-center rounded-xl"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            Sem trades abertas no momento.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <th className="text-left py-3 px-3 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Ativo</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Trades</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-widest text-gray-500 font-medium">UP (R$)</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-widest text-gray-500 font-medium">DOWN (R$)</th>
                  <th className="text-right py-3 px-3 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Casa força</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats).map(([asset, s]) => (
                  <tr key={asset}
                    className="transition-colors duration-200 hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-2.5 px-3 text-white font-extrabold">{asset}</td>
                    <td className="py-2.5 px-3 text-right text-gray-300 font-medium">{s.count}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold" style={{ color: "#22c55e", textShadow: "0 0 6px rgba(34,197,94,0.2)" }}>
                      {s.up.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold" style={{ color: "#ef4444", textShadow: "0 0 6px rgba(239,68,68,0.2)" }}>
                      {s.down.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold" style={{ color: "#f97316" }}>
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
