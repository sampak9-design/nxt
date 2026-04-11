"use client";

import { useState, useEffect } from "react";
import { ToggleLeft, ToggleRight, Save, X, Pencil, BarChart3, Search, Layers } from "lucide-react";

const LS_KEY = "xd_asset_overrides";

type RealAsset = {
  id: string; symbol: string; name: string; is_active: boolean;
  payout_m1: number; payout_m5: number; payout_m15: number; payout_h1: number;
  type: string;
};

const glowCard = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

const TYPE_GRADIENT: Record<string, { bg: string; color: string; glow: string }> = {
  Crypto: { bg: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))", color: "#f97316", glow: "0 0 8px rgba(249,115,22,0.2)" },
  Forex:  { bg: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))", color: "#3b82f6", glow: "0 0 8px rgba(59,130,246,0.2)" },
  Metal:  { bg: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))", color: "#eab308", glow: "0 0 8px rgba(234,179,8,0.2)" },
  Synth:  { bg: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))", color: "#10b981", glow: "0 0 8px rgba(16,185,129,0.2)" },
  Jump:   { bg: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))", color: "#ec4899", glow: "0 0 8px rgba(236,72,153,0.2)" },
  OTC:    { bg: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))", color: "#a855f7", glow: "0 0 8px rgba(168,85,247,0.2)" },
};

// Classify asset type from its ID
function classifyAsset(id: string): string {
  if (id.includes("-OTC")) return "OTC";
  if (["BTCUSD","ETHUSD","SOLUSD","BNBUSD","XRPUSD","ADAUSD","DOTUSD","LTCUSD"].includes(id)) return "Crypto";
  if (["XAUUSD","XAGUSD"].includes(id)) return "Metal";
  if (id.startsWith("R_") || id.startsWith("1HZ")) return "Synth";
  if (id.startsWith("JD")) return "Jump";
  return "Forex";
}

