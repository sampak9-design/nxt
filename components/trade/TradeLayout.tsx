"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import TradeHeader from "./TradeHeader";
import TradeSidebar from "./TradeSidebar";
import PortfolioPanel from "./PortfolioPanel";
import HistoryPanel from "./HistoryPanel";
import TradePanel from "./TradePanel";
import TradeChart from "./TradeChart";
import DepositModal from "./DepositModal";

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

export type TradeEntry = {
  id: string; time: number; price: number;
  direction: "up" | "down"; amount: string;
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

// Forex pair → two flag URLs (base / quote) using flagcdn.com
const PAIR_FLAGS: Record<string, [string, string]> = {
  EURUSD: ["eu", "us"], GBPUSD: ["gb", "us"], USDJPY: ["us", "jp"],
  AUDUSD: ["au", "us"], USDCAD: ["us", "ca"], USDCHF: ["us", "ch"],
  NZDUSD: ["nz", "us"], EURGBP: ["eu", "gb"], EURJPY: ["eu", "jp"],
  EURCHF: ["eu", "ch"], GBPJPY: ["gb", "jp"], AUDJPY: ["au", "jp"],
};

function forexIcon(pair: string): string | null {
  const flags = PAIR_FLAGS[pair];
  if (!flags) return null;
  // Return base currency flag as the icon
  return `https://flagcdn.com/48x36/${flags[0]}.png`;
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
  const tabs = assets.slice(0, 6).map(toTab);

  const [activeTab, setActiveTab]     = useState<Tab>(tabs[0]);
  const [openTabs, setOpenTabs]       = useState<Tab[]>(tabs);
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
  const [, setEntries]                = useState<TradeEntry[]>([]);
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

  const handlePriceChange = useCallback((price: number, time: number) => {
    setLivePrice(price);
    setLiveTime(time);

    // Resolve expired trades
    const now = Date.now();
    setActiveTrades((prev) => {
      const toResolve = prev.filter((t) => t.expiresAt <= now && !t.result);
      if (!toResolve.length) return prev;

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

        // Find tab info from openTabs snapshot via tabId
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
      if (historyEntries.length) {
        setTradeHistory((h) => {
          const existing = new Set(h.map((e) => e.id));
          const fresh = historyEntries.filter((e) => !existing.has(e.id));
          return fresh.length ? [...fresh, ...h] : h;
        });
      }

      // Mark resolved
      return prev.map((t) =>
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
      );
    });

    // Remove resolved trades after 3s
    setTimeout(() => {
      setActiveTrades((prev) => prev.filter((t) => !t.result));
      setEntries((prev) => {
        const activeIds = new Set(activeTrades.filter((t) => !t.result).map((t) => t.id));
        return prev.filter((e) => activeIds.has(e.id));
      });
    }, 5000);
  }, [activeTrades]);

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
    setEntries((prev) => [
      ...prev,
      { id, time: liveTime, price: livePrice, direction, amount: String(amount) },
    ]);

  };

  const handleDeposit = (amount: number) => {
    setRealBalance((b) => +(b + amount).toFixed(2));
    setShowDeposit(false);
    setAccountType("real");
  };

  const activeTabTrades = activeTrades.filter((t) => t.tabId === activeTab.id);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
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
      <div className="flex flex-1 overflow-hidden">
        <TradeSidebar
          activePanel={sidebarPanel}
          setActivePanel={setSidebarPanel}
          openTradeCount={activeTrades.filter((t) => !t.result).length}
        />
        {sidebarPanel === "portfolio" && (
          <PortfolioPanel
            activeTrades={activeTrades}
            onClose={() => setSidebarPanel(null)}
          />
        )}
        {sidebarPanel === "history" && (
          <HistoryPanel
            history={tradeHistory}
            accountType={accountType}
            onClose={() => setSidebarPanel(null)}
          />
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
            onSwitchAccount={() =>
              accountType === "practice"
                ? setAccountType("real")
                : setAccountType("practice")
            }
            onDepositClick={() => setShowDeposit(true)}
            onHoverChange={setHoverDirection}
          />
        </div>
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
