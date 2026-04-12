"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Pencil, Ban, Unlock, Trash2, DollarSign, Users, UserPlus, TrendingUp, X, Shield, ShieldOff, UserCircle, Calendar, Hash, Wallet, Coins } from "lucide-react";

type DbUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  real_balance: number;
  demo_balance: number;
  is_marketing: number;
  is_blocked: number;
  created_at: string;
};

function GlowCard({ children, glow, className = "" }: { children: React.ReactNode; glow?: string; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      {glow && (
        <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
          style={{ background: `linear-gradient(135deg, ${glow}40, transparent, ${glow}20)` }} />
      )}
      <div className="relative rounded-2xl p-5 h-full backdrop-blur-sm overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}>
        {children}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers]       = useState<DbUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<DbUser | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const patch = async (id: number, body: object) => {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (d.user) {
      setUsers(prev => prev.map(u => u.id === id ? d.user : u));
      setSelected(s => s?.id === id ? d.user : s);
    }
    setSaving(false);
  };

  const toggleMarketing = (u: DbUser) => patch(u.id, { is_marketing: u.is_marketing ? 0 : 1 });

  const applyBalance = () => {
    const val = parseFloat(editBalance);
    if (!selected || isNaN(val)) return;
    patch(selected.id, { real_balance: val });
    setEditBalance("");
  };

  return (
    <div className="flex flex-col gap-5 max-w-[1400px]">
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.5s ease-out forwards; opacity: 0; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))", boxShadow: "0 0 20px rgba(249,115,22,0.1)" }}>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Usuários</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">Gerenciamento de contas e saldos</p>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold ml-1"
            style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}>
            {users.length}
          </span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all focus-within:border-gray-600"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 text-gray-600" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuário..."
            className="bg-transparent text-xs text-white outline-none w-56 placeholder:text-gray-600" />
        </div>
      </div>

      {/* Stat cards */}
      {(() => {
        const now = Date.now();
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        const d7 = now - 7 * 86400000;
        const d30 = now - 30 * 86400000;
        const toMs = (d: string) => new Date(d).getTime();
        const today = users.filter(u => toMs(u.created_at) >= todayStart.getTime()).length;
        const week = users.filter(u => toMs(u.created_at) >= d7).length;
        const month = users.filter(u => toMs(u.created_at) >= d30).length;
        const cards = [
          { label: "Total de Usuários", value: users.length, color: "#f97316", icon: <Users className="w-5 h-5" /> },
          { label: "Cadastros Hoje", value: today, color: "#f97316", icon: <UserPlus className="w-5 h-5" /> },
          { label: "Novos (7 dias)", value: week, color: "#22c55e", icon: <UserPlus className="w-5 h-5" /> },
          { label: "Novos (30 dias)", value: month, color: "#3b82f6", icon: <TrendingUp className="w-5 h-5" /> },
        ];
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: "80ms" }}>
            {cards.map((c, i) => (
              <div key={c.label} className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                  style={{ background: `linear-gradient(135deg, ${c.color}30, transparent 60%, ${c.color}15)`, filter: "blur(1px)" }} />
                <div className="relative rounded-2xl p-4 h-full overflow-hidden transition-transform duration-300 group-hover:translate-y-[-2px]"
                  style={{ background: "linear-gradient(145deg, rgba(17,24,39,0.95), rgba(10,15,30,0.9))", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                  <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.04]"
                    style={{ background: `radial-gradient(circle, ${c.color}, transparent)`, transform: "translate(30%, -30%)" }} />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${c.color}20, ${c.color}10)`, boxShadow: `0 0 16px ${c.color}15` }}>
                      <span style={{ color: c.color }}>{c.icon}</span>
                    </div>
                    <div>
                      <div className="text-[11px] text-gray-500 font-medium">{c.label}</div>
                      <div className="text-xl font-extrabold text-white tracking-tight">{c.value}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      <div className="flex gap-4 animate-fade-up" style={{ animationDelay: "160ms" }}>
        {/* Table */}
        <GlowCard glow="#3b82f6" className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                </div>
                <span className="text-gray-500 text-xs font-medium">Carregando...</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    {["Usuário", "Email", "Saldo Real", "Saldo Demo", "Conta Marketing", "Status", "Ações"].map((h, i) => (
                      <th key={h} className={`${i === 0 ? "text-left" : i === 6 ? "text-center" : "text-left"} py-3 px-4 text-[10px] text-gray-500 font-semibold uppercase tracking-widest`}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                            style={{
                              background: u.is_marketing
                                ? "linear-gradient(135deg, #f97316, #ea580c)"
                                : "linear-gradient(135deg, #334155, #1e293b)",
                              boxShadow: u.is_marketing
                                ? "0 2px 8px rgba(249,115,22,0.3)"
                                : "0 2px 8px rgba(0,0,0,0.2)",
                            }}>
                            {u.first_name[0]}
                          </div>
                          <span className="text-white font-semibold text-[13px]">{u.first_name} {u.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-gray-400">{u.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[13px] text-white font-extrabold font-mono tracking-tight">R$ {u.real_balance.toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[12px] text-gray-400 font-mono">R$ {u.demo_balance.toFixed(2)}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleMarketing(u)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all hover:opacity-80 disabled:opacity-40 uppercase tracking-wide"
                          style={u.is_marketing
                            ? {
                                background: "rgba(249,115,22,0.15)",
                                color: "#fb923c",
                                border: "1px solid rgba(249,115,22,0.25)",
                                boxShadow: "0 0 12px rgba(249,115,22,0.08)",
                              }
                            : {
                                background: "rgba(255,255,255,0.03)",
                                color: "#64748b",
                                border: "1px solid rgba(255,255,255,0.06)",
                                boxShadow: "0 0 12px rgba(255,255,255,0.02)",
                              }
                          }
                        >
                          {u.is_marketing ? "Marketing" : "+ Marketing"}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={u.is_blocked
                            ? { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }
                            : { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
                          }>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_blocked ? "bg-red-400" : "bg-green-400"}`} />
                          {u.is_blocked ? "Bloqueado" : "Ativo"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button onClick={() => setSelected(u)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-gray-500 hover:text-white hover:scale-110"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            boxShadow: "0 0 12px rgba(99,102,241,0.05)",
                          }}>
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-600 text-sm">Nenhum usuário encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlowCard>

        {/* User detail modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-up"
              style={{ background: "linear-gradient(135deg, rgba(17,24,39,0.98), rgba(10,15,30,0.95))", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>

              {/* Header */}
              <div className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-extrabold text-white"
                  style={{
                    background: selected.is_marketing ? "linear-gradient(135deg, #f97316, #ea580c)" : "linear-gradient(135deg, #334155, #1e293b)",
                    boxShadow: selected.is_marketing ? "0 4px 16px rgba(249,115,22,0.3)" : "0 4px 16px rgba(0,0,0,0.3)",
                  }}>
                  {selected.first_name[0]}
                </div>
                <div className="flex-1">
                  <div className="text-white font-extrabold text-lg tracking-tight">{selected.first_name} {selected.last_name}</div>
                  <div className="text-gray-500 text-xs">{selected.email} · ID: {selected.id}</div>
                </div>
                <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase"
                  style={selected.is_marketing
                    ? { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }
                    : { background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }
                  }>
                  {selected.is_marketing ? "Fake" : "Usuário"}
                </span>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                  style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Info cards */}
              <div className="grid grid-cols-4 gap-3 px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "Saldo Real", value: `R$ ${selected.real_balance.toFixed(2)}`, color: "#10b981", icon: <Wallet className="w-4 h-4" /> },
                  { label: "Saldo Demo", value: `R$ ${selected.demo_balance.toFixed(2)}`, color: "#6366f1", icon: <Coins className="w-4 h-4" /> },
                  { label: "ID", value: String(selected.id), color: "#f97316", icon: <Hash className="w-4 h-4" /> },
                  { label: "Criado em", value: selected.created_at.slice(0, 10), color: "#3b82f6", icon: <Calendar className="w-4 h-4" /> },
                ].map(c => (
                  <div key={c.label} className="rounded-xl p-3"
                    style={{ background: `${c.color}08`, border: `1px solid ${c.color}12` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span style={{ color: c.color }}>{c.icon}</span>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{c.label}</span>
                    </div>
                    <div className="text-[15px] text-white font-extrabold tracking-tight">{c.value}</div>
                  </div>
                ))}
              </div>

              {/* Balance adjustment */}
              <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Ajustar saldo real:
                </span>
                <input type="number" placeholder="Novo valor" value={editBalance} onChange={e => setEditBalance(e.target.value)}
                  className="w-40 rounded-lg px-3 py-2 text-white text-xs outline-none transition-all placeholder:text-gray-600"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => e.target.style.borderColor = "rgba(249,115,22,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
                <button onClick={applyBalance} disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 12px rgba(16,185,129,0.2)" }}>
                  Aplicar
                </button>
              </div>

              {/* Actions */}
              <div className="px-6 py-5 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mr-2">Ações:</span>

                {/* Visualizar */}
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-[1px]"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}
                  title="Visualizar">
                  <Eye className="w-4 h-4" /> Visualizar
                </button>

                {/* Editar */}
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-[1px]"
                  style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)" }}
                  title="Editar">
                  <Pencil className="w-4 h-4" /> Editar
                </button>

                {/* Marketing toggle */}
                <button onClick={() => toggleMarketing(selected)} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-[1px] disabled:opacity-50"
                  style={selected.is_marketing
                    ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
                    : { background: "rgba(168,85,247,0.1)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.2)" }
                  }
                  title={selected.is_marketing ? "Tornar Usuário" : "Tornar Fake"}>
                  {selected.is_marketing ? <Unlock className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  {selected.is_marketing ? "Tornar Usuário" : "Tornar Fake"}
                </button>

                {/* Bloquear */}
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-[1px]"
                  style={{ background: "rgba(234,179,8,0.1)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)" }}
                  title="Bloquear">
                  <Ban className="w-4 h-4" /> Bloquear
                </button>

                {/* Deletar */}
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:-translate-y-[1px]"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                  title="Deletar">
                  <Trash2 className="w-4 h-4" /> Deletar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
