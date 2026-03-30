import TradeLayout from "@/components/trade/TradeLayout";
import type { ApiAsset } from "@/components/trade/TradeLayout";

const ASSETS: ApiAsset[] = [
  { id: "BTCUSD",     symbol: "BTCUSD",     name: "BTC/USD",       is_active: true, payout_m1: 82, payout_m5: 84, payout_m15: 85, payout_h1: 86, icon_url: null },
  { id: "ETHUSD",     symbol: "ETHUSD",     name: "ETH/USD",       is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 84, icon_url: null },
  { id: "SOLUSD",     symbol: "SOLUSD",     name: "SOL/USD",       is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 84, icon_url: null },
  { id: "BNBUSD",     symbol: "BNBUSD",     name: "BNB/USD",       is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83, icon_url: null },
  { id: "XRPUSD",     symbol: "XRPUSD",     name: "XRP/USD",       is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83, icon_url: null },
  { id: "EURUSD",     symbol: "EURUSD",     name: "EUR/USD",       is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "GBPUSD",     symbol: "GBPUSD",     name: "GBP/USD",       is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84, icon_url: null },
  { id: "USDJPY",     symbol: "USDJPY",     name: "USD/JPY",       is_active: true, payout_m1: 80, payout_m5: 82, payout_m15: 83, payout_h1: 85, icon_url: null },
  { id: "AUDUSD",     symbol: "AUDUSD",     name: "AUD/USD",       is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 83, icon_url: null },
  { id: "USDCAD",     symbol: "USDCAD",     name: "USD/CAD",       is_active: true, payout_m1: 79, payout_m5: 80, payout_m15: 82, payout_h1: 83, icon_url: null },
  { id: "EURGBP",     symbol: "EURGBP",     name: "EUR/GBP",       is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "EURJPY",     symbol: "EURJPY",     name: "EUR/JPY",       is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84, icon_url: null },
  { id: "USDCHF",     symbol: "USDCHF",     name: "USD/CHF",       is_active: true, payout_m1: 79, payout_m5: 81, payout_m15: 82, payout_h1: 84, icon_url: null },
  { id: "NZDUSD",     symbol: "NZDUSD",     name: "NZD/USD",       is_active: true, payout_m1: 78, payout_m5: 80, payout_m15: 81, payout_h1: 83, icon_url: null },
  { id: "EURUSD-OTC", symbol: "EURUSD-OTC", name: "EUR/USD (OTC)", is_active: true, payout_m1: 75, payout_m5: 77, payout_m15: 78, payout_h1: 80, icon_url: null },
  { id: "GBPUSD-OTC", symbol: "GBPUSD-OTC", name: "GBP/USD (OTC)", is_active: true, payout_m1: 74, payout_m5: 76, payout_m15: 77, payout_h1: 79, icon_url: null },
  { id: "BTCUSD-OTC", symbol: "BTCUSD-OTC", name: "BTC/USD (OTC)", is_active: true, payout_m1: 76, payout_m5: 78, payout_m15: 79, payout_h1: 81, icon_url: null },
];

export default function TradePage() {
  return <TradeLayout assets={ASSETS} />;
}
