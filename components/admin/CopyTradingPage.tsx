"use client";

import { useEffect, useState, useRef } from "react";
import { Copy, Search, Plus, Pencil, Eye, Trash2, X, Users, Activity, LayoutGrid, CheckCircle2, XCircle, Clock } from "lucide-react";

type Room = {
  id: number;
  name: string;
  description: string;
  trader_id: number;
  trader_name: string;
  price: number;
  max_pct: number;
  is_active: boolean;
  followers: number;
  pending_followers: number;
  total_trades: number;
  wins: number;
  created_at: string;
};

type Trader = { id: number; name: string; email: string };

const glowCard: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

const cssAnimations = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.4s ease-out both; }
  .fade-up-d1 { animation-delay: 0.05s; }
  .fade-up-d2 { animation-delay: 0.1s; }
  .fade-up-d3 { animation-delay: 0.15s; }
  .ct-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.08); outline: none; transition: background 0.2s; }
  .ct-slider:hover { background: rgba(255,255,255,0.12); }
  .ct-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 0 10px rgba(249,115,22,0.4); cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
  .ct-slider::-webkit-slider-thumb:hover { transform: scale(1.15); box-shadow: 0 0 16px rgba(249,115,22,0.6); }
  .ct-slider::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); box-shadow: 0 0 10px rgba(249,115,22,0.4); cursor: pointer; border: none; }
