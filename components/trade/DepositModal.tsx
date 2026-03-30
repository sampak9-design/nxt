"use client";

import { useState } from "react";
import { X, CreditCard, Zap } from "lucide-react";

const AMOUNTS = [50, 100, 250, 500, 1000, 2500];

interface Props {
  onDeposit: (amount: number) => void;
  onClose: () => void;
}

export default function DepositModal({ onDeposit, onClose }: Props) {
  const [selected, setSelected] = useState(100);
  const [custom, setCustom]     = useState("");

  const finalAmount = custom ? parseFloat(custom) || 0 : selected;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col rounded-xl border shadow-2xl overflow-hidden w-[420px]"
        style={{ background: "var(--color-third)", borderColor: "var(--color-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-400" />
            <span className="font-bold text-white">Depositar</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Amount grid */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-3">
              Selecione o valor
            </label>
            <div className="grid grid-cols-3 gap-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setSelected(a); setCustom(""); }}
                  className="py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: selected === a && !custom
                      ? "var(--color-primary)"
                      : "rgba(255,255,255,0.06)",
                    color: selected === a && !custom ? "#fff" : "#94a3b8",
                    border: `1px solid ${selected === a && !custom ? "var(--color-primary)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  ${a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wide mb-2">
              Outro valor
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg border"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-gray-400 text-sm">$</span>
              <input
                type="number"
                placeholder="0.00"
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setSelected(0); }}
                min="1"
                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "rgba(52,169,62,0.1)", border: "1px solid rgba(52,169,62,0.2)" }}
          >
            <span className="text-sm text-gray-300">Saldo que será adicionado</span>
            <span className="font-bold text-green-400 text-base">
              ${finalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={() => { if (finalAmount > 0) onDeposit(finalAmount); }}
            disabled={finalAmount <= 0}
            className="w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#34A93E" }}
          >
            <Zap className="w-4 h-4" />
            Depositar ${finalAmount > 0 ? finalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}
          </button>

          <p className="text-center text-[11px] text-gray-500">
            Ambiente de demonstração · Nenhum valor real é cobrado
          </p>
        </div>
      </div>
    </div>
  );
}
