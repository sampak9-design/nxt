"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Search, DollarSign, Ban, ArrowDownCircle } from "lucide-react";

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

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Rejeitados" },
] as const;

const SUMMARY_CARDS = [
  { key: "pending" as const, label: "Pendentes", color: "#f97316", icon: <Clock className="w-4 h-4" /> },
  { key: "approved" as const, label: "Aprovados", color: "#10b981", icon: <ArrowDownCircle className="w-4 h-4" /> },
  { key: "rejected" as const, label: "Rejeitados", color: "#ef4444", icon: <Ban className="w-4 h-4" /> },
];

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

  const counts = {
    pending:  deposits.filter(d => d.status === "pending").length,
    approved: deposits.filter(d => d.status === "approved").length,
    rejected: deposits.filter(d => d.status === "rejected").length,
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <style>{`
        @keyframes dep-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .dep-animate-fade-up { animation: dep-fade-up 0.5s ease-out forwards; opacity: 0; }
      `}</style>

      {/* Header */}
      <div className="dep-animate-fade-up">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Depósitos</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie e revise todos os depósitos da plataforma</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUMMARY_CARDS.map((card, i) => (
          <div key={card.key} className="relative group dep-animate-fade-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
            {/* Hover glow */}
            <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
              style={{ background: `linear-gradient(135deg, ${card.color}30, transparent 60%, ${card.color}15)`, filter: "blur(1px)" }} />
            <div className="relative rounded-2xl p-4 h-full overflow-hidden transition-transform duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: "linear-gradient(145deg, rgba(17,24,39,0.95), rgba(10,15,30,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}>
              {/* Radial gradient overlay */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04]"
                style={{ background: `radial-gradient(circle, ${card.color}, transparent)`, transform: "translate(30%, -30%)" }} />

              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${card.color}20, ${card.color}10)`, boxShadow: `0 0 20px ${card.color}15` }}>
                  <span style={{ color: card.color }}>{card.icon}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-[22px] font-extrabold text-white leading-none tracking-tight">R${fmt(totals[card.key])}</span>
              </div>
              <span className="text-[10px] text-gray-600 mt-1.5 block">{counts[card.key]} depósitos</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap dep-animate-fade-up" style={{ animationDelay: "320ms" }}>
        <div className="flex items-center rounded-xl overflow-hidden backdrop-blur-sm"
          style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-3.5 py-2.5 text-xs font-semibold transition-all relative"
              style={{
                background: filter === f.key ? "rgba(249,115,22,0.2)" : "transparent",
                color: filter === f.key ? "#fb923c" : "#4b5563",
              }}>
              {filter === f.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-orange-500" />
              )}
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-xs backdrop-blur-sm"
          style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <input type="text" placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white outline-none flex-1 placeholder-gray-600" />
        </div>
      </div>

      {/* Table */}
      <div className="dep-animate-fade-up" style={{ animationDelay: "400ms" }}>
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(17,24,39,0.95), rgba(10,15,30,0.9))",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-left py-3.5 px-5 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Usuário</th>
                  <th className="text-right py-3.5 px-5 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Valor</th>
                  <th className="text-left py-3.5 px-5 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Método</th>
                  <th className="text-left py-3.5 px-5 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Status</th>
                  <th className="text-left py-3.5 px-5 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Data</th>
                  <th className="text-center py-3.5 px-5 text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        </div>
                        <span className="text-gray-500 text-xs font-medium">Carregando depósitos...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-8 h-8 text-gray-700" />
                        <span className="text-gray-500 text-sm">Nenhum depósito encontrado.</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(d => (
                  <tr key={d.id} className="transition-colors duration-200 hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-3.5 px-5">
                      <div className="text-white text-xs font-semibold">{d.user_name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{d.email}</div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="text-white font-extrabold tracking-tight">R${fmt(d.amount)}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-gray-400 text-xs uppercase tracking-wide font-medium">{d.method}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      {d.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                          <Clock className="w-3 h-3" />
                          Pendente
                        </span>
                      )}
                      {d.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>
                          <CheckCircle2 className="w-3 h-3" />
                          Aprovado
                        </span>
                      )}
                      {d.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                          <XCircle className="w-3 h-3" />
                          Rejeitado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-gray-400 text-xs">{fmtDate(d.created_at)}</td>
                    <td className="py-3.5 px-5 text-center">
                      {d.status === "pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleAction(d.id, "approved")} disabled={processing === d.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              boxShadow: "0 0 12px rgba(16,185,129,0.3)",
                            }}>
                            Aprovar
                          </button>
                          <button onClick={() => handleAction(d.id, "rejected")} disabled={processing === d.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                            style={{
                              background: "linear-gradient(135deg, #ef4444, #dc2626)",
                              boxShadow: "0 0 12px rgba(239,68,68,0.3)",
                            }}>
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-700">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
