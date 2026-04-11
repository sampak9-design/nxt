"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageSquare, Search, Send, X, ArrowLeft, RefreshCw,
  Clock, CheckCircle2, XCircle, MailOpen,
} from "lucide-react";

/* ---------- types ---------- */
type TicketStatus = "open" | "answered" | "closed";

type Ticket = {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  subject: string;
  status: TicketStatus;
  last_message: string;
  created_at: number;
  updated_at: number;
};

type Message = {
  id: number;
  ticket_id: number;
  sender: "user" | "admin";
  message: string;
  created_at: number;
};

/* ---------- helpers ---------- */
function fmtDate(ms: number) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

/* ---------- style constants ---------- */
const glowCard: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  borderRadius: 14,
};

const STATUS_META: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  open:     { label: "Aberto",     color: "#f97316", bg: "rgba(249,115,22,0.15)", icon: <Clock className="w-3.5 h-3.5" /> },
  answered: { label: "Respondido", color: "#10b981", bg: "rgba(16,185,129,0.15)", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  closed:   { label: "Fechado",    color: "#6b7280", bg: "rgba(107,114,128,0.15)", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const FILTERS = [
  { key: "all" as const, label: "Todos" },
  { key: "open" as const, label: "Abertos" },
  { key: "answered" as const, label: "Respondidos" },
  { key: "closed" as const, label: "Fechados" },
];

/* ========== COMPONENT ========== */
export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | TicketStatus>("all");
  const [search, setSearch] = useState("");

  // chat view
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  /* ---- load tickets ---- */
  const loadTickets = () => {
    fetch("/api/admin/tickets")
      .then((r) => r.json())
      .then((d) => { setTickets(d.tickets ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
    const iv = setInterval(loadTickets, 10000);
    return () => clearInterval(iv);
  }, []);

  /* ---- load messages ---- */
  const openTicket = async (t: Ticket) => {
    setActiveTicket(t);
    setMsgLoading(true);
    setMessages([]);
    try {
      const r = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "messages", ticketId: t.id }),
      });
      const d = await r.json();
      setMessages(d.messages ?? []);
    } catch { /* ignore */ }
    setMsgLoading(false);
  };

  useEffect(() => {
    if (chatEnd.current) chatEnd.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- send reply ---- */
  const sendReply = async () => {
    if (!reply.trim() || !activeTicket) return;
    setSending(true);
    try {
      await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reply", ticketId: activeTicket.id, message: reply.trim() }),
      });
      setReply("");
      await openTicket(activeTicket);
      loadTickets();
    } catch { /* ignore */ }
    setSending(false);
  };

  /* ---- close / reopen ---- */
  const changeStatus = async (action: "close" | "reopen") => {
    if (!activeTicket) return;
    await fetch("/api/admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ticketId: activeTicket.id }),
    });
    const updated = { ...activeTicket, status: action === "close" ? "closed" as const : "open" as const };
    setActiveTicket(updated);
    loadTickets();
  };

  /* ---- derived ---- */
  const counts = {
    open:     tickets.filter((t) => t.status === "open").length,
    answered: tickets.filter((t) => t.status === "answered").length,
    closed:   tickets.filter((t) => t.status === "closed").length,
    total:    tickets.length,
  };

  const filtered = tickets
    .filter((t) => filter === "all" || t.status === filter)
    .filter((t) => !search || t.user_name?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase()));

  /* ---- summary cards ---- */
  const summaryCards = [
    { label: "Abertos",     value: counts.open,     color: "#f97316", icon: <Clock className="w-5 h-5" /> },
    { label: "Respondidos", value: counts.answered,  color: "#10b981", icon: <CheckCircle2 className="w-5 h-5" /> },
    { label: "Fechados",    value: counts.closed,    color: "#6b7280", icon: <XCircle className="w-5 h-5" /> },
    { label: "Total",       value: counts.total,     color: "#3b82f6", icon: <MessageSquare className="w-5 h-5" /> },
  ];

  /* ========== CHAT VIEW ========== */
  if (activeTicket) {
    const sm = STATUS_META[activeTicket.status];
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        {/* header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTicket(null)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{activeTicket.subject}</h2>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: sm.bg, color: sm.color }}
              >
                {sm.icon} {sm.label}
              </span>
            </div>
            <p className="text-xs text-gray-500">{activeTicket.user_name} &middot; {activeTicket.email}</p>
          </div>
          <div className="flex gap-2">
            {activeTicket.status !== "closed" ? (
              <button
                onClick={() => changeStatus("close")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-colors"
                style={{ background: "rgba(107,114,128,0.2)", border: "1px solid rgba(107,114,128,0.3)" }}
              >
                Fechar Ticket
              </button>
            ) : (
              <button
                onClick={() => changeStatus("reopen")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316" }}
              >
                Reabrir Ticket
              </button>
            )}
          </div>
        </div>

        {/* messages area */}
        <div style={glowCard} className="flex flex-col" >
          <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ maxHeight: "calc(100vh - 340px)", minHeight: 300 }}>
            {msgLoading && <p className="text-center text-gray-500 text-sm py-8">Carregando...</p>}
            {!msgLoading && messages.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">Nenhuma mensagem ainda.</p>
            )}
            {messages.map((m) => {
              const isAdmin = m.sender === "admin";
              return (
                <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[70%] rounded-2xl px-4 py-2.5"
                    style={{
                      background: isAdmin
                        ? "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(234,88,12,0.15))"
                        : "rgba(255,255,255,0.05)",
                      border: isAdmin
                        ? "1px solid rgba(249,115,22,0.3)"
                        : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <p className="text-[13px] text-gray-200 whitespace-pre-wrap">{m.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: isAdmin ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.3)" }}>
                      {isAdmin ? "Admin" : activeTicket.user_name} &middot; {fmtDate(m.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEnd} />
          </div>

          {/* input */}
          {activeTicket.status !== "closed" && (
            <div className="p-4 flex gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Escreva sua resposta..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none px-4 py-2.5 rounded-xl transition-all"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(249,115,22,0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ========== LIST VIEW ========== */
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* title */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(234,88,12,0.1))", border: "1px solid rgba(249,115,22,0.2)" }}
        >
          <MessageSquare className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Tickets de Suporte</h2>
          <p className="text-xs text-gray-500">Gerencie tickets de suporte dos usuários</p>
        </div>
      </div>

      {/* summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            style={glowCard}
            className="p-4 hover:-translate-y-0.5 transition-transform duration-200 cursor-default"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${c.color}20`, color: c.color, boxShadow: `0 0 12px ${c.color}30` }}
              >
                {c.icon}
              </div>
              <div>
                <p className="text-[11px] text-gray-500 font-medium">{c.label}</p>
                <p className="text-xl font-extrabold text-white">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* filters + search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === f.key ? "rgba(249,115,22,0.15)" : "transparent",
                color: filter === f.key ? "#f97316" : "#6b7280",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-transparent text-sm text-white placeholder-gray-600 outline-none transition-all"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(249,115,22,0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
          />
        </div>
      </div>

      {/* ticket list */}
      <div style={glowCard} className="overflow-hidden">
        {loading && <p className="text-center text-gray-500 text-sm py-12">Carregando tickets...</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-12">Nenhum ticket encontrado.</p>
        )}
        {!loading && filtered.map((t) => {
          const sm = STATUS_META[t.status];
          const initial = (t.user_name || "?").charAt(0).toUpperCase();
          return (
            <button
              key={t.id}
              onClick={() => openTicket(t)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              {/* avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
              >
                {initial}
              </div>
              {/* info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{t.user_name}</span>
                  <span className="text-[11px] text-gray-600 truncate">{t.email}</span>
                </div>
                <p className="text-xs font-medium text-gray-300 truncate mt-0.5">{t.subject}</p>
                <p className="text-[11px] text-gray-600 truncate mt-0.5">{t.last_message}</p>
              </div>
              {/* meta */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: sm.bg, color: sm.color }}
                >
                  {sm.icon} {sm.label}
                </span>
                <span className="text-[10px] text-gray-600">{timeAgo(t.updated_at)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
