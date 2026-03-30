"use client";

import { useEffect, useRef } from "react";
import {
  Crown, Camera, ArrowDownCircle, ArrowUpCircle,
  FileText, HelpCircle, DollarSign, Clock, Key, Settings, LogOut, Copy,
} from "lucide-react";

interface Props {
  pos: { top: number; right: number };
  onClose: () => void;
  onDepositClick: () => void;
}

const MENU_ITEMS = [
  { icon: Crown,           label: "Programa VIP",        badge: "NEW",      badgeColor: "#3b82f6" },
  { icon: Camera,          label: "Carregar uma foto" },
  { icon: ArrowDownCircle, label: "Depositar fundos" },
  { icon: ArrowUpCircle,   label: "Retirar fundos" },
  { icon: FileText,        label: "Verificar documentos", badge: "Pendente", badgeColor: "#f97316" },
  { icon: HelpCircle,      label: "Contactar o suporte" },
  { icon: DollarSign,      label: "Histórico do saldo" },
  { icon: Clock,           label: "Histórico de trading" },
  { icon: Key,             label: "Trocar senha" },
  { icon: Settings,        label: "Configurações" },
  { icon: LogOut,          label: "Sair",                danger: true },
];

export default function ProfilePanel({ pos, onClose, onDepositClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed rounded-xl shadow-2xl flex overflow-hidden"
      style={{
        top: pos.top, right: pos.right,
        width: 520,
        background: "#161c2c",
        border: "1px solid rgba(255,255,255,0.08)",
        zIndex: 9999,
      }}
    >
      {/* ── Left: user info ── */}
      <div
        className="flex flex-col p-5 gap-4"
        style={{ width: 200, background: "#111622", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.1)" }}
          >
            <span className="text-3xl">👤</span>
          </div>
        </div>

        {/* Email */}
        <div
          className="pb-3 text-center"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span className="text-xs text-gray-300 break-all">teste5067@gmail.com</span>
        </div>

        {/* Country */}
        <div className="flex items-center gap-2">
          <img src="https://flagcdn.com/24x18/br.png" alt="Brasil" className="flex-shrink-0" />
          <span className="text-sm text-white">Brasil</span>
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-2">
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">Data de registro</div>
            <div className="text-xs text-white">03/02/26</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">ID do usuário</div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white font-mono">16967698</span>
              <button
                onClick={() => navigator.clipboard.writeText("16967698")}
                className="hover:text-white transition-colors"
              >
                <Copy className="w-3 h-3 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: menu ── */}
      <div className="flex-1 py-2 overflow-y-auto">
        {MENU_ITEMS.map(({ icon: Icon, label, badge, badgeColor, danger }) => (
          <button
            key={label}
            onClick={() => {
              if (label === "Depositar fundos") { onClose(); onDepositClick(); }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.05]"
            style={{ color: danger ? "#ef4444" : "rgba(255,255,255,0.85)" }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" style={{ color: danger ? "#ef4444" : "#64748b" }} />
            <span className="flex-1 text-left">{label}</span>
            {badge && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                style={{ background: badgeColor }}
              >
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
