"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Bell, ChevronDown } from "lucide-react";
import type { Tab, ApiAsset, AccountType, ActiveTrade } from "./TradeLayout";
import AssetPicker from "./AssetPicker";
import ProfilePanel from "./ProfilePanel";
import ZyroLogo from "@/components/ZyroLogo";
import UserAvatar from "@/components/UserAvatar";

interface Props {
  tabs: Tab[];
  activeTab: Tab;
  setActiveTab: (t: Tab) => void;
  removeTab: (id: string) => void;
  allAssets: ApiAsset[];
  addTab: (a: ApiAsset) => void;
  accountType: AccountType;
  setAccountType: (t: AccountType) => void;
  demoBalance: number;
  realBalance: number;
  onDepositClick: () => void;
  onSupportClick?: () => void;
  onReloadDemo: () => void;
  chartGrid: number;
  setChartGrid: (n: number) => void;
  reorderTabs: (from: number, to: number) => void;
  activeTrades: ActiveTrade[];
  livePrice: number;
}

function TabCountdown({ expiresAt, size = 24 }: { expiresAt: number; size?: number }) {
  const [s, setS] = useState(0);
  const [total] = useState(() => Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000)));
  useEffect(() => {
    const tick = () => setS(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  if (s <= 0) return null;
  const progress = s / total;
  const r = (size - 3) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);
  const display = s < 60 ? `:${String(s).padStart(2, "0")}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fff" strokeWidth={2}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <span className="text-[8px] font-mono font-bold text-white leading-none">{display}</span>
    </div>
  );
}

export default function TradeHeader({
  tabs, activeTab, setActiveTab, removeTab,
  allAssets, addTab,
  accountType, setAccountType,
  demoBalance, realBalance,
  onDepositClick, onSupportClick, onReloadDemo,
  chartGrid, setChartGrid,
  reorderTabs,
  activeTrades,
  livePrice,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showGridMenu) return;
    const h = (e: MouseEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) setShowGridMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showGridMenu]);
  const [showBalancePanel, setShowBalancePanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const [profilePos, setProfilePos] = useState({ top: 0, right: 0 });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("Z");
  const [isVip, setIsVip] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>("none");
  const [unreadTickets, setUnreadTickets] = useState(0);
  const [notifTickets, setNotifTickets] = useState<{ id: number; subject: string; last_admin_msg: string }[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const btnRef     = useRef<HTMLButtonElement>(null);
  const avatarRef  = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

  // Poll unread ticket replies every 15s
  useEffect(() => {
    const poll = () => {
      fetch("/api/tickets").then(r => r.json()).then(d => {
        if (d.tickets) {
          setUnreadTickets(d.tickets.reduce((s: number, t: any) => s + (t.unread_admin ?? 0), 0));
          setNotifTickets(d.tickets.filter((t: any) => (t.unread_admin ?? 0) > 0).map((t: any) => ({
            id: t.id, subject: t.subject, last_admin_msg: t.last_admin_msg ?? "",
          })));
        }
      }).catch(() => {});
    };
    poll();
    const iv = setInterval(poll, 15000);
    return () => clearInterval(iv);
  }, []);

  // Close notif popup on outside click
  useEffect(() => {
    if (!showNotifs) return;
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node) &&
          bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showNotifs]);

  // Load avatar on mount and when profile closes (avatar may have changed)
  const loadAvatar = () => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setInitials(`${d.user.first_name[0]}${d.user.last_name[0]}`.toUpperCase());
        setAvatarUrl(d.user.avatar_url ? `${d.user.avatar_url}?t=${Date.now()}` : null);
        setIsVip(!!d.user.is_marketing);
        setKycStatus(d.user.kyc_status || "none");
      }
    }).catch(() => {});
  };
  useEffect(() => { loadAvatar(); }, []);

  const balance    = accountType === "practice" ? demoBalance : realBalance;
  const openTabIds = new Set(tabs.map((t) => t.id));

  const openPanel = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPanelPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setShowBalancePanel(v => !v);
  };

  // Close panel on outside click
  useEffect(() => {
    if (!showBalancePanel) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) {
        setShowBalancePanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showBalancePanel]);

  return (
    <>
      <header
        className="flex items-center h-[56px] px-3 border-b flex-shrink-0 gap-3"
        style={{ borderColor: "var(--color-border)", background: "var(--color-third)" }}
      >
        {/* Logo */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0 mr-1">
          <ZyroLogo size={28} />
          <span className="text-lg font-bold text-orange-500 whitespace-nowrap">ZyroOption</span>
        </div>

        {/* Mobile: active asset button */}
        <button
          onClick={() => setShowPicker(true)}
          className="flex md:hidden items-center gap-2 px-2 py-1 rounded-lg flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {activeTab.icon_url
            ? <img src={activeTab.icon_url} alt={activeTab.name} className="w-5 h-5 object-contain" />
            : <span className="text-[10px] font-bold text-gray-400">{activeTab.id.replace("-OTC","").slice(0,3)}</span>
          }
          <span className="text-xs font-semibold text-white">{activeTab.name}</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {/* Chart grid layout button */}
        <div ref={gridMenuRef} className="hidden md:block relative flex-shrink-0">
          <button
            title="Configuração dos gráficos"
            onClick={() => setShowGridMenu(v => !v)}
            style={{
              width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s",
              background: showGridMenu || chartGrid > 1 ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${showGridMenu || chartGrid > 1 ? "rgba(249,115,22,0.5)" : "transparent"}`,
              color: showGridMenu || chartGrid > 1 ? "#f97316" : "#94a3b8",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
          {showGridMenu && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 9999,
              background: "rgba(13,17,28,0.98)", borderRadius: 12, padding: "14px 16px",
              border: "1px solid rgba(255,255,255,0.12)", minWidth: 240,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>CONFIGURAÇÃO DOS GRÁFICOS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8", width: 64, flexShrink: 0 }}>1 gráfico</span>
                  <button
                    onClick={() => { setChartGrid(1); setShowGridMenu(false); }}
                    style={{
                      width: 36, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      background: chartGrid === 1 ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${chartGrid === 1 ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <svg width="18" height="14" viewBox="0 0 18 14" fill={chartGrid === 1 ? "#f97316" : "#64748b"}><rect x="1" y="1" width="16" height="12" rx="1.5" /></svg>
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "#94a3b8", width: 64, flexShrink: 0 }}>4 gráficos</span>
                  <button
                    onClick={() => { setChartGrid(4); setShowGridMenu(false); }}
                    style={{
                      width: 36, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      background: chartGrid === 4 ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${chartGrid === 4 ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <svg width="18" height="14" viewBox="0 0 18 14" fill={chartGrid === 4 ? "#f97316" : "#64748b"}>
                      <rect x="1" y="1" width="7" height="5.5" rx="1" />
                      <rect x="10" y="1" width="7" height="5.5" rx="1" />
                      <rect x="1" y="7.5" width="7" height="5.5" rx="1" />
                      <rect x="10" y="7.5" width="7" height="5.5" rx="1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Asset Tabs */}
        <style>{`
          @keyframes tab-wiggle {
            0%, 100% { transform: rotate(-1.5deg); }
            50% { transform: rotate(1.5deg); }
          }
          .tab-wiggle { animation: tab-wiggle 0.25s ease-in-out infinite; }
        `}</style>
        <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto overflow-y-hidden flex-nowrap scrollbar-hide h-full py-1.5">
          {tabs.map((tab, idx) => {
            const isActive = tab.id === activeTab.id;
            const isDragging = dragIdx === idx;
            const isDropTarget = dropIdx === idx && dropIdx !== dragIdx;
            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e) => {
                  setDragIdx(idx);
                  e.dataTransfer.effectAllowed = "move";
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.opacity = "0.4";
                  }
                }}
                onDragEnd={(e) => {
                  if (e.currentTarget instanceof HTMLElement) {
                    e.currentTarget.style.opacity = "1";
                  }
                  if (dragIdx !== null && dropIdx !== null && dragIdx !== dropIdx) {
                    reorderTabs(dragIdx, dropIdx);
                  }
                  setDragIdx(null);
                  setDropIdx(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropIdx(idx);
                }}
                onDragLeave={() => {
                  if (dropIdx === idx) setDropIdx(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                }}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => e.key === "Enter" && setActiveTab(tab)}
                className={`relative flex items-center gap-1.5 px-2 py-1 rounded cursor-grab select-none flex-shrink-0 h-full transition-all hover:bg-white/10 hover:brightness-110 ${dragIdx !== null ? "tab-wiggle" : ""}`}
                style={(() => {
                  const trade = activeTrades.find(t => t.tabId === tab.id && !t.result);
                  const hasTrade = !!trade;
                  const winning = hasTrade && (trade.direction === "up" ? livePrice > trade.entryPrice : livePrice < trade.entryPrice);
                  return {
                    background: hasTrade
                      ? (winning ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)")
                      : (isActive ? "rgba(255,255,255,0.1)" : "transparent"),
                    borderBottom: hasTrade
                      ? `2px solid ${winning ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`
                      : (isActive ? "2px solid var(--color-primary)" : "2px solid transparent"),
                    minWidth: 120,
                    opacity: isDragging ? 0.4 : 1,
                    borderLeft: isDropTarget ? "2px solid var(--color-primary)" : "2px solid transparent",
                  };
                })()}
              >
                <button
                  type="button"
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeTab(tab.id); }}
                  className="absolute top-0 left-0 w-5 h-5 flex items-center justify-center opacity-40 hover:opacity-100 z-10 rounded-full hover:bg-white/10 transition-all"
                >
                  <X className="w-3 h-3 text-gray-400" strokeWidth={3} />
                </button>
                <div className="relative flex-shrink-0" style={{ width: 28, height: 28 }}>
                  {(() => {
                    const trade = activeTrades.find(t => t.tabId === tab.id && !t.result);
                    if (trade) {
                      return (
                        <div className="flex items-center justify-center w-full h-full">
                          <TabCountdown expiresAt={trade.expiresAt} size={28} />
                        </div>
                      );
                    }
                    return (
                      <div
                        className="w-7 h-7 rounded overflow-hidden flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                      >
                        {tab.icon_url
                          ? <img src={tab.icon_url} alt={tab.name} className="w-full h-full object-contain p-0.5" />
                          : <span className="text-[10px] font-bold text-gray-400">{tab.id.replace("-OTC","").slice(0,3)}</span>
                        }
                      </div>
                    );
                  })()}
                </div>
                {(() => {
                  const trade = activeTrades.find(t => t.tabId === tab.id && !t.result);
                  if (trade) {
                    const winning = trade.direction === "up"
                      ? livePrice > trade.entryPrice
                      : livePrice < trade.entryPrice;
                    const profit = winning ? +(trade.amount * trade.payout / 100).toFixed(2) : 0;
                    return (
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs font-semibold text-white truncate leading-tight">{tab.name}</span>
                        <span className="text-[10px] font-bold" style={{ color: winning ? "#22c55e" : "#ef4444" }}>
                          {winning ? `+R$${profit}` : `-R$${trade.amount.toFixed(2)}`}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-white truncate leading-tight">{tab.name}</span>
                      <span className="text-[9px] text-gray-500 font-medium">{tab.type}</span>
                    </div>
                  );
                })()}
                {(() => {
                  const trade = activeTrades.find(t => t.tabId === tab.id && !t.result);
                  if (!trade) return null;
                  const winning = trade.direction === "up"
                    ? livePrice > trade.entryPrice
                    : livePrice < trade.entryPrice;
                  return (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: winning ? "#22c55e" : "#ef4444" }} />
                  );
                })()}
              </div>
            );
          })}

          <button
            onClick={() => setShowPicker(true)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-white/10 transition-colors flex-shrink-0 ml-1"
            title="Adicionar ativo"
          >
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
          {/* Balance button + dropdown */}
          <div className="relative">
            <button
              ref={btnRef}
              onClick={openPanel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/10 hover:brightness-110 transition-all"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div className="flex flex-col items-end leading-none">
                <span className="text-[9px] font-medium" style={{ color: accountType === "practice" ? "#f97316" : "#10b981" }}>
                  {accountType === "practice" ? "CONTA DE PRÁTICA" : "CONTA REAL"}
                </span>
                <span className="text-sm font-bold" style={{ color: accountType === "practice" ? "#f97316" : "#10b981" }}>
                  R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {showBalancePanel && (
              <div
                ref={panelRef}
                className="fixed rounded-xl shadow-2xl balance-panel"
                style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.08)", zIndex: 9999, top: panelPos.top, right: panelPos.right, width: 440 }}
              >
                {/* Mobile: stretch to screen */}
                <style>{`@media (max-width: 768px) { .balance-panel { left: 8px !important; right: 8px !important; width: auto !important; } }`}</style>
                <div className="flex flex-col md:flex-row">
                  {/* Left summary */}
                  <div className="flex-shrink-0 p-4 text-xs md:w-[168px]" style={{ background: "#111622", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="font-semibold text-white mb-3 text-[11px] whitespace-nowrap">
                      {accountType === "practice" ? "CONTA DE PRÁTICA" : "CONTA REAL"}
                    </div>
                    {[
                      { label: "Disponível", value: `R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
                      { label: "Investido",  value: "--" },
                      { label: "Lucro",      value: "--" },
                      { label: "Total",      value: `R$ ${balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-3 mb-2">
                        <span className="text-gray-500 whitespace-nowrap">{label}</span>
                        <span className="text-white font-medium whitespace-nowrap">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Right accounts list */}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="text-[10px] font-semibold text-gray-500 mb-3 tracking-wide">MEUS SALDOS</div>

                    {/* Real account */}
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg mb-2 cursor-pointer"
                      style={{ background: accountType === "real" ? "rgba(255,255,255,0.06)" : "transparent" }}
                      onClick={() => { setAccountType("real"); setShowBalancePanel(false); }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#10b981" }}>RS</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-white whitespace-nowrap">CONTA REAL</div>
                        <div className="text-[11px] font-bold whitespace-nowrap" style={{ color: "#10b981" }}>
                          R$ {realBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowBalancePanel(false); onDepositClick(); }}
                        className="text-[10px] px-2 py-1 rounded text-white font-medium flex-shrink-0 whitespace-nowrap"
                        style={{ background: "rgba(255,255,255,0.1)" }}
                      >Depositar</button>
                    </div>

                    {/* Practice account */}
                    <div
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer"
                      style={{ background: accountType === "practice" ? "rgba(255,255,255,0.06)" : "transparent" }}
                      onClick={() => { setAccountType("practice"); setShowBalancePanel(false); }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "#f97316" }}>$</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-white whitespace-nowrap">CONTA DE PRÁTICA</div>
                        <div className="text-[11px] font-bold whitespace-nowrap" style={{ color: "#f97316" }}>
                          R$ {demoBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <button
                        className="text-[10px] px-2 py-1 rounded text-gray-400 font-medium flex-shrink-0 whitespace-nowrap"
                        style={{ background: "rgba(255,255,255,0.06)" }}
                        onClick={(e) => { e.stopPropagation(); onReloadDemo(); setShowBalancePanel(false); }}
                      >Recarregar</button>
                    </div>

                    {/* Margin trading CTA */}
                    <div className="mt-3 p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="text-[11px] font-bold text-white mb-1">NEGOCIAÇÃO COM MARGEM</div>
                      <div className="text-[10px] text-gray-500 mb-2">Aproveite o Forex totalmente alavancado com a nova interface e saldo de margem</div>
                      <button
                        className="w-full py-1.5 rounded text-[11px] font-bold text-white"
                        style={{ background: "#f97316" }}
                      >ATIVAR</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="hidden md:block relative">
            <button
              ref={bellRef}
              onClick={() => { setShowNotifs(v => !v); setShowBalancePanel(false); setShowProfile(false); }}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <Bell className="w-4 h-4 text-gray-400" />
              {unreadTickets > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white px-1">{unreadTickets}</span>
              )}
            </button>

            {/* Notification popup */}
            {showNotifs && (
              <div ref={notifRef} className="absolute top-full right-0 mt-2 w-72 rounded-xl overflow-hidden shadow-2xl z-[100]"
                style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs font-bold text-white">Notificações</span>
                  {unreadTickets > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{unreadTickets} nova{unreadTickets > 1 ? "s" : ""}</span>
                  )}
                </div>
                {notifTickets.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-gray-600">Nenhuma notificação</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {notifTickets.map(t => (
                      <button key={t.id}
                        onClick={async () => {
                          await fetch("/api/tickets", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "mark_read", ticketId: t.id }),
                          });
                          setNotifTickets(prev => prev.filter(x => x.id !== t.id));
                          setUnreadTickets(prev => Math.max(0, prev - 1));
                          setShowNotifs(false);
                          onSupportClick?.();
                        }}
                        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))" }}>
                          <span className="text-[11px] font-bold text-emerald-400">S</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-bold text-orange-400">Suporte</div>
                          <div className="text-[12px] text-white font-medium truncate">{t.subject}</div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">{t.last_admin_msg}</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onDepositClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:brightness-125 hover:bg-white/10"
            style={{ background: "#34A93E" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Depósito</span>
          </button>

          <button
            ref={avatarRef}
            onClick={() => {
              if (avatarRef.current) {
                const r = avatarRef.current.getBoundingClientRect();
                setProfilePos({ top: r.bottom + 8, right: window.innerWidth - r.right });
              }
              setShowProfile(v => !v);
              setShowBalancePanel(false);
            }}
            className={`flex items-center gap-1 flex-shrink-0 hover:brightness-125 transition-all ${isVip ? "ml-3" : ""}`}
          >
            <UserAvatar avatarUrl={avatarUrl} isVip={isVip} kycStatus={kycStatus} size={36} />
            <svg width="10" height="7" viewBox="0 0 10 7" fill="#6b7280">
              <path d="M0 0 L10 0 L5 7 Z" />
            </svg>
          </button>
        </div>
      </header>

      {showProfile && (
        <ProfilePanel
          pos={profilePos}
          onClose={() => { setShowProfile(false); loadAvatar(); }}
          onDepositClick={onDepositClick}
          onSupportClick={onSupportClick}
        />
      )}

      {showPicker && (
        <AssetPicker
          assets={allAssets}
          openTabIds={openTabIds}
          activeTabId={activeTab.id}
          onSelect={addTab}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
