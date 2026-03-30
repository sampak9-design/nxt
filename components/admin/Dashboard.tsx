"use client";

import { Users, DollarSign, TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { USERS, DEPOSITS, TRADES, WITHDRAWALS, REVENUE_CHART } from "./mockData";

function KPICard({ icon, label, value, sub, trend, color }: {
  icon: React.ReactNode; label: string; value: string;
  sub: string; trend: "up" | "down"; color: string;
}) {
  return (
    <div className="rounded-xl p-5 border flex flex-col gap-3"
      style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-medium ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {sub}
        </span>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

type ChartEntry = { date: string; deposits: number; payouts: number; revenue: number; trades: number };
type TopUser    = { id: string; name: string; totalDeposited: number };
type RecentTrade = {
  id: string; userName: string; asset: string;
  direction: "up" | "down"; amount: number; result: "win" | "lose"; profit: number;
};

type StatsData = {
  active_users?: number;
  total_deposited?: number;
  revenue?: number;
  total_trades?: number;
  pending_deposits?: number;
  pending_withdrawals?: number;
  pending_kyc?: number;
  open_disputes?: number;
  chart?: ChartEntry[];
  top_users?: TopUser[];
  recent_trades?: RecentTrade[];
};

export default function Dashboard() {
  const totalDeposited = DEPOSITS.filter((d) => d.status === "approved").reduce((a, d) => a + d.amount, 0);
  const totalTrades    = TRADES.length;
  const revenue        = REVENUE_CHART.reduce((a, d) => a + d.revenue, 0);
  const activeUsers    = USERS.filter((u) => u.status === "active").length;
  const revenueChart   = REVENUE_CHART;
  const maxRev         = Math.max(...revenueChart.map((d) => Math.max(d.deposits, d.payouts)));
  const pendingDeposits    = DEPOSITS.filter((d) => d.status === "pending").length;
  const pendingWithdrawals = WITHDRAWALS.filter((w) => w.status === "pending").length;
  const pendingKyc         = 1;
  const openDisputes       = 0;
  const topUsers           = [...USERS].sort((a, b) => b.totalDeposited - a.totalDeposited).slice(0, 5);
  const recentTrades       = TRADES.slice(0, 5) as RecentTrade[];
  const topUsersMaxDeposit  = Math.max(...topUsers.map((u) => u.totalDeposited), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard icon={<Users className="w-5 h-5" />}      label="Usuários ativos"   value={String(activeUsers)}                        sub="+3 hoje" trend="up"   color="#f97316" />
        <KPICard icon={<DollarSign className="w-5 h-5" />} label="Total depositado"  value={`$${totalDeposited.toLocaleString()}`}       sub="+12%"    trend="up"   color="#22c55e" />
        <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Receita (14 dias)" value={`$${revenue.toLocaleString()}`}              sub="+8%"     trend="up"   color="#3b82f6" />
        <KPICard icon={<Activity className="w-5 h-5" />}   label="Operações totais"  value={String(totalTrades)}                        sub="hoje"    trend="up"   color="#a855f7" />
      </div>

      {/* Revenue chart + top users */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="xl:col-span-2 rounded-xl border p-5"
          style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-white text-sm">Receita — últimos 14 dias</span>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Depósitos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Pagamentos</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />Receita</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-36">
            {revenueChart.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col gap-0.5 items-center group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
                  <div className="bg-gray-900 border border-white/10 rounded px-2 py-1 text-[10px] whitespace-nowrap text-white shadow-xl">
                    <div>Dep: ${d.deposits.toLocaleString()}</div>
                    <div>Pag: ${d.payouts.toLocaleString()}</div>
                    <div className="text-orange-400">Rec: ${d.revenue.toLocaleString()}</div>
                  </div>
                </div>
                <div className="w-full flex items-end gap-0.5" style={{ height: 120 }}>
                  <div className="flex-1 rounded-sm bg-green-500/60 transition-all"
                    style={{ height: `${(d.deposits / maxRev) * 100}%` }} />
                  <div className="flex-1 rounded-sm bg-red-500/60 transition-all"
                    style={{ height: `${(d.payouts / maxRev) * 100}%` }} />
                </div>
                <span className="text-[9px] text-gray-600 mt-1">{d.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top users */}
        <div className="rounded-xl border p-5"
          style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="font-semibold text-white text-sm block mb-4">Top usuários</span>
          <div className="flex flex-col gap-3">
            {topUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4 text-right">{i + 1}</span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: ["#f97316","#22c55e","#3b82f6","#a855f7","#ef4444"][i] }}>
                  {u.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{u.name}</div>
                  <MiniBar
                    value={u.totalDeposited}
                    max={topUsersMaxDeposit}
                    color={["#f97316","#22c55e","#3b82f6","#a855f7","#ef4444"][i]}
                  />
                </div>
                <span className="text-xs text-green-400 font-medium flex-shrink-0">
                  ${u.totalDeposited.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent trades + pending */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent trades */}
        <div className="rounded-xl border p-5"
          style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="font-semibold text-white text-sm block mb-4">Operações recentes</span>
          <div className="flex flex-col gap-2">
            {recentTrades.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-1.5 border-b"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.result === "win" ? "bg-green-400" : "bg-red-400"}`} />
                <span className="text-xs text-gray-400 flex-1 truncate">{t.userName}</span>
                <span className="text-xs text-gray-500">{t.asset}</span>
                <span className="text-xs font-medium" style={{ color: t.direction === "up" ? "#22c55e" : "#ef4444" }}>
                  {t.direction === "up" ? "▲" : "▼"} ${t.amount}
                </span>
                <span className={`text-xs font-bold ${t.result === "win" ? "text-green-400" : "text-red-400"}`}>
                  {t.result === "win" ? `+$${t.profit}` : `-$${Math.abs(t.profit)}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending actions */}
        <div className="rounded-xl border p-5"
          style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="font-semibold text-white text-sm block mb-4">Pendentes</span>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
              <span className="text-sm text-white">Depósitos</span>
              <span className="text-lg font-bold text-orange-400">{pendingDeposits}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <span className="text-sm text-white">Saques</span>
              <span className="text-lg font-bold text-blue-400">{pendingWithdrawals}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <span className="text-sm text-white">Verificações KYC</span>
              <span className="text-lg font-bold text-purple-400">{pendingKyc}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <span className="text-sm text-white">Disputas</span>
              <span className="text-lg font-bold text-red-400">{openDisputes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
