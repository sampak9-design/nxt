"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Clock, HelpCircle, X, Trophy } from "lucide-react";
import type { Tab, ActiveTrade, AccountType } from "./TradeLayout";
import { useChartColors } from "@/lib/useChartColors";

const EXPIRATIONS: { label: string; ms: number }[] = [
  { label: "00:30", ms: 30_000 },
  { label: "01:00", ms: 60_000 },
  { label: "02:00", ms: 120_000 },
  { label: "05:00", ms: 300_000 },
  { label: "10:00", ms: 600_000 },
  { label: "15:00", ms: 900_000 },
  { label: "30:00", ms: 1_800_000 },
];

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, expiresAt - Date.now()));
  useEffect(() => {
    const iv = setInterval(() => setRemaining(Math.max(0, expiresAt - Date.now())), 250);
    return () => clearInterval(iv);
  }, [expiresAt]);
  const s = Math.ceil(remaining / 1000);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return (
    <span className="font-mono text-xs text-orange-400">
      {min > 0 ? `${min}:${String(sec).padStart(2, "0")}` : `${sec}s`}
    </span>
  );
}

interface Props {
  tab: Tab;
  accountType: AccountType;
  balance: number;
  currentPrice: number;
  activeTrades: ActiveTrade[];
  onTrade: (direction: "up" | "down", amount: number, expiresMs: number) => void;
  onSwitchAccount: () => void;
  onDepositClick: () => void;
  expiryMs: number;
  onExpiryChange: (ms: number) => void;
  onHoverChange?: (dir: "up" | "down" | null) => void;
  mobile?: boolean;
}

