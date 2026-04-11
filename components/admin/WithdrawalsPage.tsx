"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Search, ArrowDownRight, Banknote, ShieldX, Loader2 } from "lucide-react";

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

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Rejeitados" },
] as const;

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

  const counts = {
    pending:  withdrawals.filter(w => w.status === "pending").length,
    approved: withdrawals.filter(w => w.status === "approved").length,
    rejected: withdrawals.filter(w => w.status === "rejected").length,
  };

  const totals = {
    pending:  withdrawals.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0),
    approved: withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + w.amount, 0),
    rejected: withdrawals.filter(w => w.status === "rejected").reduce((s, w) => s + w.amount, 0),
  };

  const summaryCards = [
    { label: "Pendentes", value: totals.pending, count: counts.pending, color: "#f97316", icon: <Clock className="w-4 h-4" /> },
    { label: "Aprovados", value: totals.approved, count: counts.approved, color: "#10b981", icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: "Rejeitados", value: totals.rejected, count: counts.rejected, color: "#ef4444", icon: <ShieldX className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.5s ease-out forwards; opacity: 0; }
      `}</style>

      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Saques</h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>
            <ArrowDownRight className="w-3 h-3" />
            {withdrawals.length}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">Gerenciar solicitacoes de saque</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryCards.map((card, i) => (
          <div key={card.label} className="relative group animate-fade-up" style={{ animationDelay: `${(i + 1) * 80}ms` }}>
            {/* Glow on hover */}
            <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
              style={{ background: `linear-gradient(135deg, ${card.color}30, transparent 60%, ${card.color}15)`, filter: "blur(1px)" }} />
            <div className="relative rounded-2xl p-4 h-full overflow-hidden transition-transform duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: "linear-gradient(145deg, rgba(17,24,39,0.95), rgba(10,15,30,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}>
              {/* Subtle radial accent */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04]"
                style={{ background: `radial-gradient(circle, ${card.color}, transparent)`, transform: "translate(30%, -30%)" }} />

              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</span>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${card.color}20, ${card.color}10)`, boxShadow: `0 0 20px ${card.color}15` }}>
                  <span style={{ color: card.color }}>{card.icon}</span>
                </div>
              </div>
              <div className="flex items-end gap-2.5">
                <span className="text-[22px] font-extrabold text-white leading-none tracking-tight">R${fmt(card.value)}</span>
              </div>
              <span className="text-[10px] text-gray-600 mt-1.5 block">{card.count} saques</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: "320ms" }}>
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
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl flex-1 max-w-xs transition-all focus-within:border-gray-600"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 text-gray-600" />
          <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-xs text-white outline-none flex-1 placeholder:text-gray-600" />
        </div>
      </div>

      {/* Table */}
      <div className="relative group animate-fade-up" style={{ animationDelay: "400ms" }}>
        {/* Glow */}
        <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.06), transparent, rgba(249,115,22,0.03))" }} />
        <div className="relative rounded-2xl overflow-hidden backdrop-blur-sm"
          style={{
            background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 850 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {[
                    { label: "Usuario", align: "left" },
                    { label: "Valor", align: "right" },
                    { label: "Chave PIX", align: "left" },
                    { label: "Nome / CPF", align: "left" },
                    { label: "Status", align: "left" },
                    { label: "Data", align: "left" },
                    { label: "Acoes", align: "center" },
                  ].map(h => (
                    <th key={h.label}
                      className={`text-${h.align} py-3.5 px-4 text-[10px] text-gray-500 font-semibold uppercase tracking-widest`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
                          <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                        </div>
                        <span className="text-gray-500 text-xs font-medium">Carregando saques...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2">
                        <Banknote className="w-8 h-8 text-gray-700" />
                        <span className="text-gray-500 text-sm">Nenhum saque encontrado.</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((w, idx) => (
                  <tr key={w.id}
                    className="hover:bg-white/[0.02] transition-colors group/row"
                    style={{ borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0 transition-transform duration-200 group-hover/row:scale-105"
                          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 2px 8px rgba(249,115,22,0.3)" }}>
                          {(w.user_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-[13px]">{w.user_name}</div>
                          <div className="text-[10px] text-gray-500">{w.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-white font-extrabold text-[14px] tracking-tight">R${fmt(w.amount)}</span>
                    </td>
                    {/* Pix Key */}
                    <td className="py-3.5 px-4">
                      <span className="text-gray-400 text-xs font-mono px-2 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.03)" }}>
                        {w.pix_key || "\u2014"}
                      </span>
                    </td>
                    {/* Name / CPF */}
                    <td className="py-3.5 px-4">
                      <div className="text-[13px] text-gray-300 font-medium">{w.name || "\u2014"}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{w.cpf || ""}</div>
                    </td>
                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const cfg = w.status === "approved"
                          ? { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", color: "#10b981", icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: "Aprovado" }
                          : w.status === "rejected"
                          ? { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", color: "#ef4444", icon: <XCircle className="w-3.5 h-3.5" />, text: "Rejeitado" }
                          : { bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)", color: "#f97316", icon: <Clock className="w-3.5 h-3.5" />, text: "Pendente" };
                        return (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                            {cfg.icon}
                            {cfg.text}
                          </span>
                        );
                      })()}
                    </td>
                    {/* Date */}
                    <td className="py-3.5 px-4 text-gray-400 text-xs font-medium">{fmtDate(w.created_at)}</td>
                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      {w.status === "pending" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleAction(w.id, "approved")} disabled={processing === w.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg disabled:opacity-50"
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                              boxShadow: "0 2px 12px rgba(16,185,129,0.3)",
                            }}>
                            {processing === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aprovar"}
                          </button>
                          <button onClick={() => handleAction(w.id, "rejected")} disabled={processing === w.id}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg disabled:opacity-50"
                            style={{
                              background: "linear-gradient(135deg, #ef4444, #dc2626)",
                              boxShadow: "0 2px 12px rgba(239,68,68,0.3)",
                            }}>
                            {processing === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Rejeitar"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-600">\u2014</span>
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