`;

export default function CopyTradingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTraderId, setFormTraderId] = useState<number>(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formMaxPct, setFormMaxPct] = useState(50);
  const [submitting, setSubmitting] = useState(false);

  // Followers modal
  type Follower = { id: number; user_id: number; user_name: string; email: string; status: string; followed_at: number };
  const [followersOpen, setFollowersOpen] = useState(false);
  const [followersRoom, setFollowersRoom] = useState<Room | null>(null);
  const [followersList, setFollowersList] = useState<Follower[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  const openFollowers = async (room: Room) => {
    setFollowersRoom(room);
    setFollowersOpen(true);
    setLoadingFollowers(true);
    const r = await fetch("/api/admin/copy-trading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "followers", roomId: room.id }) });
    const d = await r.json();
    setFollowersList(d.followers ?? []);
    setLoadingFollowers(false);
  };

  const handleFollowerAction = async (followerId: number, action: "approve_follower" | "reject_follower") => {
    await fetch("/api/admin/copy-trading", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, followerId }) });
    if (followersRoom) openFollowers(followersRoom);
    loadRooms();
  };

  const loadRooms = () => {
    fetch("/api/admin/copy-trading")
      .then((r) => r.json())
      .then((d) => { if (d.rooms) setRooms(d.rooms); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadTraders = () => {
    fetch("/api/admin/copy-trading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "traders" }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.traders) setTraders(d.traders); })
      .catch(() => {});
  };

  useEffect(() => {
    loadRooms();
    loadTraders();
  }, []);

  const apiPost = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/copy-trading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleToggle = async (id: number) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r)));
    await apiPost({ action: "toggle", id });
    loadRooms();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta sala?")) return;
    await apiPost({ action: "delete", id });
    loadRooms();
  };

  const openCreate = () => {
    setModalMode("create");
    setEditId(null);
    setFormName("");
    setFormDesc("");
    setFormTraderId(traders[0]?.id ?? 0);
    setFormPrice(0);
    setFormMaxPct(50);
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setModalMode("edit");
    setEditId(room.id);
    setFormName(room.name);
    setFormDesc(room.description);
    setFormTraderId(room.trader_id);
    setFormPrice(room.price);
    setFormMaxPct(room.max_pct);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        await apiPost({ action: "create", name: formName, description: formDesc, trader_id: formTraderId, price: formPrice, max_pct: formMaxPct });
      } else {
        await apiPost({ action: "update", id: editId, name: formName, description: formDesc, price: formPrice, max_pct: formMaxPct });
      }
      setModalOpen(false);
      loadRooms();
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.trader_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalRooms = rooms.length;
  const activeRooms = rooms.filter((r) => r.is_active).length;
  const totalFollowers = rooms.reduce((s, r) => s + r.followers, 0);

  const summaryCards = [
    { label: "Total de Salas", value: totalRooms, icon: <LayoutGrid className="w-5 h-5" />, color: "#f97316" },
    { label: "Salas Ativas", value: activeRooms, icon: <Activity className="w-5 h-5" />, color: "#22c55e" },
    { label: "Total de Seguidores", value: totalFollowers, icon: <Users className="w-5 h-5" />, color: "#3b82f6" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <style dangerouslySetInnerHTML={{ __html: cssAnimations }} />

      {/* Page title */}
      <div className="fade-up">
        <div className="flex items-center gap-2.5 mb-1">
          <Copy className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Copy Trading</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 ml-8">
          Gerenciar salas de copy trading
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 fade-up fade-up-d1">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl p-5" style={glowCard}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `${card.color}15`,
                  boxShadow: `0 0 16px ${card.color}20`,
                }}
              >
                <span style={{ color: card.color }}>{card.icon}</span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{card.label}</div>
                <div className="text-2xl font-extrabold text-white" style={{ textShadow: `0 0 10px ${card.color}30` }}>
                  {card.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Create */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 fade-up fade-up-d2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar sala ou trader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-orange-500/50"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-[1px]"
          style={{
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
          }}
        >
          <Plus className="w-4 h-4" />
          Nova Sala
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden fade-up fade-up-d3" style={glowCard}>
        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">Nenhuma sala encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Sala</th>
                  <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Trader</th>
                  <th className="text-center py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Preço</th>
                  <th className="text-center py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Win Rate</th>
                  <th className="text-center py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Trades</th>
                  <th className="text-center py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Seguidores</th>
                  <th className="text-center py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((room) => {
                  const winRate = room.total_trades > 0 ? ((room.wins / room.total_trades) * 100).toFixed(1) : "0.0";
                  return (
                    <tr
                      key={room.id}
                      className="transition-colors duration-200 hover:bg-white/[0.02]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    >
                      {/* Sala */}
                      <td className="py-3 px-4">
                        <div className="text-white font-extrabold text-[13px]">{room.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 max-w-[200px] truncate">{room.description}</div>
                      </td>
                      {/* Trader */}
                      <td className="py-3 px-4 text-gray-300 font-medium">{room.trader_name}</td>
                      {/* Preço */}
                      <td className="py-3 px-4 text-center">
                        {room.price === 0 ? (
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
                          >
                            Grátis
                          </span>
                        ) : (
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}
                          >
                            R$ {room.price.toFixed(2)}
                          </span>
                        )}
                      </td>
                      {/* Win Rate */}
                      <td className="py-3 px-4 text-center font-extrabold" style={{ color: parseFloat(winRate) >= 50 ? "#22c55e" : "#ef4444" }}>
                        {winRate}%
                      </td>
                      {/* Trades */}
                      <td className="py-3 px-4 text-center text-gray-300 font-medium">
                        <span className="text-emerald-400 font-bold">{room.wins}</span>
                        <span className="text-gray-500">/{room.total_trades}</span>
                      </td>
                      {/* Seguidores */}
                      <td className="py-3 px-4 text-center text-white font-extrabold">{room.followers}</td>
                      {/* Status toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggle(room.id)}
                          className="relative inline-flex items-center h-6 w-11 rounded-full transition-all duration-300"
                          style={{
                            background: room.is_active
                              ? "linear-gradient(135deg, #22c55e, #16a34a)"
                              : "rgba(255,255,255,0.1)",
                            boxShadow: room.is_active ? "0 0 12px rgba(34,197,94,0.3)" : "none",
                          }}
                        >
                          <span
                            className="inline-block w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300"
                            style={{ transform: room.is_active ? "translateX(22px)" : "translateX(4px)" }}
                          />
                        </button>
                      </td>
                      {/* Ações */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEdit(room)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400 hover:text-orange-400"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openFollowers(room)}
                            className="relative w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400 hover:text-blue-400"
                            title="Seguidores"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {room.pending_followers > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-bold text-white">{room.pending_followers}</span>
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(room.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors text-gray-400 hover:text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.6)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 fade-up"
            style={{
              ...glowCard,
              background: "linear-gradient(135deg, rgba(17,24,39,0.97), rgba(17,24,39,0.93))",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-extrabold text-white">
                {modalMode === "create" ? "Nova Sala" : "Editar Sala"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4">
              {/* Name */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome da sala"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-orange-500/50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">Descrição</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Descrição da sala"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-orange-500/50 resize-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
              </div>

              {/* Trader dropdown (only on create) */}
              {modalMode === "create" && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">Trader</label>
                  <select
                    value={formTraderId}
                    onChange={(e) => setFormTraderId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-orange-500/50"
                    style={{ background: "rgba(17,24,39,0.95)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <option value={0} disabled>Selecione um trader</option>
                    {traders.map((t) => (
                      <option key={t.id} value={t.id} style={{ background: "#111827" }}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-1.5 block">Preço (R$)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={formPrice}
                  onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0 para grátis"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-orange-500/50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
              </div>

              {/* Max pct slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Percentual Máximo</label>
                  <span className="text-sm font-extrabold font-mono text-white" style={{ textShadow: "0 0 8px rgba(249,115,22,0.3)" }}>
                    {formMaxPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={formMaxPct}
                  onChange={(e) => setFormMaxPct(parseInt(e.target.value))}
                  className="ct-slider"
                />
                <div className="text-[10px] uppercase tracking-widest text-gray-600 mt-1.5">
                  Percentual máximo do saldo para copiar
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !formName.trim() || (modalMode === "create" && formTraderId === 0)}
                className="mt-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
                }}
              >
                {submitting ? "Salvando..." : modalMode === "create" ? "Criar Sala" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers modal */}
      {followersOpen && followersRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(17,24,39,0.98), rgba(10,15,30,0.95))", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <h3 className="text-white font-bold text-sm">Seguidores — {followersRoom.name}</h3>
                <p className="text-[11px] text-gray-500">Aprovar ou rejeitar solicitações</p>
              </div>
              <button onClick={() => setFollowersOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loadingFollowers ? (
                <div className="py-10 text-center text-gray-500 text-sm">Carregando...</div>
              ) : followersList.length === 0 ? (
                <div className="py-10 text-center text-gray-600 text-sm">Nenhum seguidor</div>
              ) : (
                followersList.map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-6 py-3 hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: "linear-gradient(135deg, #334155, #1e293b)" }}>
                      {f.user_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-white font-semibold truncate">{f.user_name}</div>
                      <div className="text-[10px] text-gray-500">{f.email}</div>
                    </div>
                    {f.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.1)", color: "#fb923c" }}>
                          <Clock className="w-3 h-3 inline mr-0.5" />Pendente
                        </span>
                        <button onClick={() => handleFollowerAction(f.id, "approve_follower")}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-green-500/20 text-green-400"
                          title="Aprovar">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleFollowerAction(f.id, "reject_follower")}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/20 text-red-400"
                          title="Rejeitar">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : f.status === "active" ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>
                        <CheckCircle2 className="w-3 h-3 inline mr-0.5" />Aprovado
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(107,114,128,0.1)", color: "#9ca3af" }}>
                        Cancelado
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
