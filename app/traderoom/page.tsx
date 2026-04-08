"use client";
import dynamic from "next/dynamic";
import type { ApiAsset } from "@/components/trade/TradeLayout";

// SSR disabled — TradeLayout reads localStorage in useState initializers;
// running on the server causes a hydration mismatch and a blank first load.
const TradeLayout = dynamic(() => import("@/components/trade/TradeLayout"), { ssr: false });

const ASSETS: ApiAsset[] = [
  // ── Crypto ──────────────────────────────────────────────────────────────
  { id: "BTCUSD",    symbol: "BTCUSD",    name: "BTC/USD",                  is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 86, icon_url: null },
  { id: "ETHUSD",    symbol: "ETHUSD",    name: "ETH/USD",                  is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 84, icon_url: null },
  { id: "SOLUSD",    symbol: "SOLUSD",    name: "SOL/USD",                  is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 84, icon_url: null },
  { id: "BNBUSD",    symbol: "BNBUSD",    name: "BNB/USD",                  is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83, icon_url: null },
  { id: "XRPUSD",    symbol: "XRPUSD",    name: "XRP/USD",                  is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83, icon_url: null },

  // ── Forex major ──────────────────────────────────────────────────────────
  { id: "EURUSD",    symbol: "EURUSD",    name: "EUR/USD",                  is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "GBPUSD",    symbol: "GBPUSD",    name: "GBP/USD",                  is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84, icon_url: null },
  { id: "USDJPY",    symbol: "USDJPY",    name: "USD/JPY",                  is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "AUDUSD",    symbol: "AUDUSD",    name: "AUD/USD",                  is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83, icon_url: null },
  { id: "USDCAD",    symbol: "USDCAD",    name: "USD/CAD",                  is_active: true, payout_m1: 79, payout_m5: 80, payout_m15: 82, payout_h1: 83, icon_url: null },
  { id: "USDCHF",    symbol: "USDCHF",    name: "USD/CHF",                  is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84, icon_url: null },
  { id: "NZDUSD",    symbol: "NZDUSD",    name: "NZD/USD",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "EURGBP",    symbol: "EURGBP",    name: "EUR/GBP",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "EURJPY",    symbol: "EURJPY",    name: "EUR/JPY",                  is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84, icon_url: null },
  { id: "EURCHF",    symbol: "EURCHF",    name: "EUR/CHF",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "GBPJPY",    symbol: "GBPJPY",    name: "GBP/JPY",                  is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84, icon_url: null },
  { id: "AUDJPY",    symbol: "AUDJPY",    name: "AUD/JPY",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },

  // ── Forex minor ──────────────────────────────────────────────────────────
  { id: "AUDCAD",    symbol: "AUDCAD",    name: "AUD/CAD",                  is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82, icon_url: null },
  { id: "AUDCHF",    symbol: "AUDCHF",    name: "AUD/CHF",                  is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82, icon_url: null },
  { id: "AUDNZD",    symbol: "AUDNZD",    name: "AUD/NZD",                  is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82, icon_url: null },
  { id: "EURAUD",    symbol: "EURAUD",    name: "EUR/AUD",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "EURCAD",    symbol: "EURCAD",    name: "EUR/CAD",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "EURNZD",    symbol: "EURNZD",    name: "EUR/NZD",                  is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82, icon_url: null },
  { id: "GBPAUD",    symbol: "GBPAUD",    name: "GBP/AUD",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "GBPCAD",    symbol: "GBPCAD",    name: "GBP/CAD",                  is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "GBPCHF",    symbol: "GBPCHF",    name: "GBP/CHF",                  is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82, icon_url: null },
  { id: "GBPNOK",    symbol: "GBPNOK",    name: "GBP/NOK",                  is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81, icon_url: null },
  { id: "GBPNZD",    symbol: "GBPNZD",    name: "GBP/NZD",                  is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82, icon_url: null },
  { id: "NZDJPY",    symbol: "NZDJPY",    name: "NZD/JPY",                  is_active: true, payout_m1: 77, payout_m5: 79, payout_m15: 80, payout_h1: 82, icon_url: null },
  { id: "USDMXN",    symbol: "USDMXN",    name: "USD/MXN",                  is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81, icon_url: null },
  { id: "USDNOK",    symbol: "USDNOK",    name: "USD/NOK",                  is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81, icon_url: null },
  { id: "USDPLN",    symbol: "USDPLN",    name: "USD/PLN",                  is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81, icon_url: null },
  { id: "USDSEK",    symbol: "USDSEK",    name: "USD/SEK",                  is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81, icon_url: null },

  // ── Metals ───────────────────────────────────────────────────────────────
  { id: "XAUUSD",    symbol: "XAUUSD",    name: "Ouro/USD",                 is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "XAGUSD",    symbol: "XAGUSD",    name: "Prata/USD",                is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },

  // ── Synthetic volatility indices (24/7) ──────────────────────────────────
  { id: "R_10",      symbol: "R_10",      name: "Volatility 10 Index",      is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90, icon_url: null },
  { id: "R_25",      symbol: "R_25",      name: "Volatility 25 Index",      is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90, icon_url: null },
  { id: "R_50",      symbol: "R_50",      name: "Volatility 50 Index",      is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90, icon_url: null },
  { id: "R_75",      symbol: "R_75",      name: "Volatility 75 Index",      is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90, icon_url: null },
  { id: "R_100",     symbol: "R_100",     name: "Volatility 100 Index",     is_active: true, payout_m1: 85, payout_m5: 87, payout_m15: 88, payout_h1: 90, icon_url: null },
  { id: "1HZ10V",    symbol: "1HZ10V",    name: "Volatility 10 (1s) Index", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "1HZ25V",    symbol: "1HZ25V",    name: "Volatility 25 (1s) Index", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "1HZ50V",    symbol: "1HZ50V",    name: "Volatility 50 (1s) Index", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "1HZ75V",    symbol: "1HZ75V",    name: "Volatility 75 (1s) Index", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "1HZ100V",   symbol: "1HZ100V",   name: "Volatility 100 (1s) Index",is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },

  // ── Jump indices (24/7) ──────────────────────────────────────────────────
  { id: "JD10",      symbol: "JD10",      name: "Jump 10 Index",            is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "JD25",      symbol: "JD25",      name: "Jump 25 Index",            is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "JD50",      symbol: "JD50",      name: "Jump 50 Index",            is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "JD75",      symbol: "JD75",      name: "Jump 75 Index",            is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "JD100",     symbol: "JD100",     name: "Jump 100 Index",           is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },

  // ── OTC stock indices (market hours only) ────────────────────────────────
  { id: "OTC_DJI",   symbol: "OTC_DJI",   name: "Wall Street 30 (OTC)",    is_active: true, payout_m1: 74, payout_m5: 76, payout_m15: 77, payout_h1: 79, icon_url: null },
  { id: "OTC_FTSE",  symbol: "OTC_FTSE",  name: "UK 100 (OTC)",            is_active: true, payout_m1: 74, payout_m5: 76, payout_m15: 77, payout_h1: 79, icon_url: null },
  { id: "OTC_GDAXI", symbol: "OTC_GDAXI", name: "Germany 40 (OTC)",        is_active: true, payout_m1: 74, payout_m5: 76, payout_m15: 77, payout_h1: 79, icon_url: null },
  { id: "OTC_NDX",   symbol: "OTC_NDX",   name: "US Tech 100 (OTC)",       is_active: true, payout_m1: 74, payout_m5: 76, payout_m15: 77, payout_h1: 79, icon_url: null },
  { id: "OTC_SPC",   symbol: "OTC_SPC",   name: "US 500 (OTC)",            is_active: true, payout_m1: 74, payout_m5: 76, payout_m15: 77, payout_h1: 79, icon_url: null },
  { id: "OTC_N225",  symbol: "OTC_N225",  name: "Japan 225 (OTC)",         is_active: true, payout_m1: 74, payout_m5: 76, payout_m15: 77, payout_h1: 79, icon_url: null },
  { id: "OTC_AEX",   symbol: "OTC_AEX",   name: "Netherlands 25 (OTC)",    is_active: true, payout_m1: 73, payout_m5: 75, payout_m15: 76, payout_h1: 78, icon_url: null },
  { id: "OTC_AS51",  symbol: "OTC_AS51",  name: "Australia 200 (OTC)",     is_active: true, payout_m1: 73, payout_m5: 75, payout_m15: 76, payout_h1: 78, icon_url: null },
  { id: "OTC_FCHI",  symbol: "OTC_FCHI",  name: "France 40 (OTC)",         is_active: true, payout_m1: 73, payout_m5: 75, payout_m15: 76, payout_h1: 78, icon_url: null },
  { id: "OTC_HSI",   symbol: "OTC_HSI",   name: "Hong Kong 50 (OTC)",      is_active: true, payout_m1: 73, payout_m5: 75, payout_m15: 76, payout_h1: 78, icon_url: null },
  { id: "OTC_SSMI",  symbol: "OTC_SSMI",  name: "Swiss 20 (OTC)",          is_active: true, payout_m1: 73, payout_m5: 75, payout_m15: 76, payout_h1: 78, icon_url: null },
  { id: "OTC_SX5E",  symbol: "OTC_SX5E",  name: "Euro 50 (OTC)",           is_active: true, payout_m1: 73, payout_m5: 75, payout_m15: 76, payout_h1: 78, icon_url: null },

  // ── OTC forex pairs (24/7, synthetic engine) ─────────────────────────────
  { id: "AUDCAD-OTC", symbol: "AUDCAD-OTC", name: "AUD/CAD (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "AUDCHF-OTC", symbol: "AUDCHF-OTC", name: "AUD/CHF (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "AUDJPY-OTC", symbol: "AUDJPY-OTC", name: "AUD/JPY (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "AUDNZD-OTC", symbol: "AUDNZD-OTC", name: "AUD/NZD (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "CADCHF-OTC", symbol: "CADCHF-OTC", name: "CAD/CHF (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "EURAUD-OTC", symbol: "EURAUD-OTC", name: "EUR/AUD (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "EURCHF-OTC", symbol: "EURCHF-OTC", name: "EUR/CHF (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "EURGBP-OTC", symbol: "EURGBP-OTC", name: "EUR/GBP (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "EURJPY-OTC", symbol: "EURJPY-OTC", name: "EUR/JPY (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "EURUSD-OTC", symbol: "EURUSD-OTC", name: "EUR/USD (OTC)", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "GBPCHF-OTC", symbol: "GBPCHF-OTC", name: "GBP/CHF (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "GBPJPY-OTC", symbol: "GBPJPY-OTC", name: "GBP/JPY (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "GBPNZD-OTC", symbol: "GBPNZD-OTC", name: "GBP/NZD (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "GBPUSD-OTC", symbol: "GBPUSD-OTC", name: "GBP/USD (OTC)", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },
  { id: "NZDCAD-OTC", symbol: "NZDCAD-OTC", name: "NZD/CAD (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "NZDCHF-OTC", symbol: "NZDCHF-OTC", name: "NZD/CHF (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "NZDJPY-OTC", symbol: "NZDJPY-OTC", name: "NZD/JPY (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "NZDUSD-OTC", symbol: "NZDUSD-OTC", name: "NZD/USD (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "USDCAD-OTC", symbol: "USDCAD-OTC", name: "USD/CAD (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "USDCHF-OTC", symbol: "USDCHF-OTC", name: "USD/CHF (OTC)", is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "USDJPY-OTC", symbol: "USDJPY-OTC", name: "USD/JPY (OTC)", is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 87, icon_url: null },

  // ── OTC crypto (still uses Binance feed) ─────────────────────────────────
  { id: "BTCUSD-OTC", symbol: "BTCUSD-OTC", name: "BTC/USD (OTC)", is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81, icon_url: null },
];

export default function TradePage() {
  return <TradeLayout assets={ASSETS} />;
}
