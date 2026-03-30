"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { DEPOSITS, type Deposit } from "./mockData";

function StatusBadge({ status }: { status: Deposit["status"] }) {
  const cfg = {
    pending:  { icon: <Clock className="w-3 h-3" />,        bg: "rgba(249,115,22,0.15)", color: "#f97316", label: "Pendente"  },
    approved: { icon: <CheckCircle className="w-3 h-3" />,  bg: "rgba(34,197,94,0.15)", color: "#22c55e", label: "Aprovado"  },
    rejected: { icon: <XCircle className="w-3 h-3" />,      bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Rejeitado" },
  }[status];
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>(DEPOSITS);
  const [filter, setFilter]     = useState<"all" | Deposit["status"]>("all");

  const approve = (id: string) =>
    setDeposits((p) => p.map((d) => d.id === id ? { ...d, status: "approved" } : d));

  const reject = (id: string) =>
    setDeposits((p) => p.map((d) => d.id === id ? { ...d, status: "rejected" } : d));

  const filtered = filter === "all" ? deposits : deposits.filter((d) => d.status === filter);
  const total    = deposits.filter((d) => d.status === "approved").reduce((a, d) => a + d.amount, 0);
  const pending  = deposits.filter((d) => d.status === "pending").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total aprovado",  value: `$${total.toLocaleString()}`, color: "#22c55e" },
          { label: "Pendentes",       value: String(pending),               color: "#f97316" },
          { label: "Rejeitados",      value: String(deposits.filter(d => d.status === "rejected").length), color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4"
            style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "rgba(249,115,22,0.15)" : "#161c2c",
              color:      filter === f ? "#f97316" : "#64748b",
              border:     `1px solid ${filter === f ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"}`,
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
              {["ID", "Usuário", "Valor", "Método", "Status", "Data", "Ações"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="px-4 py-3 text-xs text-gray-600 font-mono">#{d.id}</td>
                <td className="px-4 py-3 text-xs text-white">{d.userName}</td>
                <td className="px-4 py-3 text-sm font-bold text-green-400">${d.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                    {d.method}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-3 text-xs text-gray-500">{d.createdAt}</td>
                <td className="px-4 py-3">
                  {d.status === "pending" && (
                    <div className="flex gap-1.5">
                      <button onClick={() => approve(d.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white transition-all hover:opacity-80"
                        style={{ background: "#22c55e" }}>
                        <CheckCircle className="w-3 h-3" /> Aprovar
                      </button>
                      <button onClick={() => reject(d.id)}
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
