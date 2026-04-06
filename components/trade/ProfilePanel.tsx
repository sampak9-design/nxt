"use client";

import { useEffect, useRef, useState } from "react";
import {
  Crown, Camera, ArrowDownCircle, ArrowUpCircle,
  FileText, HelpCircle, DollarSign, Clock, Key, Settings, LogOut, Copy, X,
} from "lucide-react";
import SettingsModal from "./SettingsModal";

interface Props {
  pos: { top: number; right: number };
  onClose: () => void;
  onDepositClick: () => void;
}

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string | null;
};

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
  const ref      = useRef<HTMLDivElement>(null);
  const fileRef  = useRef<HTMLInputElement>(null);
  const [user, setUser]         = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Load current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setAvatarUrl(d.user.avatar_url ? `${d.user.avatar_url}?t=${Date.now()}` : null);
        }
      })
      .catch(() => {});
  }, []);

  // Close on outside click (disabled while settings modal is open)
  useEffect(() => {
    if (showSettings) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose, showSettings]);

  const handleAvatarUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
    if (res.ok) {
      const d = await res.json();
      setAvatarUrl(`${d.avatar_url}?t=${Date.now()}`);
    }
  };

  const handleMenuClick = (label: string) => {
    if (label === "Carregar uma foto") {
      fileRef.current?.click();
      return;
    }
    if (label === "Depositar fundos") { onClose(); onDepositClick(); return; }
    if (label === "Retirar fundos") { window.location.href = "/withdraw"; return; }
    if (label === "Verificar documentos") { window.location.href = "/verify"; return; }
    if (label === "Configurações") { setShowSettings(true); return; }
    if (label === "Sair") {
      fetch("/api/auth/logout", { method: "POST" }).finally(() => {
        window.location.href = "/";
      });
      return;
    }
    onClose();
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
  const displayName = user ? `${user.first_name} ${user.last_name}` : "";
  const initials    = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "Z";

  const Avatar = ({ size = 40, textSize = "text-lg" }: { size?: number; textSize?: string }) => (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden`}
      style={{ width: size, height: size, background: avatarUrl ? "transparent" : "linear-gradient(135deg,#f97316,#ea6c0a)", border: "2px solid rgba(255,255,255,0.15)" }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        : <span className={`${textSize} font-bold text-white`}>{initials}</span>
      }
    </div>
  );

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }}
      />

      {/* Backdrop — mobile only */}
      {isMobile && (
        <div className="fixed inset-0 z-[9998]" style={{ background: "rgba(0,0,0,0.55)" }} onMouseDown={onClose} />
      )}

      <div
        ref={ref}
        className="fixed rounded-xl shadow-2xl overflow-hidden"
        style={{
          zIndex: 9999,
          background: "#161c2c",
          border: "1px solid rgba(255,255,255,0.08)",
          ...(isMobile
            ? { top: 64, left: 8, right: 8, width: "auto" }
            : { top: pos.top, right: pos.right, width: 520 }),
        }}
      >
        {isMobile ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#111622", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Avatar size={40} textSize="text-base" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{displayName}</div>
                <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-gray-500 font-mono">ID: {user?.id}</span>
                  <button onClick={() => user && navigator.clipboard.writeText(String(user.id))}>
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="py-1 max-h-[70vh] overflow-y-auto">
              {MENU_ITEMS.map(({ icon: Icon, label, badge, badgeColor, danger }) => (
                <button
                  key={label}
                  onClick={() => handleMenuClick(label)}
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
          <div className="flex" style={{ width: 520 }}>
            <div className="flex flex-col p-5 gap-4 flex-shrink-0" style={{ width: 200, background: "#111622", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex flex-col items-center gap-2">
                <Avatar size={64} textSize="text-2xl" />
                <div className="text-sm font-semibold text-white text-center">{displayName}</div>
              </div>
              <div className="pb-3 text-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs text-gray-400 break-all">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src="https://flagcdn.com/24x18/br.png" alt="Brasil" className="flex-shrink-0" />
                <span className="text-sm text-white">Brasil</span>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <div className="text-[10px] text-gray-500 mb-0.5">ID do usuário</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-white font-mono">{user?.id}</span>
                    <button onClick={() => user && navigator.clipboard.writeText(String(user.id))}>
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 py-2 overflow-y-auto">
              {MENU_ITEMS.map(({ icon: Icon, label, badge, badgeColor, danger }) => (
                <button
                  key={label}
                  onClick={() => handleMenuClick(label)}
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
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
