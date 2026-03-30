"use client";

import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight, Save } from "lucide-react";
import { ASSETS, type Asset } from "./mockData";

const LS_KEY = "xd_asset_overrides";

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

  const TYPE_COLOR: Record<string, string> = {
    Crypto: "#f97316", Forex: "#3b82f6", OTC: "#a855f7",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border overflow-hidden"
        style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Ativo","Tipo","1m","5m","15m","1h","Trades","Win Rate","Status","Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => {
              const isEditing = editing === a.id;
              return (
                <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3">
                    <span className="text-xs text-white font-medium">{a.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{ background: (TYPE_COLOR[a.type] ?? "#64748b") + "22", color: TYPE_COLOR[a.type] ?? "#64748b" }}>
                      {a.type}
                    </span>
                  </td>
                  {(["payoutM1","payoutM5","payoutM15","payoutH1"] as const).map((field) => (
                    <td key={field} className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editVals[field] ?? a[field]}
                          onChange={(e) => setEditVals((v) => ({ ...v, [field]: +e.target.value }))}
                          className="w-14 bg-white/10 border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                          style={{ borderColor: "rgba(255,255,255,0.15)" }}
                        />
                      ) : (
                        <span className="text-xs text-green-400 font-medium">{a[field]}%</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-xs text-gray-400">{a.totalTrades.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${a.winRate >= 50 ? "text-red-400" : "text-green-400"}`}>
                      {a.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(a.id)} className="flex items-center gap-1">
                      {a.active
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft  className="w-5 h-5 text-gray-600"  />}
                      <span className={`text-xs ${a.active ? "text-green-400" : "text-gray-600"}`}>
                        {a.active ? "Ativo" : "Inativo"}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => saveEdit(a.id)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ background: "#22c55e" }}>
                          <Save className="w-3 h-3" /> Salvar
                        </button>
                        <button onClick={() => setEditing(null)}
                          className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(a)}
                        className="px-2 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        Editar payout
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
