"use client";

import { useEffect, useState } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";

type Trade = {
  id: string;
  user_id: number;
  user_name: string;
  account_type: "practice" | "real";
  asset_name: string;
  direction: "up" | "down";
  amount: number;
  payout: number;
  entry_price: number;
  exit_price: number | null;
  result: "win" | "lose" | null;
  net_profit: number | null;
  started_at: number;
  resolved_at: number | null;
};

function fmt(n: number) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
function fmtDate(ms: number) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "win" | "lose">("all");

  useEffect(() => {
    fetch("/api/admin/trades")
      .then(r => r.json())
      .then(d => { setTrades(d.trades ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = trades
    .filter(t => filter === "all" || t.result === filter)
    .filter(t => !search || t.user_name?.toLowerCase().includes(search.toLowerCase()) || t.asset_name?.toLowerCase().includes(search.toLowerCase()));

  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);
  const totalProfit = filtered.reduce((s, t) => s + (t.net_profit ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white">Operações</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Total operado</div>
          <div className="text-lg font-bold text-white">R${fmt(totalAmount)}</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Lucro/Prejuízo casa</div>
          <div className="text-lg font-bold" style={{ color: -totalProfit >= 0 ? "#22c55e" : "#ef4444" }}>R${fmt(-totalProfit)}</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Total operações</div>
          <div className="text-lg font-bold text-white">{filtered.length}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          {(["all", "win", "lose"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
              style={{ background: filter === f ? "#f97316" : "transparent", color: filter === f ? "#fff" : "#94a3b8" }}>
              {f === "all" ? "Todos" : f === "win" ? "Ganhos" : "Perdas"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white outline-none flex-1" />
        </div>
      </div>

      <div className="rounded-xl border overflow-x-auto" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm" style={{ minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Usuário</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Ativo</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Conta</th>
              <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Direção</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Valor</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">L/P</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Resultado</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-500">Nenhuma operação encontrada.</td></tr>
            ) : filtered.slice(0, 100).map(t => (
              <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="py-3 px-4 text-white text-xs">{t.user_name}</td>
                <td className="py-3 px-4 text-gray-300 text-xs font-medium">{t.asset_name}</td>
                <td className="py-3 px-4">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: t.account_type === "real" ? "rgba(16,185,129,0.1)" : "rgba(249,115,22,0.1)", color: t.account_type === "real" ? "#10b981" : "#f97316" }}>
                    {t.account_type === "real" ? "Real" : "Demo"}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {t.direction === "up"
                    ? <TrendingUp className="w-4 h-4 text-green-400 inline" />
                    : <TrendingDown className="w-4 h-4 text-red-400 inline" />}
                </td>
                <td className="py-3 px-4 text-right text-white text-xs">R${fmt(t.amount)}</td>
                <td className="py-3 px-4 text-right text-xs font-medium" style={{ color: (t.net_profit ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                  {t.net_profit != null ? `R$${fmt(t.net_profit)}` : "—"}
                </td>
                <td className="py-3 px-4">
                  {t.result ? (
                    <span className="text-xs font-semibold" style={{ color: t.result === "win" ? "#22c55e" : "#ef4444" }}>
                      {t.result === "win" ? "WIN" : "LOSS"}
                    </span>
                  ) : <span className="text-xs text-gray-500">Aberta</span>}
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">{fmtDate(t.started_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
