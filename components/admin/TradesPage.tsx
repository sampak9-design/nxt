"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { TRADES, type Trade } from "./mockData";

export default function TradesPage() {
  const [trades] = useState<Trade[]>(TRADES);
  const [filter, setFilter] = useState<"all" | "real" | "practice">("all");
  const [result, setResult] = useState<"all" | "win" | "lose">("all");

  const filtered = trades.filter((t) => {
    const matchAcc = filter === "all" || t.accountType === filter;
    const matchRes = result === "all" || t.result === result;
    return matchAcc && matchRes;
  });

  const totalVol   = filtered.reduce((a, t) => a + t.amount, 0);
  const wins       = filtered.filter((t) => t.result === "win").length;
  const houseEdge  = filtered.reduce((a, t) => a + (t.result === "lose" ? t.amount : -t.profit), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total operações", value: String(filtered.length),             color: "#f97316" },
          { label: "Volume",          value: `$${totalVol.toLocaleString()}`,      color: "#3b82f6" },
          { label: "Taxa de ganho",   value: `${filtered.length ? Math.round((wins/filtered.length)*100) : 0}%`, color: "#22c55e" },
          { label: "Receita casa",    value: `$${houseEdge.toLocaleString()}`,     color: "#a855f7" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4"
            style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#161c2c" }}>
          {(["all","real","practice"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: filter === f ? "rgba(249,115,22,0.2)" : "transparent",
                color:      filter === f ? "#f97316" : "#64748b",
              }}>
              {{ all: "Todas", real: "Real", practice: "Demo" }[f]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#161c2c" }}>
          {(["all","win","lose"] as const).map((r) => (
            <button key={r} onClick={() => setResult(r)}
              className="px-3 py-1 rounded text-xs font-medium transition-colors"
              style={{
                background: result === r ? "rgba(249,115,22,0.2)" : "transparent",
                color:      result === r ? "#f97316" : "#64748b",
              }}>
              {{ all: "Todas", win: "Ganhou", lose: "Perdeu" }[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden"
        style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Usuário","Ativo","Direção","Valor","Entrada","Saída","Resultado","Conta","Data"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3 text-xs text-white">{t.userName}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{t.asset}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs ${t.direction === "up" ? "text-green-400" : "text-red-400"}`}>
                    {t.direction === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {t.direction === "up" ? "Alta" : "Baixa"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-white font-medium">${t.amount}</td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{t.entryPrice}</td>
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{t.exitPrice}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold ${t.result === "win" ? "text-green-400" : "text-red-400"}`}>
                    {t.result === "win" ? `+$${t.profit}` : `-$${Math.abs(t.profit)}`}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: t.accountType === "real" ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)",
                      color:      t.accountType === "real" ? "#22c55e" : "#f97316",
                    }}>
                    {t.accountType === "real" ? "Real" : "Demo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{t.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
