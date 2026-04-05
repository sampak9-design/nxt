"use client";

import { useEffect, useState } from "react";
import { X, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import type { ActiveTrade } from "./TradeLayout";

/* ── circular countdown ── */
function CircleTimer({ expiresAt, totalMs }: { expiresAt: number; totalMs: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));

  useEffect(() => {
    const iv = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 250);
    return () => clearInterval(iv);
  }, [expiresAt]);

  const r = 22;
  const circ = 2 * Math.PI * r;
  const progress = totalMs > 0 ? remaining / totalMs : 0;
  const offset = circ * (1 - progress);

  const s = Math.ceil(remaining / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  const label = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  return (
    <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
      <svg width={52} height={52} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <circle
          cx={26} cy={26} r={r}
          fill="none"
          stroke="#f97316"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.25s linear" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-bold font-mono"
        style={{ fontSize: 10, color: "#f97316" }}
      >
        {label}
      </span>
    </div>
  );
}

interface Props {
  activeTrades: ActiveTrade[];
  onClose: () => void;
}

export default function PortfolioPanel({ activeTrades, onClose }: Props) {
  const openTrades = activeTrades.filter((t) => !t.result);
  const totalInvested = openTrades.reduce((s, t) => s + t.amount, 0);
  const totalProfit = 0; // live P&L is 0 until resolved

  return (
    <div
      className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden"
      style={{
        width: "100%",
        maxWidth: 260,
        background: "var(--color-third)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span className="text-sm font-semibold text-white">Portfólio</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab */}
      <div
        className="flex border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          className="px-4 py-2.5 text-xs font-bold tracking-widest"
          style={{ color: "var(--color-primary)", borderBottom: "2px solid var(--color-primary)" }}
        >
          ATIVAS
        </button>
      </div>

      {/* Dropdown */}
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-300"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span>Posições abertas</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Summary */}
      <div
        className="mx-3 mb-3 rounded-lg overflow-hidden flex-shrink-0"
        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
      >
        <div
          className="flex items-center justify-between px-3 py-2.5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div>
            <div className="text-[11px] font-bold text-white">LUCRO ATUAL</div>
            <div className="text-[10px] text-gray-500">Em Percentagem</div>
          </div>
          <div className="text-right">
            <div className="text-[12px] font-bold" style={{ color: "#4ade80" }}>
              +R$ {totalProfit.toFixed(2)}
            </div>
            <div className="text-[11px] font-semibold" style={{ color: "#4ade80" }}>+0%</div>
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="text-[11px] font-bold text-white">INVESTIMENTO</div>
          <div className="text-[12px] font-semibold text-white">
            R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-y-auto px-3 flex flex-col gap-2 pb-3">
        {openTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <span className="text-gray-600 text-xs">Nenhuma posição aberta</span>
          </div>
        ) : (
          openTrades.map((t) => {
            const totalMs = t.expiresAt - t.entryTime * 1000;
            return (
              <div
                key={t.id}
                className="rounded-lg p-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-3">
                  <CircleTimer expiresAt={t.expiresAt} totalMs={totalMs} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {t.tabIconUrl
                        ? <img src={t.tabIconUrl} alt={t.tabName} className="w-5 h-5 rounded-full object-contain flex-shrink-0" />
                        : <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>{t.tabId.slice(0,2)}</div>
                      }
                      <span className="text-xs font-semibold text-white truncate">{t.tabName}</span>
                      <span
                        className="flex-shrink-0 text-[9px] font-bold"
                        style={{ color: t.direction === "up" ? "#4ade80" : "#f87171" }}
                      >
                        {t.direction === "up" ? "▲" : "▼"}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {t.direction === "up" ? "Blitz ↑" : "Blitz ↓"}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold" style={{ color: "#4ade80" }}>+R$0</div>
                    <div className="text-[11px] font-semibold" style={{ color: "#4ade80" }}>+0%</div>
                  </div>
                </div>
                <button className="mt-2 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                  Mostrar mais ▾
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
