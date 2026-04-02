"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Bell, ChevronDown } from "lucide-react";
import type { Tab, ApiAsset, AccountType } from "./TradeLayout";
import AssetPicker from "./AssetPicker";
import ProfilePanel from "./ProfilePanel";
import ZyroLogo from "@/components/ZyroLogo";

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
  onReloadDemo: () => void;
}

export default function TradeHeader({
  tabs, activeTab, setActiveTab, removeTab,
  allAssets, addTab,
  accountType, setAccountType,
  demoBalance, realBalance,
  onDepositClick, onReloadDemo,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [showBalancePanel, setShowBalancePanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const [profilePos, setProfilePos] = useState({ top: 0, right: 0 });
  const btnRef     = useRef<HTMLButtonElement>(null);
  const avatarRef  = useRef<HTMLButtonElement>(null);
  const panelRef   = useRef<HTMLDivElement>(null);

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

        {/* Desktop: Asset Tabs */}
        <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto overflow-y-hidden flex-nowrap scrollbar-hide h-full py-1.5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <div
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => e.key === "Enter" && setActiveTab(tab)}
                className="relative flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer select-none flex-shrink-0 h-full transition-colors"
                style={{
                  background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                  borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
                  minWidth: 120,
                }}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                  className="absolute top-0.5 left-0.5 w-3.5 h-3.5 flex items-center justify-center opacity-50 hover:opacity-100"
                >
                  <X className="w-2.5 h-2.5 text-gray-400" strokeWidth={3} />
                </button>
                <div
                  className="w-7 h-7 rounded overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  {tab.icon_url
                    ? <img src={tab.icon_url} alt={tab.name} className="w-full h-full object-contain p-0.5" />
                    : <span className="text-[10px] font-bold text-gray-400">{tab.id.replace("-OTC","").slice(0,3)}</span>
                  }
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-white truncate leading-tight">{tab.name}</span>
                  <span className="text-[9px] text-gray-500 font-medium">{tab.type}</span>
                </div>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-white/5 transition-colors"
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
                className="fixed rounded-xl shadow-2xl"
                style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.08)", zIndex: 9999, top: panelPos.top, right: Math.max(panelPos.right, 8), left: 8, maxWidth: 440 }}
              >
                <div className="flex">
                  {/* Left summary */}
                  <div className="flex-shrink-0 p-4 text-xs" style={{ width: 168, background: "#111622", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
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

          <button
            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <Bell className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={onDepositClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
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
            className="flex-shrink-0 rounded-full overflow-hidden hover:opacity-90 transition-opacity"
            style={{ width: 34, height: 34, border: "2px solid var(--color-primary)" }}
          >
            <div
              className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#f97316,#ea6c0a)" }}
            >
              Z
            </div>
          </button>
        </div>
      </header>

      {showProfile && (
        <ProfilePanel
          pos={profilePos}
          onClose={() => setShowProfile(false)}
          onDepositClick={onDepositClick}
        />
      )}

      {showPicker && (
        <AssetPicker
          assets={allAssets}
          openTabIds={openTabIds}
          onSelect={addTab}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