// All real assets integrated with the broker
const ALL_ASSETS: Omit<RealAsset, "type">[] = [
  // Crypto
  { id: "BTCUSD",    symbol: "BTCUSD",    name: "BTC/USD",                   is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 86 },
  { id: "ETHUSD",    symbol: "ETHUSD",    name: "ETH/USD",                   is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 84 },
  { id: "SOLUSD",    symbol: "SOLUSD",    name: "SOL/USD",                   is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 84 },
  { id: "BNBUSD",    symbol: "BNBUSD",    name: "BNB/USD",                   is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83 },
  { id: "XRPUSD",    symbol: "XRPUSD",    name: "XRP/USD",                   is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83 },
  // Forex major
  { id: "EURUSD",    symbol: "EURUSD",    name: "EUR/USD",                   is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85 },
  { id: "GBPUSD",    symbol: "GBPUSD",    name: "GBP/USD",                   is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84 },
  { id: "USDJPY",    symbol: "USDJPY",    name: "USD/JPY",                   is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85 },
  { id: "AUDUSD",    symbol: "AUDUSD",    name: "AUD/USD",                   is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83 },
  { id: "USDCAD",    symbol: "USDCAD",    name: "USD/CAD",                   is_active: true, payout_m1: 79, payout_m5: 80, payout_m15: 82, payout_h1: 83 },
  { id: "USDCHF",    symbol: "USDCHF",    name: "USD/CHF",                   is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84 },
  { id: "NZDUSD",    symbol: "NZDUSD",    name: "NZD/USD",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  { id: "EURGBP",    symbol: "EURGBP",    name: "EUR/GBP",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  { id: "EURJPY",    symbol: "EURJPY",    name: "EUR/JPY",                   is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84 },
  { id: "EURCHF",    symbol: "EURCHF",    name: "EUR/CHF",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  { id: "GBPJPY",    symbol: "GBPJPY",    name: "GBP/JPY",                   is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84 },
  { id: "AUDJPY",    symbol: "AUDJPY",    name: "AUD/JPY",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  // Forex minor
  { id: "AUDCAD",    symbol: "AUDCAD",    name: "AUD/CAD",                   is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82 },
  { id: "AUDCHF",    symbol: "AUDCHF",    name: "AUD/CHF",                   is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82 },
  { id: "AUDNZD",    symbol: "AUDNZD",    name: "AUD/NZD",                   is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82 },
  { id: "EURAUD",    symbol: "EURAUD",    name: "EUR/AUD",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  { id: "EURCAD",    symbol: "EURCAD",    name: "EUR/CAD",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  { id: "EURNZD",    symbol: "EURNZD",    name: "EUR/NZD",                   is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82 },
  { id: "GBPAUD",    symbol: "GBPAUD",    name: "GBP/AUD",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  { id: "GBPCAD",    symbol: "GBPCAD",    name: "GBP/CAD",                   is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  { id: "GBPCHF",    symbol: "GBPCHF",    name: "GBP/CHF",                   is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82 },
  { id: "GBPNOK",    symbol: "GBPNOK",    name: "GBP/NOK",                   is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81 },
  { id: "GBPNZD",    symbol: "GBPNZD",    name: "GBP/NZD",                   is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82 },
  { id: "NZDJPY",    symbol: "NZDJPY",    name: "NZD/JPY",                   is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82 },
  { id: "USDMXN",    symbol: "USDMXN",    name: "USD/MXN",                   is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81 },
  { id: "USDNOK",    symbol: "USDNOK",    name: "USD/NOK",                   is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81 },
  { id: "USDPLN",    symbol: "USDPLN",    name: "USD/PLN",                   is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81 },
  { id: "USDSEK",    symbol: "USDSEK",    name: "USD/SEK",                   is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81 },
  // Metals
  { id: "XAUUSD",    symbol: "XAUUSD",    name: "Ouro/USD",                  is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85 },
  { id: "XAGUSD",    symbol: "XAGUSD",    name: "Prata/USD",                 is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83 },
  // Synthetic volatility indices (24/7)
  { id: "R_10",      symbol: "R_10",      name: "Volatility 10 Index",       is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90 },
  { id: "R_25",      symbol: "R_25",      name: "Volatility 25 Index",       is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90 },
  { id: "R_50",      symbol: "R_50",      name: "Volatility 50 Index",       is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90 },
  { id: "R_75",      symbol: "R_75",      name: "Volatility 75 Index",       is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90 },
  { id: "R_100",     symbol: "R_100",     name: "Volatility 100 Index",      is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90 },
  { id: "1HZ10V",    symbol: "1HZ10V",    name: "Volatility 10 (1s) Index",  is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "1HZ25V",    symbol: "1HZ25V",    name: "Volatility 25 (1s) Index",  is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "1HZ50V",    symbol: "1HZ50V",    name: "Volatility 50 (1s) Index",  is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "1HZ75V",    symbol: "1HZ75V",    name: "Volatility 75 (1s) Index",  is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "1HZ100V",   symbol: "1HZ100V",   name: "Volatility 100 (1s) Index", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  // Jump indices (24/7)
  { id: "JD10",      symbol: "JD10",      name: "Jump 10 Index",             is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "JD25",      symbol: "JD25",      name: "Jump 25 Index",             is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "JD50",      symbol: "JD50",      name: "Jump 50 Index",             is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "JD75",      symbol: "JD75",      name: "Jump 75 Index",             is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  { id: "JD100",     symbol: "JD100",     name: "Jump 100 Index",            is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87 },
  // OTC
  { id: "EURUSD-OTC", symbol: "EURUSD-OTC", name: "EUR/USD (OTC)",           is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90 },
];

function buildAssets(): RealAsset[] {
  const base = ALL_ASSETS.map(a => ({ ...a, type: classifyAsset(a.id) }));
  try {
    const overrides = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, any>;
    return base.map(a => {
      const o = overrides[a.id];
      if (!o) return a;
      return {
        ...a,
        payout_m1:  o.payoutM1  ?? o.payout_m1  ?? a.payout_m1,
        payout_m5:  o.payoutM5  ?? o.payout_m5  ?? a.payout_m5,
        payout_m15: o.payoutM15 ?? o.payout_m15 ?? a.payout_m15,
        payout_h1:  o.payoutH1  ?? o.payout_h1  ?? a.payout_h1,
        is_active:  o.active !== undefined ? o.active : a.is_active,
      };
    });
  } catch { return base; }
}

function saveOverride(id: string, patch: Record<string, any>) {
  try {
    const overrides = JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
    overrides[id] = { ...overrides[id], ...patch };
    localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  } catch {}
}

const FILTERS = ["Todos", "Crypto", "Forex", "Metal", "Synth", "Jump", "OTC"];

export default function AssetsPage() {
  const [assets, setAssets] = useState<RealAsset[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<{ m1: number; m5: number; m15: number; h1: number }>({ m1: 0, m5: 0, m15: 0, h1: 0 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");

  useEffect(() => { setAssets(buildAssets()); }, []);

  const toggle = (id: string) => {
    setAssets(p => p.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a));
    const asset = assets.find(a => a.id === id);
    if (asset) saveOverride(id, { active: !asset.is_active });
  };

  const startEdit = (a: RealAsset) => {
    setEditing(a.id);
    setEditVals({ m1: a.payout_m1, m5: a.payout_m5, m15: a.payout_m15, h1: a.payout_h1 });
  };

  const saveEdit = (id: string) => {
    setAssets(p => p.map(a => a.id === id ? { ...a, payout_m1: editVals.m1, payout_m5: editVals.m5, payout_m15: editVals.m15, payout_h1: editVals.h1 } : a));
    saveOverride(id, { payoutM1: editVals.m1, payoutM5: editVals.m5, payoutM15: editVals.m15, payoutH1: editVals.h1 });
    setEditing(null);
  };

  const filtered = assets
    .filter(a => typeFilter === "Todos" || a.type === typeFilter)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase()));

  const typeCounts = FILTERS.map(f => ({ label: f, count: f === "Todos" ? assets.length : assets.filter(a => a.type === f).length }));

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <style>{`
        @keyframes ast-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ast-fade { animation: ast-fade 0.4s ease-out forwards; opacity: 0; }
      `}</style>

      {/* Header */}
      <div className="ast-fade flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))", boxShadow: "0 0 20px rgba(249,115,22,0.1)" }}>
            <Layers className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Ativos</h1>
            <p className="text-sm text-gray-500">{assets.length} ativos integrados</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 text-gray-600" />
          <input type="text" placeholder="Buscar ativo..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-white outline-none w-48 placeholder:text-gray-600" />
        </div>
      </div>

      {/* Type filters */}
      <div className="ast-fade flex items-center gap-2 flex-wrap" style={{ animationDelay: "80ms" }}>
        {typeCounts.map(({ label, count }) => {
          const active = typeFilter === label;
          const typeStyle = TYPE_GRADIENT[label];
          return (
            <button key={label} onClick={() => setTypeFilter(label)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all relative"
              style={{
                background: active ? (typeStyle?.bg ?? "rgba(249,115,22,0.15)") : "rgba(255,255,255,0.03)",
                color: active ? (typeStyle?.color ?? "#f97316") : "#4b5563",
                border: `1px solid ${active ? (typeStyle?.color ?? "#f97316") + "30" : "rgba(255,255,255,0.06)"}`,
              }}>
              {label} <span className="ml-1 opacity-60">{count}</span>
              {active && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: typeStyle?.color ?? "#f97316" }} />}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="ast-fade rounded-2xl overflow-hidden" style={{ ...glowCard, animationDelay: "160ms" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Ativo", "Tipo", "1m", "5m", "15m", "1h", "Status", "Ações"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const isEditing = editing === a.id;
                const typeStyle = TYPE_GRADIENT[a.type] ?? { bg: "rgba(100,116,139,0.15)", color: "#64748b", glow: "none" };
                return (
                  <tr key={a.id}
                    className="transition-colors duration-200 hover:bg-white/[0.02]"
                    style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-white font-bold text-[13px]">{a.name}</span>
                        <div className="text-[10px] text-gray-600 font-mono">{a.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2.5 py-1 rounded-full font-bold inline-block"
                        style={{ background: typeStyle.bg, color: typeStyle.color, boxShadow: typeStyle.glow }}>
                        {a.type}
                      </span>
                    </td>
                    {([a.payout_m1, a.payout_m5, a.payout_m15, a.payout_h1] as number[]).map((val, pi) => {
                      const keys = ["m1", "m5", "m15", "h1"] as const;
                      return (
                        <td key={pi} className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editVals[keys[pi]]}
                              onChange={e => setEditVals(v => ({ ...v, [keys[pi]]: +e.target.value }))}
                              className="w-16 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none transition-all"
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                              onFocus={e => { e.target.style.borderColor = "rgba(249,115,22,0.4)"; e.target.style.boxShadow = "0 0 10px rgba(249,115,22,0.15)"; }}
                              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                            />
                          ) : (
                            <span className="text-xs text-emerald-400 font-extrabold" style={{ textShadow: "0 0 6px rgba(34,197,94,0.15)" }}>
                              {val}%
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3">
                      <button onClick={() => toggle(a.id)} className="flex items-center gap-1.5 transition-all duration-200 hover:translate-x-0.5">
                        {a.is_active
                          ? <ToggleRight className="w-6 h-6" style={{ color: "#22c55e", filter: "drop-shadow(0 0 4px rgba(34,197,94,0.3))" }} />
                          : <ToggleLeft className="w-6 h-6 text-gray-600" />}
                        <span className={`text-xs font-bold ${a.is_active ? "text-emerald-400" : "text-gray-600"}`}>
                          {a.is_active ? "Ativo" : "Off"}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(a.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:-translate-y-[1px]"
                            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 0 12px rgba(34,197,94,0.3)" }}>
                            <Save className="w-3 h-3" /> Salvar
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all hover:-translate-y-[1px]"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all hover:-translate-y-[1px]"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <Pencil className="w-3 h-3" /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-600 text-sm">Nenhum ativo encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
