"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, Plus, MessageSquare, ArrowLeft } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Ticket = {
  id: number;
  subject: string;
  status: "open" | "answered" | "closed";
  created_at: string;
};

type Message = {
  id: number;
  sender: "user" | "admin";
  message: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, { bg: string; label: string }> = {
  open:     { bg: "#f97316", label: "Aberto" },
  answered: { bg: "#22c55e", label: "Respondido" },
  closed:   { bg: "#6b7280", label: "Fechado" },
};

export default function SupportChat({ open, onClose }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.tickets) setTickets(data.tickets);
    } catch {}
  }, []);

  // Fetch messages for selected ticket
  const fetchMessages = useCallback(async (ticketId: number) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "messages", ticketId }),
      });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {}
  }, []);

  // Load tickets when panel opens
  useEffect(() => {
    if (open) {
      fetchTickets();
      setSelectedTicket(null);
      setCreating(false);
      setMessages([]);
    }
  }, [open, fetchTickets]);

  // Poll for new messages every 5s
  useEffect(() => {
    if (!open || !selectedTicket) return;
    const interval = setInterval(() => {
      fetchMessages(selectedTicket.id);
    }, 5000);
    return () => clearInterval(interval);
  }, [open, selectedTicket, fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select a ticket
  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setCreating(false);
    setLoading(true);
    await fetchMessages(ticket.id);
    setLoading(false);
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || !selectedTicket || sending) return;
    setSending(true);
    try {
      await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", ticketId: selectedTicket.id, message: input.trim() }),
      });
      setInput("");
      await fetchMessages(selectedTicket.id);
    } catch {}
    setSending(false);
  };

  // Create new ticket
  const handleCreate = async () => {
    if (!newSubject.trim() || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", subject: newSubject.trim(), message: newMessage.trim() }),
      });
      const data = await res.json();
      if (data.ticketId) {
        setNewSubject("");
        setNewMessage("");
        setCreating(false);
        await fetchTickets();
        handleSelectTicket({ id: data.ticketId, subject: newSubject.trim(), status: "open", created_at: new Date().toISOString() });
      }
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedTicket) handleSend();
    }
  };

  // Show ticket list or chat view on mobile
  const showChat = selectedTicket || creating;
  const showListOnMobile = isMobile && !showChat;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[9999] flex flex-col"
        style={{
          width: isMobile ? "100%" : 360,
          maxWidth: "100%",
          background: "#111622",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {isMobile && showChat && (
            <button
              onClick={() => { setSelectedTicket(null); setCreating(false); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-white flex-1">Suporte</span>
          <button
            onClick={() => { setCreating(true); setSelectedTicket(null); }}
            className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:opacity-90"
            style={{ background: "#f97316", color: "#fff" }}
          >
            <Plus className="w-3 h-3 inline-block mr-1 -mt-0.5" />
            Novo ticket
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ml-1"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Ticket list — always visible on desktop, conditional on mobile */}
          {(!isMobile || showListOnMobile) && (
            <div
              className="flex flex-col overflow-y-auto flex-shrink-0"
              style={{
                width: isMobile ? "100%" : 140,
                borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {tickets.length === 0 && !creating ? (
                <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-600 mb-3" />
                  <p className="text-xs text-gray-500 mb-3">Nenhum ticket encontrado</p>
                  <button
                    onClick={() => setCreating(true)}
                    className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors hover:opacity-90"
                    style={{ background: "#f97316", color: "#fff" }}
                  >
                    Criar primeiro ticket
                  </button>
                </div>
              ) : (
                tickets.map((t) => {
                  const status = STATUS_COLORS[t.status] || STATUS_COLORS.open;
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className="w-full text-left px-3 py-3 transition-colors border-b"
                      style={{
                        borderColor: "rgba(255,255,255,0.06)",
                        background: isSelected ? "rgba(255,255,255,0.05)" : "transparent",
                      }}
                    >
                      <div className="text-xs text-white font-medium truncate mb-1">{t.subject}</div>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white inline-block"
                        style={{ background: status.bg }}
                      >
                        {status.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Chat area */}
          {(!isMobile || showChat) && (
            <div className="flex flex-col flex-1 min-w-0">
              {creating ? (
                /* New ticket form */
                <div className="flex flex-col flex-1 p-4 gap-3">
                  <p className="text-xs text-gray-400 font-medium">Novo ticket de suporte</p>
                  <input
                    type="text"
                    placeholder="Assunto"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-sm text-white placeholder-gray-500 rounded-md px-3 py-2 outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <textarea
                    placeholder="Descreva seu problema..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={5}
                    className="w-full text-sm text-white placeholder-gray-500 rounded-md px-3 py-2 outline-none resize-none flex-1"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <button
                    onClick={handleCreate}
                    disabled={sending || !newSubject.trim() || !newMessage.trim()}
                    className="w-full text-sm font-medium py-2.5 rounded-md transition-colors hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#f97316", color: "#fff" }}
                  >
                    {sending ? "Enviando..." : "Criar ticket"}
                  </button>
                </div>
              ) : selectedTicket ? (
                /* Chat messages */
                <>
                  <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
                    {loading ? (
                      <div className="flex items-center justify-center flex-1">
                        <span className="text-xs text-gray-500">Carregando...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center flex-1">
                        <span className="text-xs text-gray-500">Nenhuma mensagem</span>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isUser = m.sender === "user";
                        return (
                          <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div
                              className="rounded-lg px-3 py-2 text-xs max-w-[85%]"
                              style={{
                                background: isUser ? "#f97316" : "rgba(255,255,255,0.08)",
                                color: isUser ? "#fff" : "rgba(255,255,255,0.85)",
                              }}
                            >
                              <p className="whitespace-pre-wrap break-words">{m.message}</p>
                              <p
                                className="text-[10px] mt-1"
                                style={{ opacity: 0.6 }}
                              >
                                {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div
                    className="flex items-center gap-2 px-3 py-3 flex-shrink-0"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 text-sm text-white placeholder-gray-500 rounded-md px-3 py-2 outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={sending || !input.trim()}
                      className="w-9 h-9 flex items-center justify-center rounded-md transition-colors hover:opacity-90 disabled:opacity-50 flex-shrink-0"
                      style={{ background: "#f97316" }}
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </>
              ) : (
                /* No ticket selected — desktop only since mobile shows list */
                <div className="flex items-center justify-center flex-1">
                  <p className="text-xs text-gray-500">Selecione um ticket</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
