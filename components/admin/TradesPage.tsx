"use client";

import { useEffect, useState } from "react";
import { Search, TrendingUp, TrendingDown, BarChart3, DollarSign, Activity } from "lucide-react";

type Trade = {
  id: string;
  user_id: number;
  user_name: string;
  account_type: "practice" | "real";
  asset_name: string;
  direction: "up" | "down";
  amount: number;
  payout: number;
  entry_price: number;
  exit_price: number | null;
  result: "win" | "lose" | null;
  net_profit: number | null;
  started_at: number;
  resolved_at: number | null;
};

function fmt(n: number) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2 }); }
function fmtDate(ms: number) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

const filterLabels = { all: "Todos", win: "Ganhos", lose: "Perdas" } as const;

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "win" | "lose">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    fetch("/api/admin/trades")
      .then(r => r.json())
      .then(d => { setTrades(d.trades ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = trades
    .filter(t => filter === "all" || t.result === filter)
    .filter(t => !search || t.user_name?.toLowerCase().includes(search.toLowerCase()) || t.asset_name?.toLowerCase().includes(search.toLowerCase()));

  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);
  const totalProfit = filtered.reduce((s, t) => s + (t.net_profit ?? 0), 0);
  const houseProfit = -totalProfit;

  const summaryCards = [
    {
      label: "Total operado",
      value: `R$${fmt(totalAmount)}`,
      icon: BarChart3,
      gradient: "from-blue-600/30 to-cyan-600/20",
      glowColor: "rgba(59,130,246,0.5)",
      iconBg: "rgba(59,130,246,0.15)",
      iconColor: "#60a5fa",
    },
    {
      label: "Lucro/Prejuízo casa",
      value: `R$${fmt(houseProfit)}`,
      icon: DollarSign,
      gradient: houseProfit >= 0 ? "from-emerald-600/30 to-green-600/20" : "from-red-600/30 to-rose-600/20",
      glowColor: houseProfit >= 0 ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.5)",
      iconBg: houseProfit >= 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
      iconColor: houseProfit >= 0 ? "#34d399" : "#f87171",
      valueColor: houseProfit >= 0 ? "#34d399" : "#f87171",
    },
    {
      label: "Total operações",
      value: String(filtered.length),
      icon: Activity,
      gradient: "from-violet-600/30 to-purple-600/20",
      glowColor: "rgba(139,92,246,0.5)",
      iconBg: "rgba(139,92,246,0.15)",
      iconColor: "#a78bfa",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <h1
        className="text-2xl font-extrabold text-white tracking-tight"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        Operações
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${card.gradient} p-5`}
              style={{
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                background: `radial-gradient(ellipse at 30% 0%, ${card.glowColor.replace("0.5", "0.12")}, transparent 60%), linear-gradient(135deg, rgba(22,28,44,0.95), rgba(15,20,35,0.98))`,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
              }}
            >
              {/* Radial gradient overlay */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 80% -20%, ${card.glowColor.replace("0.5", "0.08")}, transparent 50%)`,
                }}
              />
              <div className="relative flex items-start justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400/80">
                    {card.label}
                  </span>
                  <span
                    className="text-2xl font-extrabold tracking-tight"
                    style={{ color: card.valueColor ?? "#fff" }}
                  >
                    {card.value}
                  </span>
                </div>
                {/* Glow icon */}
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    background: card.iconBg,
                    boxShadow: `0 0 20px ${card.glowColor.replace("0.5", "0.25")}`,
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: card.iconColor }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter pills + search */}
      <div
        className="flex flex-wrap items-center gap-3"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.25s",
        }}
      >
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
          {(["all", "win", "lose"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative rounded-xl px-4 py-1.5 text-xs font-semibold transition-all duration-300"
              style={{
                background: filter === f
                  ? "linear-gradient(135deg, rgba(249,115,22,0.9), rgba(234,88,12,0.9))"
                  : "transparent",
                color: filter === f ? "#fff" : "#64748b",
                boxShadow: filter === f ? "0 0 16px rgba(249,115,22,0.3)" : "none",
              }}
            >
              {filterLabels[f]}
              {/* Active bottom dot */}
              {filter === f && (
                <span
                  className="absolute bottom-0 left-1/2 h-[3px] w-[3px] -translate-x-1/2 translate-y-[2px] rounded-full"
                  style={{ background: "#fb923c", boxShadow: "0 0 6px rgba(251,146,60,0.8)" }}
                />
              )}
            </button>
          ))}
        </div>

        <div
          className="flex flex-1 items-center gap-2 rounded-xl border border-white/[0.08] px-3.5 py-2"
          style={{
            maxWidth: 280,
            background: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Search className="h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar usuário ou ativo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl border border-white/[0.06]"
        style={{
          background: "linear-gradient(135deg, rgba(22,28,44,0.9), rgba(15,20,35,0.95))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 4px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 840 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Usuário","Ativo","Conta","Direção","Valor","L/P","Resultado","Data"].map((h, i) => (
                  <th
                    key={h}
                    className={`py-3.5 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500/70 ${
                      h === "Direção" ? "text-center" : h === "Valor" || h === "L/P" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500"
                      />
                      <span className="text-xs text-gray-500">Carregando operações...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-gray-500">
                    Nenhuma operação encontrada.
                  </td>
                </tr>
              ) : filtered.slice(0, 100).map((t, idx) => (
                <tr
                  key={t.id}
                  className="group transition-colors duration-200"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(8px)",
                    transition: `all 0.4s cubic-bezier(0.16,1,0.3,1) ${0.4 + Math.min(idx, 20) * 0.02}s`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* User */}
                  <td className="py-3 px-4">
                    <span className="text-xs font-semibold text-white">{t.user_name}</span>
                  </td>

                  {/* Asset */}
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium text-gray-300">{t.asset_name}</span>
                  </td>

                  {/* Account badge */}
                  <td className="py-3 px-4">
                    <span
                      className="inline-block rounded-full px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        background: t.account_type === "real"
                          ? "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))"
                          : "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))",
                        color: t.account_type === "real" ? "#34d399" : "#fb923c",
                        border: `1px solid ${t.account_type === "real" ? "rgba(16,185,129,0.2)" : "rgba(249,115,22,0.2)"}`,
                      }}
                    >
                      {t.account_type === "real" ? "Real" : "Demo"}
                    </span>
                  </td>

                  {/* Direction with glow circle */}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center justify-center">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                        style={{
                          background: t.direction === "up"
                            ? "rgba(34,197,94,0.12)"
                            : "rgba(239,68,68,0.12)",
                          boxShadow: t.direction === "up"
                            ? "0 0 12px rgba(34,197,94,0.25)"
                            : "0 0 12px rgba(239,68,68,0.25)",
                        }}
                      >
                        {t.direction === "up"
                          ? <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                          : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right">
                    <span className="text-xs font-extrabold tracking-tight text-white">
                      R${fmt(t.amount)}
                    </span>
                  </td>

                  {/* Profit/Loss */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className="text-xs font-extrabold tracking-tight"
                      style={{ color: (t.net_profit ?? 0) >= 0 ? "#34d399" : "#f87171" }}
                    >
                      {t.net_profit != null ? `R$${fmt(t.net_profit)}` : "—"}
                    </span>
                  </td>

                  {/* Result with glow */}
                  <td className="py-3 px-4">
                    {t.result ? (
                      <span
                        className="text-xs font-extrabold uppercase tracking-wide"
                        style={{
                          color: t.result === "win" ? "#34d399" : "#f87171",
                          textShadow: t.result === "win"
                            ? "0 0 12px rgba(52,211,153,0.6), 0 0 4px rgba(52,211,153,0.3)"
                            : "0 0 12px rgba(248,113,113,0.6), 0 0 4px rgba(248,113,113,0.3)",
                        }}
                      >
                        {t.result === "win" ? "WIN" : "LOSS"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-500/60 uppercase tracking-wide">
                        Aberta
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4">
                    <span className="text-[11px] tabular-nums text-gray-500">
                      {fmtDate(t.started_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
