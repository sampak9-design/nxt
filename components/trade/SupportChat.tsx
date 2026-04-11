"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, Plus, MessageSquare, ChevronLeft } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Ticket = {
  id: number;
  subject: string;
  status: "open" | "answered" | "closed";
  created_at: number;
  updated_at: number;
  unread_admin: number;
};

type Message = {
  id: number;
  sender: "user" | "admin";
  message: string;
  created_at: number;
};

const STATUS = {
  open:     { color: "#f97316", label: "Aberto" },
  answered: { color: "#22c55e", label: "Respondido" },
  closed:   { color: "#6b7280", label: "Fechado" },
};

function timeAgo(ms: number) {
  const diff = Date.now() - ms;
  if (diff < 60000) return "agora";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function SupportChat({ open, onClose }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<"list" | "chat" | "new">("list");
  const [newSubject, setNewSubject] = useState("Suporte");
  const [newMsg, setNewMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const r = await fetch("/api/tickets");
      const d = await r.json();
      if (d.tickets) setTickets(d.tickets);
    } catch {}
  }, []);

  const fetchMessages = useCallback(async (id: number) => {
    try {
      const r = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "messages", ticketId: id }),
      });
      const d = await r.json();
      if (d.messages) setMessages(d.messages);
    } catch {}
  }, []);

  // Load on open
  useEffect(() => {
    if (open) { fetchTickets(); setView("list"); setActiveTicket(null); setMessages([]); }
  }, [open, fetchTickets]);

  // Poll messages
  useEffect(() => {
    if (!open || !activeTicket) return;
    const iv = setInterval(() => fetchMessages(activeTicket.id), 4000);
    return () => clearInterval(iv);
  }, [open, activeTicket, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const openTicket = async (t: Ticket) => {
    setActiveTicket(t);
    setView("chat");
    setMessages([]);
    await fetchMessages(t.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeTicket || sending) return;
    setSending(true);
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "message", ticketId: activeTicket.id, message: input.trim() }),
    });
    setInput("");
    await fetchMessages(activeTicket.id);
    setSending(false);
  };

  const createTicket = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    const r = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", subject: newSubject.trim() || "Suporte", message: newMsg.trim() }),
    });
    const d = await r.json();
    if (d.ticketId) {
      setNewSubject("Suporte");
      setNewMsg("");
      await fetchTickets();
      openTicket({ id: d.ticketId, subject: newSubject.trim(), status: "open", created_at: Date.now(), updated_at: Date.now(), unread_admin: 0 });
    }
    setSending(false);
  };

  if (!open) return null;

  return (
    <div className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden"
      style={{ width: "85vw", maxWidth: 340, background: "#0f1320", borderColor: "rgba(255,255,255,0.06)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#111827" }}>
          {view !== "list" && (
            <button onClick={() => { setView("list"); setActiveTicket(null); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">
              {view === "list" ? "Suporte" : view === "new" ? "Novo Ticket" : activeTicket?.subject}
            </div>
            {view === "chat" && activeTicket && (
              <div className="text-[10px]" style={{ color: STATUS[activeTicket.status]?.color }}>
                {STATUS[activeTicket.status]?.label}
              </div>
            )}
          </div>
          {view === "list" && (
            <button onClick={() => setView("new")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              <Plus className="w-3 h-3" /> Novo
            </button>
          )}
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        {view === "list" && (
          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
                  <MessageSquare className="w-8 h-8 text-orange-500/50" />
                </div>
                <p className="text-sm text-gray-500 text-center">Nenhum ticket ainda.<br />Crie um para falar com o suporte.</p>
                <button onClick={() => setView("new")}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                  Criar ticket
                </button>
              </div>
            ) : (
              tickets.map(t => {
                const st = STATUS[t.status] ?? STATUS.open;
                return (
                  <button key={t.id} onClick={() => openTicket(t)}
                    className="w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${st.color}15` }}>
                      <MessageSquare className="w-5 h-5" style={{ color: st.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-semibold text-white truncate">{t.subject}</span>
                        <span className="text-[10px] text-gray-500 flex-shrink-0">{timeAgo(t.updated_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${st.color}15`, color: st.color }}>
                          {st.label}
                        </span>
                        {t.unread_admin > 0 && (
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "#f97316" }}>
                            {t.unread_admin}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {view === "new" && (
          <div className="flex-1 flex flex-col p-4 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Assunto</label>
              <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
                placeholder="Ex: Problema com depósito"
                className="w-full text-sm text-white placeholder-gray-600 rounded-xl px-4 py-3 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                onFocus={e => e.target.style.borderColor = "rgba(249,115,22,0.3)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Mensagem</label>
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder="Descreva seu problema ou dúvida..."
                className="flex-1 text-sm text-white placeholder-gray-600 rounded-xl px-4 py-3 outline-none resize-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", minHeight: 120 }}
                onFocus={e => e.target.style.borderColor = "rgba(249,115,22,0.3)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
              />
            </div>
            <button onClick={createTicket} disabled={sending || !newMsg.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        )}

        {view === "chat" && activeTicket && (
          <>
            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <span className="text-xs text-gray-600">Carregando...</span>
                </div>
              ) : messages.map(m => {
                const isUser = m.sender === "user";
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mr-2 mt-1"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                        S
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div className="rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed"
                        style={{
                          background: isUser
                            ? "linear-gradient(135deg, #f97316, #ea580c)"
                            : "rgba(255,255,255,0.06)",
                          color: isUser ? "#fff" : "rgba(255,255,255,0.85)",
                          borderBottomRightRadius: isUser ? 4 : 16,
                          borderBottomLeftRadius: isUser ? 16 : 4,
                        }}>
                        <p className="whitespace-pre-wrap break-words">{m.message}</p>
                      </div>
                      <div className={`text-[10px] text-gray-600 mt-1 ${isUser ? "text-right" : "text-left"}`}>
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            {activeTicket.status !== "closed" && (
              <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#111827" }}>
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 text-sm text-white placeholder-gray-600 rounded-xl px-4 py-2.5 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onFocus={e => e.target.style.borderColor = "rgba(249,115,22,0.3)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.06)"}
                />
                <button onClick={sendMessage} disabled={sending || !input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
            {activeTicket.status === "closed" && (
              <div className="px-4 py-3 text-center text-xs text-gray-500 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                Este ticket foi encerrado
              </div>
            )}
          </>
        )}
    </div>
  );
}
