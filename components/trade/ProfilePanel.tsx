"use client";

import { useEffect, useRef } from "react";
import {
  Crown, Camera, ArrowDownCircle, ArrowUpCircle,
  FileText, HelpCircle, DollarSign, Clock, Key, Settings, LogOut, Copy, X,
} from "lucide-react";

interface Props {
  pos: { top: number; right: number };
  onClose: () => void;
  onDepositClick: () => void;
}

const MENU_ITEMS = [
  { icon: Crown,           label: "Programa VIP",         badge: "NEW",      badgeColor: "#3b82f6" },
  { icon: Camera,          label: "Carregar uma foto" },
  { icon: ArrowDownCircle, label: "Depositar fundos" },
  { icon: ArrowUpCircle,   label: "Retirar fundos" },
  { icon: FileText,        label: "Verificar documentos",  badge: "Pendente", badgeColor: "#f97316" },
  { icon: HelpCircle,      label: "Contactar o suporte" },
  { icon: DollarSign,      label: "Histórico do saldo" },
  { icon: Clock,           label: "Histórico de trading" },
  { icon: Key,             label: "Trocar senha" },
  { icon: Settings,        label: "Configurações" },
  { icon: LogOut,          label: "Sair",                  danger: true },
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

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <>
      {/* Backdrop — mobile only */}
      {isMobile && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onMouseDown={onClose}
        />
      )}

      <div
        ref={ref}
        className="fixed rounded-xl shadow-2xl overflow-hidden"
        style={{
          zIndex: 9999,
          background: "#161c2c",
          border: "1px solid rgba(255,255,255,0.08)",
          // Mobile: full width centered, below header
          ...(isMobile
            ? { top: 64, left: 8, right: 8, width: "auto" }
            : { top: pos.top, right: pos.right, width: 520 }),
        }}
      >
        {/* Mobile: single column layout */}
        {isMobile ? (
          <>
            {/* Header with user info */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: "#111622", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.1)" }}
              >
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-300 truncate">teste5067@gmail.com</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-gray-500 font-mono">ID: 16967698</span>
                  <button onClick={() => navigator.clipboard.writeText("16967698")}>
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Menu items */}
            <div className="py-1 max-h-[70vh] overflow-y-auto">
              {MENU_ITEMS.map(({ icon: Icon, label, badge, badgeColor, danger }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (label === "Depositar fundos") { onClose(); onDepositClick(); }
                    else if (label === "Sair") {
                      fetch("/api/auth/logout", { method: "POST" }).finally(() => {
                        window.location.href = "/";
                      });
                    }
                    else onClose();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/[0.05] active:bg-white/10"
                  style={{ color: danger ? "#ef4444" : "rgba(255,255,255,0.85)" }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: danger ? "#ef4444" : "#64748b" }} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: badgeColor }}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Desktop: two column layout */
          <div className="flex" style={{ width: 520 }}>
            {/* Left: user info */}
            <div
              className="flex flex-col p-5 gap-4 flex-shrink-0"
              style={{ width: 200, background: "#111622", borderRight: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.1)" }}
                >
                  <span className="text-3xl">👤</span>
                </div>
              </div>
              <div className="pb-3 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs text-gray-300 break-all">teste5067@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://flagcdn.com/24x18/br.png" alt="Brasil" className="flex-shrink-0" />
                <span className="text-sm text-white">Brasil</span>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5">Data de registro</div>
                  <div className="text-xs text-white">03/02/26</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5">ID do usuário</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white font-mono">16967698</span>
                    <button onClick={() => navigator.clipboard.writeText("16967698")}>
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: menu */}
            <div className="flex-1 py-2 overflow-y-auto">
              {MENU_ITEMS.map(({ icon: Icon, label, badge, badgeColor, danger }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (label === "Depositar fundos") { onClose(); onDepositClick(); }
                    else if (label === "Sair") {
                      fetch("/api/auth/logout", { method: "POST" }).finally(() => {
                        window.location.href = "/";
                      });
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/[0.05]"
                  style={{ color: danger ? "#ef4444" : "rgba(255,255,255,0.85)" }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: danger ? "#ef4444" : "#64748b" }} />
                  <span className="flex-1 text-left">{label}</span>
                  {badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: badgeColor }}>
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
