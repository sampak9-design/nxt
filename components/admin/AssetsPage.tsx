"use client";

import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight, Save, X, Pencil, BarChart3 } from "lucide-react";
import { ASSETS, type Asset } from "./mockData";

const LS_KEY = "xd_asset_overrides";

const glowCard = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

const TYPE_GRADIENT: Record<string, { bg: string; color: string; glow: string }> = {
  Crypto: {
    bg: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))",
    color: "#f97316",
    glow: "0 0 8px rgba(249,115,22,0.2)",
  },
  Forex: {
    bg: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))",
    color: "#3b82f6",
    glow: "0 0 8px rgba(59,130,246,0.2)",
  },
  OTC: {
    bg: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))",
    color: "#a855f7",
    glow: "0 0 8px rgba(168,85,247,0.2)",
  },
};

function loadAssets(): Asset[] {
  try {
    const overrides = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, Partial<Asset>>;
    return ASSETS.map((a) => ({ ...a, ...overrides[a.id] }));
  } catch { return ASSETS; }
}

function saveOverride(id: string, patch: Partial<Asset>) {
  try {
    const overrides = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
    overrides[id] = { ...overrides[id], ...patch };
    localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  } catch {}
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>(ASSETS);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<Partial<Asset>>({});

  useEffect(() => { setAssets(loadAssets()); }, []);

  const toggle = (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (!asset) return;
    const newActive = !asset.active;
    setAssets((p) => p.map((a) => a.id === id ? { ...a, active: newActive } : a));
    saveOverride(id, { active: newActive });
  };

  const startEdit = (a: Asset) => {
    setEditing(a.id);
    setEditVals({ payoutM1: a.payoutM1, payoutM5: a.payoutM5, payoutM15: a.payoutM15, payoutH1: a.payoutH1 });
  };

  const saveEdit = (id: string) => {
    setAssets((p) => p.map((a) => a.id === id ? { ...a, ...editVals } : a));
    saveOverride(id, editVals);
    setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <BarChart3 className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Ativos</h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 ml-8">
          Gerencie ativos, payouts e status
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={glowCard}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              {["Ativo","Tipo","1m","5m","15m","1h","Trades","Win Rate","Status","Ações"].map((h) => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a, i) => {
              const isEditing = editing === a.id;
              const typeStyle = TYPE_GRADIENT[a.type] ?? { bg: "rgba(100,116,139,0.15)", color: "#64748b", glow: "none" };
              return (
                <tr key={a.id}
                  className="transition-colors duration-200 hover:bg-white/[0.02]"
                  style={{
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}>
                  <td className="px-4 py-3.5">
                    <span className="text-white font-extrabold text-xs">{a.name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-extrabold inline-block"
                      style={{
                        background: typeStyle.bg,
                        color: typeStyle.color,
                        boxShadow: typeStyle.glow,
                      }}>
                      {a.type}
                    </span>
                  </td>
                  {(["payoutM1","payoutM5","payoutM15","payoutH1"] as const).map((field) => (
                    <td key={field} className="px-4 py-3.5">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editVals[field] ?? a[field]}
                          onChange={(e) => setEditVals((v) => ({ ...v, [field]: +e.target.value }))}
                          className="w-16 rounded-lg px-2.5 py-1.5 text-xs text-white font-extrabold focus:outline-none transition-all duration-200"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                          onFocus={e => { e.target.style.borderColor = "rgba(249,115,22,0.4)"; e.target.style.boxShadow = "0 0 10px rgba(249,115,22,0.15)"; }}
                          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                        />
                      ) : (
                        <span className="text-xs text-emerald-400 font-extrabold"
                          style={{ textShadow: "0 0 6px rgba(34,197,94,0.15)" }}>
                          {a[field]}%
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-medium">
                    {a.totalTrades.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-extrabold ${a.winRate >= 50 ? "text-red-400" : "text-emerald-400"}`}
                      style={{
                        textShadow: a.winRate >= 50
                          ? "0 0 6px rgba(239,68,68,0.15)"
                          : "0 0 6px rgba(34,197,94,0.15)",
                      }}>
                      {a.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => toggle(a.id)}
                      className="flex items-center gap-1.5 transition-all duration-200 hover:translate-x-0.5">
                      {a.active
                        ? <ToggleRight className="w-6 h-6" style={{ color: "#22c55e", filter: "drop-shadow(0 0 4px rgba(34,197,94,0.3))" }} />
                        : <ToggleLeft  className="w-6 h-6 text-gray-600" />}
                      <span className={`text-xs font-extrabold ${a.active ? "text-emerald-400" : "text-gray-600"}`}>
                        {a.active ? "Ativo" : "Inativo"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(a.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold text-white transition-all duration-200 hover:-translate-y-[1px]"
                          style={{
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            boxShadow: "0 0 12px rgba(34,197,94,0.3)",
                          }}>
                          <Save className="w-3 h-3" /> Salvar
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-[1px]"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(a)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-[1px]"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
