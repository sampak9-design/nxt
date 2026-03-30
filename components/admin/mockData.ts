export type User = {
  id: string; name: string; email: string; country: string;
  demoBalance: number; realBalance: number;
  totalDeposited: number; totalWithdrawn: number;
  totalTrades: number; winRate: number;
  status: "active" | "banned" | "pending";
  createdAt: string;
};

export type Deposit = {
  id: string; userId: string; userName: string;
  amount: number; method: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type Withdrawal = {
  id: string; userId: string; userName: string;
  amount: number; method: string; address: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type Trade = {
  id: string; userId: string; userName: string;
  asset: string; direction: "up" | "down";
  amount: number; payout: number;
  entryPrice: number; exitPrice: number;
  result: "win" | "lose" | "open";
  profit: number;
  accountType: "practice" | "real";
  createdAt: string;
};

export type Asset = {
  id: string; name: string; type: string;
  payoutM1: number; payoutM5: number; payoutM15: number; payoutH1: number;
  active: boolean;
  totalTrades: number; winRate: number;
};

// ── Users ────────────────────────────────────────────────────────────
export const USERS: User[] = [
  { id: "u1", name: "Carlos Silva",    email: "carlos@gmail.com",   country: "BR", demoBalance: 8200,  realBalance: 1540,  totalDeposited: 3000,  totalWithdrawn: 800,  totalTrades: 142, winRate: 54, status: "active",  createdAt: "2025-11-03" },
  { id: "u2", name: "Ana Ferreira",    email: "ana@hotmail.com",    country: "BR", demoBalance: 10000, realBalance: 0,     totalDeposited: 500,   totalWithdrawn: 0,    totalTrades: 23,  winRate: 39, status: "active",  createdAt: "2025-12-14" },
  { id: "u3", name: "Pedro Gomes",     email: "pedro@gmail.com",    country: "PT", demoBalance: 5400,  realBalance: 12000, totalDeposited: 15000, totalWithdrawn: 2000, totalTrades: 890, winRate: 48, status: "active",  createdAt: "2025-09-20" },
  { id: "u4", name: "Maria Santos",    email: "maria@outlook.com",  country: "BR", demoBalance: 0,     realBalance: 0,     totalDeposited: 200,   totalWithdrawn: 200,  totalTrades: 12,  winRate: 25, status: "banned",  createdAt: "2026-01-05" },
  { id: "u5", name: "João Costa",      email: "joao@gmail.com",     country: "BR", demoBalance: 9800,  realBalance: 3200,  totalDeposited: 5000,  totalWithdrawn: 1500, totalTrades: 310, winRate: 51, status: "active",  createdAt: "2025-10-11" },
  { id: "u6", name: "Luisa Rodrigues", email: "luisa@yahoo.com",    country: "AR", demoBalance: 10000, realBalance: 0,     totalDeposited: 0,     totalWithdrawn: 0,    totalTrades: 5,   winRate: 60, status: "pending", createdAt: "2026-03-27" },
  { id: "u7", name: "Rafael Lima",     email: "rafael@gmail.com",   country: "BR", demoBalance: 7100,  realBalance: 890,   totalDeposited: 2000,  totalWithdrawn: 0,    totalTrades: 78,  winRate: 46, status: "active",  createdAt: "2026-02-18" },
  { id: "u8", name: "Fernanda Alves",  email: "fernanda@gmail.com", country: "BR", demoBalance: 10000, realBalance: 4500,  totalDeposited: 6000,  totalWithdrawn: 3000, totalTrades: 445, winRate: 55, status: "active",  createdAt: "2025-08-30" },
];

// ── Deposits ─────────────────────────────────────────────────────────
export const DEPOSITS: Deposit[] = [
  { id: "d1", userId: "u1", userName: "Carlos Silva",    amount: 500,  method: "PIX",         status: "pending",  createdAt: "2026-03-28 09:12" },
  { id: "d2", userId: "u3", userName: "Pedro Gomes",     amount: 2000, method: "Cartão",      status: "pending",  createdAt: "2026-03-28 08:44" },
  { id: "d3", userId: "u5", userName: "João Costa",      amount: 1000, method: "PIX",         status: "approved", createdAt: "2026-03-27 16:30" },
  { id: "d4", userId: "u7", userName: "Rafael Lima",     amount: 250,  method: "Crypto USDT", status: "approved", createdAt: "2026-03-27 14:10" },
  { id: "d5", userId: "u8", userName: "Fernanda Alves",  amount: 3000, method: "PIX",         status: "approved", createdAt: "2026-03-26 11:05" },
  { id: "d6", userId: "u2", userName: "Ana Ferreira",    amount: 100,  method: "PIX",         status: "rejected", createdAt: "2026-03-25 09:00" },
  { id: "d7", userId: "u4", userName: "Maria Santos",    amount: 200,  method: "Cartão",      status: "rejected", createdAt: "2026-03-24 17:22" },
  { id: "d8", userId: "u3", userName: "Pedro Gomes",     amount: 5000, method: "Crypto BTC",  status: "approved", createdAt: "2026-03-23 10:15" },
];

// ── Withdrawals ───────────────────────────────────────────────────────
export const WITHDRAWALS: Withdrawal[] = [
  { id: "w1", userId: "u3", userName: "Pedro Gomes",    amount: 1000, method: "PIX",         address: "pedro@pix.com",         status: "pending",  createdAt: "2026-03-28 10:00" },
  { id: "w2", userId: "u8", userName: "Fernanda Alves", amount: 500,  method: "Crypto USDT", address: "0xAb3...f92",            status: "pending",  createdAt: "2026-03-28 08:20" },
  { id: "w3", userId: "u5", userName: "João Costa",     amount: 750,  method: "PIX",         address: "joao@pix.com",           status: "approved", createdAt: "2026-03-27 15:00" },
  { id: "w4", userId: "u1", userName: "Carlos Silva",   amount: 300,  method: "Transferência",address: "AG 0001 CC 12345-6",    status: "approved", createdAt: "2026-03-26 09:30" },
  { id: "w5", userId: "u4", userName: "Maria Santos",   amount: 150,  method: "PIX",         address: "maria@pix.com",          status: "rejected", createdAt: "2026-03-25 14:00" },
];

// ── Trades ────────────────────────────────────────────────────────────
export const TRADES: Trade[] = [
  { id: "t1",  userId: "u1", userName: "Carlos Silva",    asset: "BTC/USD", direction: "up",   amount: 50,  payout: 82, entryPrice: 65800, exitPrice: 66100, result: "win",  profit: 41,   accountType: "real",     createdAt: "2026-03-28 09:00" },
  { id: "t2",  userId: "u3", userName: "Pedro Gomes",     asset: "EUR/USD", direction: "down", amount: 200, payout: 80, entryPrice: 1.0852, exitPrice: 1.0844, result: "win",  profit: 160,  accountType: "real",     createdAt: "2026-03-28 08:55" },
  { id: "t3",  userId: "u5", userName: "João Costa",      asset: "ETH/USD", direction: "up",   amount: 100, payout: 80, entryPrice: 3180,  exitPrice: 3165,  result: "lose", profit: -100, accountType: "real",     createdAt: "2026-03-28 08:40" },
  { id: "t4",  userId: "u8", userName: "Fernanda Alves",  asset: "GBP/USD", direction: "up",   amount: 300, payout: 79, entryPrice: 1.2680, exitPrice: 1.2695, result: "win",  profit: 237,  accountType: "real",     createdAt: "2026-03-28 08:30" },
  { id: "t5",  userId: "u2", userName: "Ana Ferreira",    asset: "BTC/USD", direction: "up",   amount: 10,  payout: 82, entryPrice: 65900, exitPrice: 65880, result: "lose", profit: -10,  accountType: "practice", createdAt: "2026-03-28 08:10" },
  { id: "t6",  userId: "u7", userName: "Rafael Lima",     asset: "EUR/USD", direction: "down", amount: 75,  payout: 80, entryPrice: 1.0860, exitPrice: 1.0855, result: "win",  profit: 60,   accountType: "real",     createdAt: "2026-03-27 17:30" },
  { id: "t7",  userId: "u1", userName: "Carlos Silva",    asset: "USD/JPY", direction: "up",   amount: 50,  payout: 80, entryPrice: 149.80, exitPrice: 149.72, result: "lose", profit: -50,  accountType: "real",     createdAt: "2026-03-27 16:00" },
  { id: "t8",  userId: "u3", userName: "Pedro Gomes",     asset: "BTC/USD", direction: "up",   amount: 500, payout: 82, entryPrice: 65200, exitPrice: 65800, result: "win",  profit: 410,  accountType: "real",     createdAt: "2026-03-27 14:20" },
  { id: "t9",  userId: "u5", userName: "João Costa",      asset: "ETH/USD", direction: "down", amount: 150, payout: 80, entryPrice: 3200,  exitPrice: 3175,  result: "win",  profit: 120,  accountType: "real",     createdAt: "2026-03-27 13:00" },
  { id: "t10", userId: "u8", userName: "Fernanda Alves",  asset: "GBP/USD", direction: "down", amount: 200, payout: 79, entryPrice: 1.2700, exitPrice: 1.2712, result: "lose", profit: -200, accountType: "real",     createdAt: "2026-03-27 11:00" },
];

// ── Assets ────────────────────────────────────────────────────────────
export const ASSETS: Asset[] = [
  { id: "BTCUSD",     name: "BTC/USD",     type: "Crypto",  payoutM1: 82, payoutM5: 84, payoutM15: 85, payoutH1: 86, active: true,  totalTrades: 2840, winRate: 49 },
  { id: "ETHUSD",     name: "ETH/USD",     type: "Crypto",  payoutM1: 80, payoutM5: 82, payoutM15: 83, payoutH1: 84, active: true,  totalTrades: 1920, winRate: 48 },
  { id: "EURUSD",     name: "EUR/USD",     type: "Forex",   payoutM1: 80, payoutM5: 82, payoutM15: 83, payoutH1: 85, active: true,  totalTrades: 3100, winRate: 51 },
  { id: "GBPUSD",     name: "GBP/USD",     type: "Forex",   payoutM1: 79, payoutM5: 81, payoutM15: 82, payoutH1: 84, active: true,  totalTrades: 1540, winRate: 47 },
  { id: "USDJPY",     name: "USD/JPY",     type: "Forex",   payoutM1: 80, payoutM5: 82, payoutM15: 83, payoutH1: 85, active: true,  totalTrades: 980,  winRate: 50 },
  { id: "AUDUSD",     name: "AUD/USD",     type: "Forex",   payoutM1: 79, payoutM5: 81, payoutM15: 82, payoutH1: 83, active: true,  totalTrades: 640,  winRate: 46 },
  { id: "SOLUSD",     name: "SOL/USD",     type: "Crypto",  payoutM1: 80, payoutM5: 82, payoutM15: 83, payoutH1: 84, active: true,  totalTrades: 420,  winRate: 52 },
  { id: "EURUSD-OTC", name: "EUR/USD OTC", type: "OTC",     payoutM1: 75, payoutM5: 77, payoutM15: 78, payoutH1: 80, active: true,  totalTrades: 890,  winRate: 44 },
  { id: "BTCUSD-OTC", name: "BTC/USD OTC", type: "OTC",     payoutM1: 76, payoutM5: 78, payoutM15: 79, payoutH1: 81, active: false, totalTrades: 210,  winRate: 43 },
  { id: "XRPUSD",     name: "XRP/USD",     type: "Crypto",  payoutM1: 79, payoutM5: 81, payoutM15: 82, payoutH1: 83, active: false, totalTrades: 180,  winRate: 48 },
];

// ── Revenue chart data (last 14 days) ─────────────────────────────────
export const REVENUE_CHART = Array.from({ length: 14 }, (_, i) => {
  const d = new Date("2026-03-28");
  d.setDate(d.getDate() - (13 - i));
  const deposits = Math.floor(Math.random() * 8000 + 2000);
  const payouts  = Math.floor(deposits * (0.4 + Math.random() * 0.2));
  return {
    date:     d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    deposits,
    payouts,
    revenue:  deposits - payouts,
    trades:   Math.floor(Math.random() * 200 + 50),
  };
});
