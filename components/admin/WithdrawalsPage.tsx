"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { WITHDRAWALS, type Withdrawal } from "./mockData";

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(WITHDRAWALS);
  const [filter, setFilter] = useState<"all" | Withdrawal["status"]>("all");

  const approve = (id: string) =>
    setWithdrawals((p) => p.map((w) => w.id === id ? { ...w, status: "approved" } : w));

  const reject = (id: string) =>
    setWithdrawals((p) => p.map((w) => w.id === id ? { ...w, status: "rejected" } : w));

  const filtered = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter);
  const pendingTotal = withdrawals.filter((w) => w.status === "pending").reduce((a, w) => a + w.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Warning banner for pending */}
      {pendingTotal > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ background: "rgba(249,115,22,0.08)", borderColor: "rgba(249,115,22,0.2)" }}>
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
          <span className="text-sm text-orange-300">
            <strong>${pendingTotal.toLocaleString()}</strong> em saques aguardando aprovação
          </span>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "rgba(59,130,246,0.15)" : "#161c2c",
              color:      filter === f ? "#3b82f6" : "#64748b",
              border:     `1px solid ${filter === f ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>
            {{ all: "Todos", pending: "Pendentes", approved: "Aprovados", rejected: "Rejeitados" }[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden"
        style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Usuário", "Valor", "Método", "Destino", "Status", "Data", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3 text-xs text-white font-medium">{w.userName}</td>
                <td className="px-4 py-3 text-sm font-bold text-blue-400">${w.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                    {w.method}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{w.address}</td>
                <td className="px-4 py-3">
                  {w.status === "pending"  && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}><Clock className="w-3 h-3" />Pendente</span>}
                  {w.status === "approved" && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}><CheckCircle className="w-3 h-3" />Aprovado</span>}
                  {w.status === "rejected" && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}><XCircle className="w-3 h-3" />Rejeitado</span>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{w.createdAt}</td>
                <td className="px-4 py-3">
                  {w.status === "pending" && (
                    <div className="flex gap-1.5">
                      <button onClick={() => approve(w.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white transition-all hover:opacity-80"
                        style={{ background: "#22c55e" }}>
                        <CheckCircle className="w-3 h-3" /> Aprovar
                      </button>
                      <button onClick={() => reject(w.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white transition-all hover:opacity-80"
                        style={{ background: "#ef4444" }}>
                        <XCircle className="w-3 h-3" /> Rejeitar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
