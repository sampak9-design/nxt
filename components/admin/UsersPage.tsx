"use client";

import { useState } from "react";
import { Search, Ban, CheckCircle, Eye, DollarSign } from "lucide-react";
import { USERS, type User } from "./mockData";

function Badge({ status }: { status: User["status"] }) {
  const cfg = {
    active:  { bg: "rgba(34,197,94,0.15)",  color: "#22c55e", label: "Ativo"     },
    banned:  { bg: "rgba(239,68,68,0.15)",  color: "#ef4444", label: "Banido"    },
    pending: { bg: "rgba(249,115,22,0.15)", color: "#f97316", label: "Pendente"  },
  }[status];
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers]   = useState<User[]>(USERS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | User["status"]>("all");
  const [selected, setSelected] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState("");

  const filtered = users.filter((u) => {
    const matchFilter = filter === "all" || u.status === filter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const toggleBan = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const newStatus = user.status === "banned" ? "active" : "banned";

    // Optimistic update
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: newStatus } : u));
    setSelected((s) => s?.id === id ? { ...s, status: newStatus } : s);

  };

  const applyBalance = () => {
    const val = parseFloat(editBalance);
    if (!selected || isNaN(val)) return;

    // Optimistic update
    setUsers((prev) => prev.map((u) => u.id === selected.id ? { ...u, realBalance: val } : u));
    setSelected((s) => s ? { ...s, realBalance: val } : null);
    setEditBalance("");

  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[200px]"
          style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Search className="w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
        </div>
        {(["all", "active", "pending", "banned"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: filter === f ? "rgba(249,115,22,0.15)" : "#161c2c",
              color:      filter === f ? "#f97316" : "#64748b",
              border:     `1px solid ${filter === f ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>
            {{ all: "Todos", active: "Ativos", pending: "Pendentes", banned: "Banidos" }[f]}
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 rounded-xl border overflow-hidden"
          style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Usuário","País","Saldo Real","Depositado","Operações","Win Rate","Status","Ações"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "#f97316" }}>
                        {u.name[0]}
                      </div>
                      <div>
                        <div className="text-white text-xs font-medium">{u.name}</div>
                        <div className="text-gray-500 text-[10px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.country}</td>
                  <td className="px-4 py-3 text-xs text-white font-mono">${u.realBalance.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-green-400 font-mono">${u.totalDeposited.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.totalTrades}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${u.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>
                      {u.winRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3"><Badge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(u)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleBan(u.id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                        style={{ color: u.status === "banned" ? "#22c55e" : "#ef4444" }}>
                        {u.status === "banned" ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 rounded-xl border p-5 flex flex-col gap-4"
            style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">Detalhes</span>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
            </div>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ background: "#f97316" }}>
                {selected.name[0]}
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">{selected.name}</div>
                <div className="text-gray-500 text-xs">{selected.email}</div>
              </div>
              <Badge status={selected.status} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Demo",       `$${selected.demoBalance.toLocaleString()}`],
                ["Real",       `$${selected.realBalance.toLocaleString()}`],
                ["Depositado", `$${selected.totalDeposited.toLocaleString()}`],
                ["Sacado",     `$${selected.totalWithdrawn.toLocaleString()}`],
                ["Trades",     String(selected.totalTrades)],
                ["Win rate",   `${selected.winRate}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg p-2.5 flex flex-col gap-0.5"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-[10px] text-gray-500">{label}</span>
                  <span className="text-xs text-white font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Ajustar saldo real
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Novo saldo"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="flex-1 bg-white/5 border rounded px-2 py-1.5 text-white text-xs focus:outline-none"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                />
                <button onClick={applyBalance}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "#22c55e" }}>
                  OK
                </button>
              </div>
            </div>

            <div className="text-[10px] text-gray-600">
              Cadastro: {selected.createdAt} · País: {selected.country}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
