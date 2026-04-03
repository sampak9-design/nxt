"use client";

import { useState, useEffect } from "react";
import { X, Search, Star, Info } from "lucide-react";
import type { ApiAsset } from "./TradeLayout";

/* ── Icon resolution (mirrors TradeLayout) ───────────────────────────── */
const CRYPTO_ICONS: Record<string, string> = {
  BTCUSD: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETHUSD: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOLUSD: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  BNBUSD: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
  ADAUSD: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
  XRPUSD: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
};

const PAIR_FLAGS: Record<string, string> = {
  EURUSD: "eu", GBPUSD: "gb", USDJPY: "us", AUDUSD: "au",
  USDCAD: "us", USDCHF: "us", NZDUSD: "nz", EURGBP: "eu",
  EURJPY: "eu", EURCHF: "eu", GBPJPY: "gb", AUDJPY: "au",
  AUDCAD: "au", AUDCHF: "au", AUDNZD: "au",
  EURAUD: "eu", EURCAD: "eu", EURNZD: "eu",
  GBPAUD: "gb", GBPCAD: "gb", GBPCHF: "gb", GBPNOK: "gb", GBPNZD: "gb",
  NZDJPY: "nz", USDMXN: "us", USDNOK: "us", USDPLN: "us", USDSEK: "us",
};

const METAL_ICONS: Record<string, string> = {
  XAUUSD: "https://assets.coingecko.com/coins/images/22587/small/logo_PNG_Transparent.png",
  XAGUSD: "https://assets.coingecko.com/coins/images/14003/small/CACHE.png",
};

function getIconUrl(id: string): string | null {
  const base = id.replace("-OTC", "");
  if (CRYPTO_ICONS[base]) return CRYPTO_ICONS[base];
  if (METAL_ICONS[base])  return METAL_ICONS[base];
  if (PAIR_FLAGS[base])   return `https://flagcdn.com/48x36/${PAIR_FLAGS[base]}.png`;
  return null;
}

/* ── Category ─────────────────────────────────────────────────────────── */
type Category = "favoritos" | "todos" | "forex" | "crypto" | "commodities" | "sinteticos" | "acoes" | "otc";

function categorize(a: ApiAsset): Category {
  const base = a.id.replace("-OTC", "");
  if (a.id.startsWith("OTC_") || a.id.includes("-OTC")) return "otc";
  if (CRYPTO_ICONS[base])    return "crypto";
  if (METAL_ICONS[base])     return "commodities";
  if (/^(R_|1HZ|JD\d)/.test(base)) return "sinteticos";
  return "forex";
}

const SIDEBAR: { key: Category; label: string }[] = [
  { key: "todos",       label: "Todos" },
  { key: "forex",       label: "Pares de moedas" },
  { key: "crypto",      label: "Crypto" },
  { key: "commodities", label: "Commodities" },
  { key: "sinteticos",  label: "Índices Sintéticos" },
  { key: "otc",         label: "Índices OTC" },
];

/* ── Props ────────────────────────────────────────────────────────────── */
interface Props {
  assets: ApiAsset[];
  openTabIds: Set<string>;
  onSelect: (a: ApiAsset) => void;
  onClose: () => void;
}

