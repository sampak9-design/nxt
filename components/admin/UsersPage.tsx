"use client";

import { useEffect, useState } from "react";
import { Search, Eye, DollarSign, Users, X, Shield, ShieldOff, UserCircle, Calendar, Hash, Wallet, Coins } from "lucide-react";

type DbUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  real_balance: number;
  demo_balance: number;
  is_marketing: number;
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

      <div className="flex gap-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
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
                    {["Usuário", "Email", "Saldo Real", "Saldo Demo", "Conta Marketing", "Ações"].map((h, i) => (
                      <th key={h} className={`${i === 0 ? "text-left" : i === 5 ? "text-center" : "text-left"} py-3 px-4 text-[10px] text-gray-500 font-semibold uppercase tracking-widest`}
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
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-600 text-sm">Nenhum usuário encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </GlowCard>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 animate-fade-up">
            <GlowCard glow="#f97316">
              <div className="flex flex-col gap-5">
                {/* Panel header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white tracking-tight">Detalhes</span>
                  <button onClick={() => setSelected(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-gray-500 hover:text-white hover:bg-white/5"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Avatar + name */}
                <div className="flex flex-col items-center gap-3 py-3">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white transition-transform duration-200 hover:scale-105"
                    style={{
                      background: selected.is_marketing
                        ? "linear-gradient(135deg, #f97316, #ea580c)"
                        : "linear-gradient(135deg, #334155, #1e293b)",
                      boxShadow: selected.is_marketing
                        ? "0 4px 16px rgba(249,115,22,0.35)"
                        : "0 4px 16px rgba(0,0,0,0.3)",
                    }}>
                    {selected.first_name[0]}
                  </div>
                  <div className="text-center">
                    <div className="text-white font-extrabold text-[15px] tracking-tight">{selected.first_name} {selected.last_name}</div>
                    <div className="text-gray-500 text-[11px] mt-0.5">{selected.email}</div>
                  </div>
                  {selected.is_marketing ? (
                    <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider"
                      style={{ background: "rgba(249,115,22,0.12)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.2)", boxShadow: "0 0 12px rgba(249,115,22,0.08)" }}>
                      Conta Marketing
                    </span>
                  ) : (
                    <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }}>
                      Conta Normal
                    </span>
                  )}
                </div>

                {/* Balance info cards */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Saldo Real", value: `R$ ${selected.real_balance.toFixed(2)}`, icon: <Wallet className="w-3 h-3" />, color: "#10b981" },
                    { label: "Saldo Demo", value: `R$ ${selected.demo_balance.toFixed(2)}`, icon: <Coins className="w-3 h-3" />, color: "#6366f1" },
                    { label: "ID", value: String(selected.id), icon: <Hash className="w-3 h-3" />, color: "#f97316" },
                    { label: "Criado", value: selected.created_at.slice(0, 10), icon: <Calendar className="w-3 h-3" />, color: "#3b82f6" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl p-3 flex flex-col gap-1.5 transition-all duration-200 hover:translate-y-[-1px]"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}08, ${item.color}03)`,
                        border: `1px solid ${item.color}12`,
                      }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ background: `${item.color}18`, color: item.color, boxShadow: `0 0 8px ${item.color}10` }}>
                          {item.icon}
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-[13px] text-white font-extrabold tracking-tight">{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Marketing toggle */}
                <button
                  onClick={() => toggleMarketing(selected)}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    background: selected.is_marketing
                      ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))"
                      : "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.06))",
                    color: selected.is_marketing ? "#f87171" : "#fb923c",
                    border: `1px solid ${selected.is_marketing ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.2)"}`,
                    boxShadow: `0 0 12px ${selected.is_marketing ? "rgba(239,68,68,0.08)" : "rgba(249,115,22,0.08)"}`,
                  }}
                >
                  {selected.is_marketing ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {selected.is_marketing ? "Remover Conta Marketing" : "Ativar Conta Marketing"}
                </button>

                {/* Balance adjustment */}
                <div className="flex flex-col gap-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "16px" }}>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                    <DollarSign className="w-3 h-3" /> Ajustar saldo real
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Novo saldo"
                      value={editBalance}
                      onChange={e => setEditBalance(e.target.value)}
                      className="flex-1 rounded-xl px-3 py-2 text-white text-xs font-medium outline-none transition-all focus:border-gray-600 placeholder:text-gray-600"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    />
                    <button onClick={applyBalance} disabled={saving}
                      className="px-4 py-2 rounded-xl text-[11px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 uppercase tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, rgba(16,185,129,0.8), rgba(5,150,105,0.8))",
                        border: "1px solid rgba(16,185,129,0.3)",
                        boxShadow: "0 0 12px rgba(16,185,129,0.15)",
                      }}>
                      OK
                    </button>
                  </div>
                </div>

                {/* Footer info */}
                <div className="text-[10px] text-gray-600 flex items-center gap-1.5 pt-1"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <UserCircle className="w-3 h-3" />
                  ID: {selected.id} · {selected.email}
                </div>
              </div>
            </GlowCard>
          </div>
        )}
      </div>
    </div>
  );
}
