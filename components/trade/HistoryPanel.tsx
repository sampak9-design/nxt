"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";
import type { TradeHistoryEntry, AccountType } from "./TradeLayout";

const MONTHS_LONG  = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function fmtTime(ms: number) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function fmtDateShort(ms: number) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")} ${MONTHS_SHORT[d.getMonth()]}`;
}
function fmtDateLong(ms: number) {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2,"0")} de ${MONTHS_LONG[d.getMonth()]} de ${d.getFullYear()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}

function DetailRows({ entry }: { entry: TradeHistoryEntry }) {
  const isWin = entry.result === "win";
  const resultValue = isWin
    ? `+R$ ${entry.netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
    : `-R$ ${entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div
      className="mx-3 mb-1 rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Investimento */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="text-[10px] text-gray-500 mb-0.5">Investimento</div>
        <div className="text-base font-bold text-white">
          R$ {entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Resultado + Payout */}
      <div className="grid grid-cols-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="px-4 py-3 border-r" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="text-[10px] text-gray-500 mb-0.5">Resultado</div>
          <div className="text-sm font-bold" style={{ color: isWin ? "#4ade80" : "#f87171" }}>
            {resultValue}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[10px] text-gray-500 mb-0.5">Payout</div>
          <div className="text-sm font-bold text-white">{entry.payout}%</div>
        </div>
      </div>

      {/* Detail rows */}
      {[
        { label: "Início",           value: fmtDateLong(entry.startedAt) },
        { label: "Fim",              value: fmtDateLong(entry.resolvedAt) },
        { label: "Preço de entrada", value: entry.entryPrice.toFixed(2) },
        { label: "Preço de saída",   value: entry.exitPrice.toFixed(2) },
      ].map(({ label, value }, i, arr) => (
        <div
          key={label}
          className="flex items-start justify-between px-4 py-2.5"
          style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
        >
          <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
          <span className="text-[11px] text-white font-medium text-right ml-3">{value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  history: TradeHistoryEntry[];
  accountType: AccountType;
  onClose: () => void;
}

export default function HistoryPanel({ history, accountType, onClose }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = history.filter((h) => h.accountType === accountType);

  return (
    <div
      className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden w-full md:w-[280px]"
      style={{ background: "var(--color-third)", borderColor: "var(--color-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span className="text-sm font-semibold text-white">Histórico Trading</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter */}
      <div className="px-3 py-3 flex-shrink-0">
        <button
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-gray-300"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <span>Finalizadas</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Account badge */}
      <div className="px-3 pb-2 flex-shrink-0">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            background: accountType === "practice" ? "rgba(249,115,22,0.15)" : "rgba(16,185,129,0.15)",
            color: accountType === "practice" ? "#f97316" : "#10b981",
          }}
        >
          {accountType === "practice" ? "CONTA DE PRÁTICA" : "CONTA REAL"}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-gray-600 text-xs">Nenhuma operação finalizada</span>
          </div>
        ) : (
          filtered.map((entry) => {
            const isWin     = entry.result === "win";
            const isUp      = entry.direction === "up";
            const expanded  = expandedId === entry.id;
            const pct       = isWin ? `+${entry.payout}%` : "-100%";
            const profitLabel = isWin
              ? `+R$ ${entry.netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              : `-R$ ${entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

            return (
              <div key={entry.id}>
                {/* Row */}
                <button
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors hover:bg-white/5"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  {/* Time / Date */}
                  <div className="flex flex-col items-end flex-shrink-0" style={{ minWidth: 36 }}>
                    <span className="text-[12px] font-semibold text-white leading-tight">{fmtTime(entry.resolvedAt)}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{fmtDateShort(entry.resolvedAt)}</span>
                  </div>

                  {/* Icon + name */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {entry.iconUrl
                      ? <img src={entry.iconUrl} alt={entry.tabName} className="w-6 h-6 rounded-full object-contain flex-shrink-0" />
                      : <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)" }}>{entry.tabId.replace("-OTC","").slice(0,2)}</div>
                    }
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-white truncate leading-tight">{entry.tabName}</div>
                      <div className="text-[10px] text-gray-500 leading-tight">Binária</div>
                    </div>
                  </div>

                  {/* Amount + result */}
                  <div className="flex flex-col items-end flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span style={{ color: isUp ? "#4ade80" : "#f87171", fontSize: 10 }}>{isUp ? "▲" : "▼"}</span>
                      <span className="text-[12px] font-semibold text-white">
                        R$ {entry.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold leading-tight" style={{ color: isWin ? "#4ade80" : "#f87171" }}>
                      {profitLabel} ({pct})
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 transition-transform"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                {/* Expanded detail */}
                {expanded && <DetailRows entry={entry} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
