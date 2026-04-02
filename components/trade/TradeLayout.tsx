"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TradeHeader from "./TradeHeader";
import TradeSidebar from "./TradeSidebar";
import PortfolioPanel from "./PortfolioPanel";
import HistoryPanel from "./HistoryPanel";
import TradePanel from "./TradePanel";
import TradeChart from "./TradeChart";
import DepositModal from "./DepositModal";
import { playOrderOpen, playWin, playLose } from "@/lib/sounds";

export type ApiAsset = {
  id: string; symbol: string; name: string; is_active: boolean;
  payout_m1: number; payout_m5: number; payout_m15: number; payout_h1: number;
  icon_url: string | null;
};

export type Tab = {
  id: string; name: string; type: string; icon_url: string | null; payout: number;
};

export type ActiveTrade = {
  id: string;
  tabId: string;
  tabName: string;
  tabIconUrl: string | null;
  direction: "up" | "down";
  amount: number;
  entryPrice: number;
  entryTime: number;
  expiresAt: number;
  accountType: "practice" | "real";
  payout: number;
  result?: "win" | "lose";
};


export type AccountType = "practice" | "real";

export type TradeHistoryEntry = {
  id: string;
  tabId: string;
  tabName: string;
  iconUrl: string | null;
  direction: "up" | "down";
  amount: number;
  payout: number;
  result: "win" | "lose";
  netProfit: number;
  accountType: AccountType;
  entryPrice: number;
  exitPrice: number;
  startedAt: number;   // ms when trade was placed (entryTime * 1000)
  resolvedAt: number;  // ms when trade resolved
};

// Crypto → CoinGecko small images
const CRYPTO_ICONS: Record<string, string> = {
  BTCUSD: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETHUSD: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOLUSD: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNBUSD: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  ADAUSD: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  XRPUSD: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
  DOTUSD: "https://assets.coingecko.com/coins/images/12171/small/polkadot.png",
  LTCUSD: "https://assets.coingecko.com/coins/images/2/small/litecoin.png",
};

// Forex pair → base currency flag code using flagcdn.com
const PAIR_FLAGS: Record<string, string> = {
  EURUSD: "eu", GBPUSD: "gb", USDJPY: "us", AUDUSD: "au",
  USDCAD: "us", USDCHF: "us", NZDUSD: "nz", EURGBP: "eu",
  EURJPY: "eu", EURCHF: "eu", GBPJPY: "gb", AUDJPY: "au",
  AUDCAD: "au", AUDCHF: "au", AUDNZD: "au",
  EURAUD: "eu", EURCAD: "eu", EURNZD: "eu",
  GBPAUD: "gb", GBPCAD: "gb", GBPCHF: "gb", GBPNOK: "gb", GBPNZD: "gb",
  NZDJPY: "nz", USDMXN: "us", USDNOK: "us", USDPLN: "us", USDSEK: "us",
};

// Special icons for metals and key synthetic indices
const SPECIAL_ICONS: Record<string, string> = {
  XAUUSD: "https://assets.coingecko.com/coins/images/22587/small/logo_PNG_Transparent.png",
  XAGUSD: "https://assets.coingecko.com/coins/images/14003/small/CACHE.png",
};

function forexIcon(pair: string): string | null {
  if (SPECIAL_ICONS[pair]) return SPECIAL_ICONS[pair];
  const flag = PAIR_FLAGS[pair];
  if (!flag) return null;
  return `https://flagcdn.com/48x36/${flag}.png`;
}

function toTab(a: ApiAsset): Tab {
  const base = a.id.replace("-OTC", "");
  // Always use our known-good icons; ignore any broken API icon_url
  const icon_url = CRYPTO_ICONS[base] ?? forexIcon(base);
  return {
    id: a.id, name: a.name,
    type: a.id.includes("OTC") ? "OTC" : "Binary",
    icon_url,
    payout: a.payout_m1,
  };
}

