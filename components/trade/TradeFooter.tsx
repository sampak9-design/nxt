"use client";

import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import type { ActiveTrade } from "./TradeLayout";

interface Props {
  activeTrades: ActiveTrade[];
}

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const tick = () => setS(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return <span className="text-[11px] font-mono text-orange-400">{mm}:{ss}</span>;
}

export default function TradeFooter({ activeTrades }: Props) {
  const [expanded, setExpanded] = useState(false);
  const openTrades = activeTrades.filter((t) => !t.result);
  const totalExpected = openTrades.reduce((s, t) => s + t.amount * t.payout / 100, 0);

  return (
    <div className="hidden md:flex flex-col flex-shrink-0">
      {/* Toggle bar — clicks to expand/collapse. When expanded, the bar
          moves UP together with the table (like a drawer opening upward). */}
      <div
        className="flex items-center h-7 px-4 border-t cursor-pointer select-none"
        style={{ background: "#1a1f30", borderColor: "rgba(255,255,255,0.08)" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-[11px] font-semibold text-white">
          {openTrades.length > 0 ? (
            <>
              Opções ({openTrades.length})
              <span className="text-emerald-400 ml-2">+R${totalExpected.toFixed(2)}</span>
            </>
          ) : (
            "Portfólio total"
          )}
        </span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          {expanded ? "Ocultar" : "Exibir"} posições
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </span>
      </div>

      {/* Table below the header — header + table move up together */}
      {expanded && (
        <div
          className="border-t overflow-y-auto"
          style={{ background: "#111622", borderColor: "rgba(255,255,255,0.06)", maxHeight: 240 }}
        >
          {openTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-[12px] text-gray-500">Você ainda não tem nenhuma posição aberta</span>
              <button
                className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded border transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#94a3b8" }}
              >
                + Selecione o ativo
              </button>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Nome</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Tipo</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Expiração</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Investimento</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Abertura</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Preço atual</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">L/P esperados</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((t) => {
                  const expected = +(t.amount * t.payout / 100).toFixed(2);
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: t.direction === "up" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)" }}
                          >
                            {t.direction === "up"
                              ? <TrendingUp className="w-3 h-3 text-green-400" />
                              : <TrendingDown className="w-3 h-3 text-red-400" />}
                          </div>
                          <span className="text-white font-medium">{t.tabName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-gray-400">Blitz</td>
                      <td className="py-2 px-3"><Countdown expiresAt={t.expiresAt} /></td>
                      <td className="py-2 px-3 text-right">
                        <span className="text-white">R${t.amount.toFixed(2)}</span>
                        {" "}
                        <span style={{ color: t.direction === "up" ? "#22c55e" : "#ef4444" }}>
                          {t.direction === "up" ? "▲" : "▼"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-gray-300 font-mono">{t.entryPrice.toFixed(5)}</td>
                      <td className="py-2 px-3 text-right text-gray-300 font-mono">—</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-medium">+R${expected.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

    </div>
  );
}