export default function TradePanel({
  tab, balance,
  activeTrades, onTrade,
  expiryMs, onExpiryChange,
  onHoverChange,
  mobile,
}: Props) {
  const colors = useChartColors();
  const [amount, setAmount] = useState(10);

  const expIdx      = EXPIRATIONS.findIndex((e) => e.ms === expiryMs);
  const safeExpIdx  = expIdx >= 0 ? expIdx : 1;
  const selectedExp = EXPIRATIONS[safeExpIdx];
  const profit      = (amount * tab.payout) / 100;
  const canTrade    = amount > 0 && amount <= balance;

  const incAmount = () => setAmount((a) => +(a + 5).toFixed(2));
  const decAmount = () => setAmount((a) => Math.max(1, +(a - 5).toFixed(2)));
  const incExp    = () => onExpiryChange(EXPIRATIONS[Math.min(EXPIRATIONS.length - 1, safeExpIdx + 1)].ms);
  const decExp    = () => onExpiryChange(EXPIRATIONS[Math.max(0, safeExpIdx - 1)].ms);

  // ── Mobile compact layout ───────────────────────────────────────────
  if (mobile) {
    return (
      <div
        className="flex-shrink-0 border-t"
        style={{ borderColor: "var(--color-border)", background: "var(--color-third)" }}
      >
        {/* Row 1: Expiry + Amount */}
        <div className="flex gap-2 px-3 pt-3 pb-2">
          {/* Expiry */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Tempo</span>
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
            >
              <button onClick={decExp} className="w-9 h-9 flex items-center justify-center hover:bg-white/10">
                <span className="text-gray-400 text-lg leading-none">−</span>
              </button>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-white font-bold text-sm font-mono">{selectedExp.label}</span>
              </div>
              <button onClick={incExp} className="w-9 h-9 flex items-center justify-center hover:bg-white/10">
                <span className="text-gray-400 text-lg leading-none">+</span>
              </button>
            </div>
          </div>
          {/* Amount */}
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Valor</span>
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
            >
              <button onClick={decAmount} className="w-9 h-9 flex items-center justify-center hover:bg-white/10">
                <span className="text-gray-400 text-lg leading-none">−</span>
              </button>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R${amount}</span>
              </div>
              <button onClick={incAmount} className="w-9 h-9 flex items-center justify-center hover:bg-white/10">
                <span className="text-gray-400 text-lg leading-none">+</span>
              </button>
            </div>
          </div>
          {/* Payout badge */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Lucro</span>
            <div
              className="h-9 flex items-center justify-center rounded-lg px-2"
              style={{ background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)" }}
            >
              <span className="text-[13px] font-bold" style={{ color: "#4ade80" }}>+{tab.payout}%</span>
            </div>
          </div>
        </div>

        {/* Row 2: Trade buttons */}
        <div className="flex gap-2 px-3 pb-3">
          <button
            onClick={() => onTrade("up", amount, selectedExp.ms)}
            onMouseEnter={() => onHoverChange?.("up")}
            onMouseLeave={() => onHoverChange?.(null)}
            disabled={!canTrade}
            className="flex-1 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ background: colors.buy, height: 48 }}
          >
            <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[15px] tracking-widest">ACIMA</span>
          </button>
          <button
            onClick={() => onTrade("down", amount, selectedExp.ms)}
            onMouseEnter={() => onHoverChange?.("down")}
            onMouseLeave={() => onHoverChange?.(null)}
            disabled={!canTrade}
            className="flex-1 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
            style={{ background: colors.sell, height: 48 }}
          >
            <TrendingDown className="w-5 h-5" strokeWidth={2.5} />
            <span className="text-[15px] tracking-widest">ABAIXO</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop layout ───────────────────────────────────────────────────
  return (
    <aside
      className="w-[240px] flex-shrink-0 flex flex-col border-l overflow-y-auto"
      style={{ borderColor: "var(--color-border)", background: "var(--color-third)" }}
    >
      {/* ── Header: asset info ── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-2">
          {tab.icon_url && (
            <img src={tab.icon_url} alt={tab.name} className="w-5 h-5 object-contain" />
          )}
          <span className="text-sm font-semibold text-white">{tab.name}</span>
        </div>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded"
          style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80" }}
        >
          {tab.payout}%
        </span>
      </div>

      <div className="flex flex-col gap-0 flex-1">

        {/* ── Tempo ── */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tempo</span>
            <HelpCircle className="w-3 h-3 text-gray-700 ml-auto" />
          </div>
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
          >
            <button
              onClick={decExp}
              className="flex items-center justify-center h-11 hover:bg-white/10 transition-colors"
              style={{ width: 40, borderRight: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-lg text-gray-400 leading-none select-none">−</span>
            </button>
            <div className="flex-1 flex items-center justify-center h-11">
              <span className="text-white font-bold text-base font-mono tracking-wide">
                {selectedExp.label}
              </span>
            </div>
            <button
              onClick={incExp}
              className="flex items-center justify-center h-11 hover:bg-white/10 transition-colors"
              style={{ width: 40, borderLeft: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-lg text-gray-400 leading-none select-none">+</span>
            </button>
          </div>
        </div>

        {/* ── Valor ── */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Valor</span>
            <HelpCircle className="w-3 h-3 text-gray-700 ml-auto" />
          </div>
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
          >
            <button
              onClick={decAmount}
              className="flex items-center justify-center h-11 hover:bg-white/10 transition-colors"
              style={{ width: 40, borderRight: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-lg text-gray-400 leading-none select-none">−</span>
            </button>
            <div className="flex-1 flex items-center justify-center h-11">
              <span className="text-white font-bold text-base">
                R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <button
              onClick={incAmount}
              className="flex items-center justify-center h-11 hover:bg-white/10 transition-colors"
              style={{ width: 40, borderLeft: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-lg text-gray-400 leading-none select-none">+</span>
            </button>
          </div>
        </div>

        {/* ── Lucro ── */}
        <div
          className="mx-4 mb-4 rounded-lg py-4 flex flex-col items-center"
          style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}
        >
          <div className="flex items-center gap-1 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Lucro</span>
            <HelpCircle className="w-3 h-3 text-gray-700" />
          </div>
          <div className="text-[38px] font-extrabold leading-none" style={{ color: "#4ade80" }}>
            +{tab.payout}%
          </div>
          <div className="text-sm font-semibold mt-1" style={{ color: "#4ade80" }}>
            +R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* ── Trade buttons ── */}
        <div className="px-4 pb-4 flex flex-col gap-2.5">
          <button
            onClick={() => onTrade("up", amount, selectedExp.ms)}
            onMouseEnter={() => onHoverChange?.("up")}
            onMouseLeave={() => onHoverChange?.(null)}
            disabled={!canTrade}
            className="w-full rounded-xl font-bold text-white flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: colors.buy, paddingTop: 18, paddingBottom: 18 }}
          >
            <TrendingUp className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-[15px] tracking-widest">ACIMA</span>
          </button>
          <button
            onClick={() => onTrade("down", amount, selectedExp.ms)}
            onMouseEnter={() => onHoverChange?.("down")}
            onMouseLeave={() => onHoverChange?.(null)}
            disabled={!canTrade}
            className="w-full rounded-xl font-bold text-white flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: colors.sell, paddingTop: 18, paddingBottom: 18 }}
          >
            <TrendingDown className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-[15px] tracking-widest">ABAIXO</span>
          </button>
        </div>

        {/* ── Saldo disponível ── */}
        <div
          className="mx-4 mb-4 flex items-center justify-between px-3 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <span className="text-[11px] text-gray-500">Saldo disponível</span>
          <span className="text-[12px] font-semibold text-white">
            R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* ── Active trades ── */}
        {activeTrades.length > 0 && (
          <div
            className="mx-4 mb-4 flex flex-col gap-2 pt-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold">
              Operações abertas
            </span>
            {activeTrades.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 p-2.5 rounded-lg"
                style={{
                  background: t.result
                    ? t.result === "win" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    t.result
                      ? t.result === "win" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: t.direction === "up" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)" }}
                >
                  {t.direction === "up"
                    ? <TrendingUp className="w-3 h-3 text-green-400" />
                    : <TrendingDown className="w-3 h-3 text-red-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white font-medium">R$ {t.amount.toFixed(2)}</span>
                    {t.result ? (
                      <span className={`text-xs font-bold ${t.result === "win" ? "text-green-400" : "text-red-400"}`}>
                        {t.result === "win" ? `+R$ ${((t.amount * t.payout) / 100).toFixed(2)}` : "Perdido"}
                      </span>
                    ) : (
                      <Countdown expiresAt={t.expiresAt} />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-600 font-mono">@ {t.entryPrice.toFixed(5)}</div>
                </div>
                {t.result === "win"  && <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                {t.result === "lose" && <X      className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
