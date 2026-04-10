"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Search } from "lucide-react";

type Deposit = {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  amount: number;
  method: string;
  status: "pending" | "approved" | "rejected";
  pix_txid: string | null;
  created_at: number;
  reviewed_at: number | null;
};

function fmt(n: number) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
function fmtDate(ms: number) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  const load = () => {
    fetch("/api/admin/deposits")
      .then(r => r.json())
      .then(d => { setDeposits(d.deposits ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    setProcessing(id);
    await fetch("/api/admin/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
    setProcessing(null);
  };

  const filtered = deposits
    .filter(d => filter === "all" || d.status === filter)
    .filter(d => !search || d.user_name?.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase()));

  const totals = {
    pending:  deposits.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0),
    approved: deposits.filter(d => d.status === "approved").reduce((s, d) => s + d.amount, 0),
    rejected: deposits.filter(d => d.status === "rejected").reduce((s, d) => s + d.amount, 0),
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white">Depósitos</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Pendentes</div>
          <div className="text-lg font-bold text-orange-400">R${fmt(totals.pending)}</div>
          <div className="text-[10px] text-gray-600">{deposits.filter(d => d.status === "pending").length} depósitos</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Aprovados</div>
          <div className="text-lg font-bold text-green-400">R${fmt(totals.approved)}</div>
          <div className="text-[10px] text-gray-600">{deposits.filter(d => d.status === "approved").length} depósitos</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Rejeitados</div>
          <div className="text-lg font-bold text-red-400">R${fmt(totals.rejected)}</div>
          <div className="text-[10px] text-gray-600">{deposits.filter(d => d.status === "rejected").length} depósitos</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          {(["all", "pending", "approved", "rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
              style={{ background: filter === f ? "#f97316" : "transparent", color: filter === f ? "#fff" : "#94a3b8" }}>
              {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : f === "approved" ? "Aprovados" : "Rejeitados"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-1 max-w-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input type="text" placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white outline-none flex-1" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm" style={{ minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Usuário</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Valor</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Método</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Data</th>
              <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhum depósito encontrado.</td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="py-3 px-4">
                  <div className="text-white text-xs font-medium">{d.user_name}</div>
                  <div className="text-[10px] text-gray-500">{d.email}</div>
                </td>
                <td className="py-3 px-4 text-right text-white font-semibold">R${fmt(d.amount)}</td>
                <td className="py-3 px-4 text-gray-400 text-xs uppercase">{d.method}</td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1 text-xs font-medium" style={{
                    color: d.status === "approved" ? "#22c55e" : d.status === "rejected" ? "#ef4444" : "#f97316"
                  }}>
                    {d.status === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     d.status === "rejected" ? <XCircle className="w-3.5 h-3.5" /> :
                     <Clock className="w-3.5 h-3.5" />}
                    {d.status === "approved" ? "Aprovado" : d.status === "rejected" ? "Rejeitado" : "Pendente"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">{fmtDate(d.created_at)}</td>
                <td className="py-3 px-4 text-center">
                  {d.status === "pending" ? (
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleAction(d.id, "approved")} disabled={processing === d.id}
                        className="px-2 py-1 rounded text-[10px] font-semibold text-white" style={{ background: "#22c55e" }}>Aprovar</button>
                      <button onClick={() => handleAction(d.id, "rejected")} disabled={processing === d.id}
                        className="px-2 py-1 rounded text-[10px] font-semibold text-white" style={{ background: "#ef4444" }}>Rejeitar</button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-600">—</span>
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
