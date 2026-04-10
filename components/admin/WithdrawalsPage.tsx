"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Search } from "lucide-react";

type Withdrawal = {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  amount: number;
  method: string;
  pix_key: string | null;
  name: string | null;
  cpf: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: number;
  reviewed_at: number | null;
};

function fmt(n: number) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
function fmtDate(ms: number) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  const load = () => {
    fetch("/api/admin/withdrawals")
      .then(r => r.json())
      .then(d => { setWithdrawals(d.withdrawals ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: number, action: "approved" | "rejected") => {
    setProcessing(id);
    await fetch("/api/admin/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
    setProcessing(null);
  };

  const filtered = withdrawals
    .filter(w => filter === "all" || w.status === filter)
    .filter(w => !search || w.user_name?.toLowerCase().includes(search.toLowerCase()) || w.email?.toLowerCase().includes(search.toLowerCase()));

  const totals = {
    pending:  withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0),
    approved: withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0),
    rejected: withdrawals.filter(w => w.status === "rejected").reduce((s, w) => s + w.amount, 0),
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-white">Saques</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Pendentes</div>
          <div className="text-lg font-bold text-orange-400">R${fmt(totals.pending)}</div>
          <div className="text-[10px] text-gray-600">{withdrawals.filter(w => w.status === "pending").length} saques</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Aprovados</div>
          <div className="text-lg font-bold text-green-400">R${fmt(totals.approved)}</div>
          <div className="text-[10px] text-gray-600">{withdrawals.filter(w => w.status === "approved").length} saques</div>
        </div>
        <div className="rounded-xl p-4 border" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 mb-1">Rejeitados</div>
          <div className="text-lg font-bold text-red-400">R${fmt(totals.rejected)}</div>
          <div className="text-[10px] text-gray-600">{withdrawals.filter(w => w.status === "rejected").length} saques</div>
        </div>
      </div>

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

      <div className="rounded-xl border overflow-x-auto" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <table className="w-full text-sm" style={{ minWidth: 800 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Usuário</th>
              <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Valor</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Chave PIX</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Nome / CPF</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Data</th>
              <th className="text-center py-3 px-4 text-xs text-gray-500 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-500">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-500">Nenhum saque encontrado.</td></tr>
            ) : filtered.map(w => (
              <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td className="py-3 px-4">
                  <div className="text-white text-xs font-medium">{w.user_name}</div>
                  <div className="text-[10px] text-gray-500">{w.email}</div>
                </td>
                <td className="py-3 px-4 text-right text-white font-semibold">R${fmt(w.amount)}</td>
                <td className="py-3 px-4 text-gray-400 text-xs font-mono">{w.pix_key || "—"}</td>
                <td className="py-3 px-4">
                  <div className="text-xs text-gray-300">{w.name || "—"}</div>
                  <div className="text-[10px] text-gray-500">{w.cpf || ""}</div>
                </td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1 text-xs font-medium" style={{
                    color: w.status === "approved" ? "#22c55e" : w.status === "rejected" ? "#ef4444" : "#f97316"
                  }}>
                    {w.status === "approved" ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     w.status === "rejected" ? <XCircle className="w-3.5 h-3.5" /> :
                     <Clock className="w-3.5 h-3.5" />}
                    {w.status === "approved" ? "Aprovado" : w.status === "rejected" ? "Rejeitado" : "Pendente"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400 text-xs">{fmtDate(w.created_at)}</td>
                <td className="py-3 px-4 text-center">
                  {w.status === "pending" ? (
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleAction(w.id, "approved")} disabled={processing === w.id}
                        className="px-2 py-1 rounded text-[10px] font-semibold text-white" style={{ background: "#22c55e" }}>Aprovar</button>
                      <button onClick={() => handleAction(w.id, "rejected")} disabled={processing === w.id}
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