export default function AssetPicker({ assets, openTabIds, onSelect, onClose }: Props) {
  const [category, setCategory]   = useState<Category>("todos");
  const [search, setSearch]       = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = assets.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (category === "todos")     return true;
    if (category === "favoritos") return favorites.has(a.id);
    if (category === "acoes")     return false;
    return categorize(a) === category;
  });

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel — full screen on mobile, fixed size on desktop */}
      <div
        className="absolute flex overflow-hidden md:rounded-xl shadow-2xl"
        style={{
          // Mobile: full screen
          top: 0, left: 0, right: 0, bottom: 0,
          // Desktop: fixed positioned box
          ...(typeof window !== "undefined" && window.innerWidth >= 768
            ? { top: 64, left: 60, right: "auto", bottom: "auto", width: 780, height: 540, borderRadius: 12 }
            : {}),
          background: "#111622",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* ── Left sidebar — hidden on mobile ── */}
        <div
          className="hidden md:flex flex-shrink-0 flex-col pt-4 pb-3 overflow-y-auto"
          style={{ width: 220, background: "#161C2C", borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* Favoritos */}
          <button
            onClick={() => setCategory("favoritos")}
            className="flex items-center gap-3 px-5 py-2.5 text-sm transition-colors mb-3"
            style={{ color: category === "favoritos" ? "white" : "#64748b" }}
          >
            <Star
              className="w-4 h-4 flex-shrink-0"
              style={{ fill: category === "favoritos" ? "#f59e0b" : "none", color: category === "favoritos" ? "#f59e0b" : "#64748b" }}
            />
            <span className="flex-1 text-left font-semibold">Favoritos</span>
            {favorites.size > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                style={{ background: "#3b82f6" }}
              >
                {favorites.size}
              </span>
            )}
          </button>

          {/* Category list */}
          {SIDEBAR.map((cat) => {
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className="w-full text-left px-5 py-2.5 text-sm transition-colors"
                style={{
                  color: isActive ? "white" : "#64748b",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                  borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── Right content ── */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

          {/* Search + close */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                style={{ fontSize: 16 }}
              />
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Mobile category scroll bar */}
          <div
            className="md:hidden flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <style>{`.cat-scroll::-webkit-scrollbar{display:none}`}</style>
            <div className="cat-scroll flex gap-2">
              {[{ key: "todos" as Category, label: "Todos" }, ...SIDEBAR].filter((c,i,a) => a.findIndex(x=>x.key===c.key)===i).map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: category === cat.key ? "#f97316" : "rgba(255,255,255,0.08)",
                    color: category === cat.key ? "white" : "#64748b",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers — desktop only */}
          <div
            className="hidden md:flex items-center px-4 py-2 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="flex-1 text-[11px] font-semibold text-gray-500 tracking-wide">Popularidade</div>
            <div className="w-28 text-center text-[11px] font-semibold text-gray-500 tracking-wide">Variação em 24h</div>
            <div className="w-48 text-right text-[11px] font-semibold text-gray-500 tracking-wide pr-2">Rentabilidade</div>
          </div>

          {/* Asset rows */}
          <style>{`
            .asset-list::-webkit-scrollbar { width: 4px; }
            .asset-list::-webkit-scrollbar-track { background: transparent; }
            .asset-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
            .asset-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.28); }
          `}</style>
          <div className="asset-list overflow-y-auto flex-1" style={{ colorScheme: "dark" }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 text-sm gap-2">
                <span>Nenhum ativo encontrado</span>
              </div>
            ) : (
              filtered.map((asset) => {
                const iconUrl = getIconUrl(asset.id);
                const isFav  = favorites.has(asset.id);
                const isOpen = openTabIds.has(asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => { onSelect(asset); onClose(); }}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.04]"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      background: isOpen ? "rgba(249,115,22,0.05)" : undefined,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                    >
                      {iconUrl
                        ? <img src={iconUrl} alt={asset.name} className="w-full h-full object-contain p-1" />
                        : <span className="text-[10px] font-bold text-gray-300">{asset.id.replace("-OTC","").slice(0,2)}</span>
                      }
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-white truncate">{asset.name}</span>
                        {isOpen && (
                          <span className="hidden md:inline text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: "rgba(249,115,22,0.2)", color: "#f97316" }}>
                            aberto
                          </span>
                        )}
                      </div>
                      {/* Payout shown inline on mobile */}
                      <div className="md:hidden flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{ background: "#2563eb" }}>
                          {asset.payout_m1}%
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{ background: "linear-gradient(135deg,#d97706,#92400e)" }}>
                          VIP: {asset.payout_m5}%
                        </span>
                      </div>
                    </div>

                    {/* 24h change — desktop only */}
                    <div className="hidden md:block w-28 text-center">
                      <span className="text-sm font-semibold" style={{ color: "#4ade80" }}>0.00%</span>
                    </div>

                    {/* Rentabilidade — desktop only */}
                    <div className="hidden md:flex w-48 items-center justify-end gap-1.5">
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-bold text-white"
                        style={{ background: "#2563eb" }}
                      >
                        {asset.payout_m1}%
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg,#d97706,#92400e)" }}
                      >
                        VIP: {asset.payout_m5}%
                      </span>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                      >
                        <Info className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => toggleFav(asset.id, e)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                      >
                        <Star
                          className="w-3.5 h-3.5"
                          style={{ color: isFav ? "#f59e0b" : "#475569", fill: isFav ? "#f59e0b" : "none" }}
                        />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
