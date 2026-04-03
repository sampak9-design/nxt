"use client";

import { useEffect, useState } from "react";
import { Search, Eye, DollarSign, Star, StarOff } from "lucide-react";

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
    <div className="flex flex-col gap-4">
      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg max-w-sm"
        style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Search className="w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar usuário..."
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none" />
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 rounded-xl border overflow-hidden"
          style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Carregando...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Usuário", "Email", "Saldo Real", "Saldo Demo", "Marketing", "Ações"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: u.is_marketing ? "#f97316" : "#334155" }}>
                          {u.first_name[0]}
                        </div>
                        <span className="text-white text-xs font-medium">{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-white font-mono">R$ {u.real_balance.toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">R$ {u.demo_balance.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {u.is_marketing ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>
                          Marketing
                        </span>
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(u)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-gray-400 hover:text-white">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleMarketing(u)}
                          title={u.is_marketing ? "Remover conta marketing" : "Marcar como conta marketing"}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
                          style={{ color: u.is_marketing ? "#f97316" : "#64748b" }}>
                          {u.is_marketing ? <Star className="w-3.5 h-3.5" fill="#f97316" /> : <StarOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">Nenhum usuário encontrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 rounded-xl border p-5 flex flex-col gap-4"
            style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">Detalhes</span>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
            </div>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                style={{ background: selected.is_marketing ? "#f97316" : "#334155" }}>
                {selected.first_name[0]}
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">{selected.first_name} {selected.last_name}</div>
                <div className="text-gray-500 text-xs">{selected.email}</div>
              </div>
              {selected.is_marketing ? (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>
                  Conta Marketing
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
                  Conta Normal
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Demo",    `R$ ${selected.demo_balance.toFixed(2)}`],
                ["Real",    `R$ ${selected.real_balance.toFixed(2)}`],
                ["ID",      String(selected.id)],
                ["Criado",  selected.created_at.slice(0, 10)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg p-2.5 flex flex-col gap-0.5"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <span className="text-[10px] text-gray-500">{label}</span>
                  <span className="text-xs text-white font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Marketing toggle */}
            <button
              onClick={() => toggleMarketing(selected)}
              disabled={saving}
              className="w-full py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background: selected.is_marketing ? "rgba(239,68,68,0.15)" : "rgba(249,115,22,0.15)",
                color:      selected.is_marketing ? "#ef4444" : "#f97316",
                border:     `1px solid ${selected.is_marketing ? "rgba(239,68,68,0.3)" : "rgba(249,115,22,0.3)"}`,
              }}
            >
              {selected.is_marketing ? "Remover Conta Marketing" : "Ativar Conta Marketing"}
            </button>

            {/* Balance adjustment */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Ajustar saldo real
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Novo saldo"
                  value={editBalance}
                  onChange={e => setEditBalance(e.target.value)}
                  className="flex-1 bg-white/5 border rounded px-2 py-1.5 text-white text-xs focus:outline-none"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                />
                <button onClick={applyBalance} disabled={saving}
                  className="px-3 py-1.5 rounded text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#22c55e" }}>
                  OK
                </button>
              </div>
            </div>

            <div className="text-[10px] text-gray-600">
              ID: {selected.id} · {selected.email}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