function applyPayoutOverrides(assets: ApiAsset[]): ApiAsset[] {
  try {
    const overrides = JSON.parse(localStorage.getItem("xd_asset_overrides") ?? "{}");
    return assets.map((a) => {
      const o = overrides[a.id];
      if (!o) return a;
      return {
        ...a,
        payout_m1:  o.payoutM1  ?? a.payout_m1,
        payout_m5:  o.payoutM5  ?? a.payout_m5,
        payout_m15: o.payoutM15 ?? a.payout_m15,
        payout_h1:  o.payoutH1  ?? a.payout_h1,
        is_active:  o.active    !== undefined ? o.active : a.is_active,
      };
    });
  } catch { return assets; }
}

export default function TradeLayout({ assets: rawAssets }: { assets: ApiAsset[] }) {
  const assets = applyPayoutOverrides(rawAssets);
  const defaultTabs = assets.slice(0, 6).map(toTab);

  const [openTabs, setOpenTabs] = useState<Tab[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("xd_open_tabs") ?? "null");
      if (Array.isArray(saved) && saved.length > 0) return saved;
    } catch {}
    return defaultTabs;
  });

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    try {
      const savedId = localStorage.getItem("xd_active_tab");
      const saved = JSON.parse(localStorage.getItem("xd_open_tabs") ?? "null");
      if (Array.isArray(saved) && savedId) {
        const found = saved.find((t: Tab) => t.id === savedId);
        if (found) return found;
      }
    } catch {}
    return defaultTabs[0];
  });
  const [accountType, setAccountType] = useState<AccountType>("practice");
  const [demoBalance, setDemoBalance] = useState(10000);
  const [realBalance, setRealBalance] = useState(0);

  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("xd_active_trades") ?? "[]") as ActiveTrade[];
      // discard already-expired trades on load
      return saved.filter((t) => !t.result && t.expiresAt > Date.now());
    } catch { return []; }
  });
  const activeTradesRef = useRef(activeTrades);
  activeTradesRef.current = activeTrades;
  const openTabsRef = useRef(openTabs);
  openTabsRef.current = openTabs;
  const [selectedExpMs, setSelectedExpMs] = useState(60_000);
  const [livePrice, setLivePrice]     = useState(0);
  const [liveTime, setLiveTime]       = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [sidebarPanel, setSidebarPanel] = useState<"portfolio" | "history" | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryEntry[]>([]);
  const [hoverDirection, setHoverDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    try { localStorage.setItem("xd_active_trades", JSON.stringify(activeTrades)); } catch {}
  }, [activeTrades]);

  useEffect(() => {
    try { localStorage.setItem("xd_open_tabs", JSON.stringify(openTabs)); } catch {}
  }, [openTabs]);

  useEffect(() => {
    try { localStorage.setItem("xd_active_tab", activeTab.id); } catch {}
  }, [activeTab.id]);

  const balance    = accountType === "practice" ? demoBalance : realBalance;
  const setBalance = accountType === "practice" ? setDemoBalance : setRealBalance;

  const removeTab = (id: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (activeTab.id === id && next.length > 0) setActiveTab(next[0]);
      return next;
    });
  };

  const addTab = (asset: ApiAsset) => {
    const tab = toTab(asset);
    setOpenTabs((prev) => prev.find((t) => t.id === tab.id) ? prev : [...prev, tab]);
    setActiveTab(tab);
  };

  // Stable ref so the chart's setInterval always calls the latest version
  const handlePriceChangeRef = useRef<(price: number, time: number) => void>(null!);

  const handlePriceChange = useCallback((price: number, time: number) => {
    handlePriceChangeRef.current(price, time);
  }, []);

  useEffect(() => {
    handlePriceChangeRef.current = (price: number, time: number) => {
      setLivePrice(price);
      setLiveTime(time);

      // Resolve expired trades — read from ref so we always have latest state
      const now = Date.now();
      const toResolve = activeTradesRef.current.filter((t) => t.expiresAt <= now && !t.result);
      if (!toResolve.length) return;

      const historyEntries: TradeHistoryEntry[] = [];
      toResolve.forEach((trade) => {
        const won =
          (trade.direction === "up"   && price > trade.entryPrice) ||
          (trade.direction === "down" && price < trade.entryPrice);

        const gain = won ? trade.amount + (trade.amount * trade.payout) / 100 : 0;
        const netProfit = won ? +(trade.amount * trade.payout / 100).toFixed(2) : -trade.amount;

        if (trade.accountType === "practice") {
          setDemoBalance((b) => +(b + gain).toFixed(2));
        } else {
          setRealBalance((b) => +(b + gain).toFixed(2));
        }

        const tabInfo = openTabsRef.current.find((t) => t.id === trade.tabId);
        historyEntries.push({
          id: trade.id,
          tabId: trade.tabId,
          tabName: tabInfo?.name ?? trade.tabId,
          iconUrl: tabInfo?.icon_url ?? null,
          direction: trade.direction,
          amount: trade.amount,
          payout: trade.payout,
          result: won ? "win" : "lose",
          netProfit,
          accountType: trade.accountType,
          entryPrice: trade.entryPrice,
          exitPrice: price,
          startedAt: trade.entryTime * 1000,
          resolvedAt: Date.now(),
        });
      });

      setTradeHistory((h) => {
        const existing = new Set(h.map((e) => e.id));
        const fresh = historyEntries.filter((e) => !existing.has(e.id));
        return fresh.length ? [...fresh, ...h] : h;
      });

      const anyWin  = historyEntries.some((e) => e.result === "win");
      const anyLose = historyEntries.some((e) => e.result === "lose");
      if (anyWin)        playWin();
      else if (anyLose)  playLose();

      setActiveTrades((prev) =>
        prev.map((t) =>
          toResolve.find((r) => r.id === t.id)
            ? {
                ...t,
                result:
                  (t.direction === "up" && price > t.entryPrice) ||
                  (t.direction === "down" && price < t.entryPrice)
                    ? "win"
                    : "lose",
              }
            : t
        )
      );

      // Remove resolved trades after 5s
      setTimeout(() => {
        setActiveTrades((prev) => prev.filter((t) => !t.result));
      }, 5000);
    };
  });

  const handleTrade = (direction: "up" | "down", amount: number, expiresMs: number) => {
    if (balance < amount) return;

    // Deduct balance immediately
    setBalance((b) => +(b - amount).toFixed(2));

    const id = `${Date.now()}-${Math.random()}`;
    const trade: ActiveTrade = {
      id,
      tabId: activeTab.id,
      tabName: activeTab.name,
      tabIconUrl: activeTab.icon_url,
      direction,
      amount,
      entryPrice: livePrice,
      entryTime: liveTime,
      expiresAt: Date.now() + expiresMs,
      accountType,
      payout: activeTab.payout,
    };

    setActiveTrades((prev) => [...prev, trade]);
    playOrderOpen();

  };

  const handleDeposit = (amount: number) => {
    setRealBalance((b) => +(b + amount).toFixed(2));
    setShowDeposit(false);
    setAccountType("real");
  };

  const activeTabTrades = activeTrades.filter((t) => t.tabId === activeTab.id);

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: "var(--color-background)", color: "var(--color-text)" }}
    >
      <TradeHeader
        tabs={openTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        removeTab={removeTab}
        allAssets={assets}
        addTab={addTab}
        accountType={accountType}
        setAccountType={setAccountType}
        demoBalance={demoBalance}
        realBalance={realBalance}
        onDepositClick={() => setShowDeposit(true)}
        onReloadDemo={() => setDemoBalance(10000)}
      />

      {/* ── Desktop layout ── */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
        <TradeSidebar
          activePanel={sidebarPanel}
          setActivePanel={setSidebarPanel}
          openTradeCount={activeTrades.filter((t) => !t.result).length}
        />
        {sidebarPanel === "portfolio" && (
          <PortfolioPanel activeTrades={activeTrades} onClose={() => setSidebarPanel(null)} />
        )}
        {sidebarPanel === "history" && (
          <HistoryPanel history={tradeHistory} accountType={accountType} onClose={() => setSidebarPanel(null)} />
        )}
        <div className="flex-1 flex overflow-hidden">
          <TradeChart
            tab={activeTab}
            activeTrades={activeTabTrades}
            onPriceChange={handlePriceChange}
            expiryMs={selectedExpMs}
            hoverDirection={hoverDirection}
          />
          <TradePanel
            tab={activeTab}
            accountType={accountType}
            balance={balance}
            currentPrice={livePrice}
            activeTrades={activeTabTrades}
            onTrade={handleTrade}
            expiryMs={selectedExpMs}
            onExpiryChange={setSelectedExpMs}
            onSwitchAccount={() => accountType === "practice" ? setAccountType("real") : setAccountType("practice")}
            onDepositClick={() => setShowDeposit(true)}
            onHoverChange={setHoverDirection}
          />
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="relative flex md:hidden flex-col flex-1 overflow-hidden min-h-0">
        {/* Chart — takes remaining space */}
        <div className="flex-1 overflow-hidden min-h-0">
          <TradeChart
            tab={activeTab}
            activeTrades={activeTabTrades}
            onPriceChange={handlePriceChange}
            expiryMs={selectedExpMs}
            hoverDirection={hoverDirection}
          />
        </div>

        {/* Mobile trade panel — compact bottom section */}
        <TradePanel
          tab={activeTab}
          accountType={accountType}
          balance={balance}
          currentPrice={livePrice}
          activeTrades={activeTabTrades}
          onTrade={handleTrade}
          expiryMs={selectedExpMs}
          onExpiryChange={setSelectedExpMs}
          onSwitchAccount={() => accountType === "practice" ? setAccountType("real") : setAccountType("practice")}
          onDepositClick={() => setShowDeposit(true)}
          onHoverChange={setHoverDirection}
          mobile
        />

        {/* Mobile bottom nav */}
        <div
          className="flex items-center justify-around border-t flex-shrink-0"
          style={{ background: "var(--color-third)", borderColor: "var(--color-border)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <button
            onClick={() => setSidebarPanel(sidebarPanel === "portfolio" ? null : "portfolio")}
            className="flex flex-col items-center gap-0.5 py-2 px-4 relative"
            style={{ color: sidebarPanel === "portfolio" ? "var(--color-primary)" : "var(--color-icons)" }}
          >
            {activeTrades.filter(t => !t.result).length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: "var(--color-primary)" }}>
                {activeTrades.filter(t => !t.result).length}
              </span>
            )}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2" /></svg>
            <span className="text-[9px] font-medium">Portfólio</span>
          </button>
          <button
            onClick={() => setSidebarPanel(sidebarPanel === "history" ? null : "history")}
            className="flex flex-col items-center gap-0.5 py-2 px-4"
            style={{ color: sidebarPanel === "history" ? "var(--color-primary)" : "var(--color-icons)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[9px] font-medium">Histórico</span>
          </button>
          <button
            onClick={() => setShowDeposit(true)}
            className="flex flex-col items-center gap-0.5 py-2 px-4"
            style={{ color: "var(--color-icons)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-[9px] font-medium">Depósito</span>
          </button>
        </div>

        {/* Mobile panels overlay */}
        {sidebarPanel === "portfolio" && (
          <div className="absolute inset-0 z-50" style={{ top: 56 }}>
            <PortfolioPanel activeTrades={activeTrades} onClose={() => setSidebarPanel(null)} />
          </div>
        )}
        {sidebarPanel === "history" && (
          <div className="absolute inset-0 z-50" style={{ top: 56 }}>
            <HistoryPanel history={tradeHistory} accountType={accountType} onClose={() => setSidebarPanel(null)} />
          </div>
        )}
      </div>

      {showDeposit && (
        <DepositModal
          onDeposit={handleDeposit}
          onClose={() => setShowDeposit(false)}
        />
      )}
    </div>
  );
}
