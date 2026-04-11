"use client";

import { useEffect, useState } from "react";
import { RefreshCw, DollarSign, CreditCard, Receipt, TrendingUp, TrendingDown, Users, Wallet, Gift, BarChart3, Target, Zap, Search, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

function fmt(n: number) { return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(d: string) { return d.slice(5).replace("-", "/"); }

type Data = {
  totalDeposits: number; totalWithdrawals: number; avgTicket: number; fluxoLiquido: number;
  saldoTotal: number; bonusTotal: number; totalUsers: number; newUsersToday: number;
  valorApostado: number; ganhosPlat: number; perdasPlat: number; resultadoPlat: number;
  wins: number; loses: number;
  chart7d: { date: string; ganhos: number; perdas: number }[];
  profitableUsers: { id: number; name: string; email: string; real_balance: number; deposited: number; net_profit: number }[];
};

const PERIODS = [
  { label: "Hoje", days: 1 },
  { label: "Ontem", days: 2 },
  { label: "7 dias", days: 7 },
  { label: "15 dias", days: 15 },
  { label: "30 dias", days: 30 },
];

function StatCard({ icon, label, value, color, trend, sub }: {
  icon: React.ReactNode; label: string; value: string; color: string; trend?: "up" | "down"; sub?: string;
}) {
  return (
    <div className="rounded-xl p-4 transition-all hover:translate-y-[-1px]"
      style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[22px] font-bold text-white leading-none">{value}</span>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${trend === "up" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      {sub && <span className="text-[10px] text-gray-600 mt-1 block">{sub}</span>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [search, setSearch] = useState("");

  const load = (days: number) => {
    setLoading(true);
    fetch(`/api/admin/dashboard?days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(period); }, [period]);

  if (loading && !data) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-500 text-sm">Carregando dashboard...</span>
      </div>
    </div>
  );
  const d = data!;

  const chart7d = d.chart7d ?? [];
  const maxChart = Math.max(...chart7d.map(c => Math.max(c.ganhos, c.perdas)), 1);
  const totalOps = d.wins + d.loses;
  const winRate = totalOps > 0 ? ((d.wins / totalOps) * 100).toFixed(1) : "0";
  const loseRate = totalOps > 0 ? ((d.loses / totalOps) * 100).toFixed(1) : "0";
  const profUsers = (d.profitableUsers ?? []).filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visão geral da plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex items-center rounded-lg overflow-hidden"
            style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setPeriod(p.days)}
                className="px-3 py-2 text-xs font-medium transition-all"
                style={{
                  background: period === p.days ? "rgba(249,115,22,0.2)" : "transparent",
                  color: period === p.days ? "#f97316" : "#64748b",
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => load(period)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Row 1: Financial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Depósitos" value={fmt(d.totalDeposits)} color="#22c55e" trend="up" />
        <StatCard icon={<CreditCard className="w-4 h-4" />} label="Saques" value={fmt(d.totalWithdrawals)} color="#ef4444" trend="down" />
        <StatCard icon={<Receipt className="w-4 h-4" />} label="Ticket Médio" value={fmt(d.avgTicket)} color="#3b82f6" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Fluxo Líquido" value={fmt(d.fluxoLiquido)} color={d.fluxoLiquido >= 0 ? "#22c55e" : "#ef4444"} trend={d.fluxoLiquido >= 0 ? "up" : "down"} />
      </div>

      {/* KPI Row 2: Users */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Wallet className="w-4 h-4" />} label="Saldo Usuários" value={fmt(d.saldoTotal)} color="#3b82f6" />
        <StatCard icon={<Gift className="w-4 h-4" />} label="Bônus Total" value={fmt(d.bonusTotal)} color="#8b5cf6" />
        <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Saldo + Bônus" value={fmt(d.saldoTotal + d.bonusTotal)} color="#a855f7" />
        <StatCard icon={<Users className="w-4 h-4" />} label="Usuários" value={String(d.totalUsers)} color="#f97316" sub={`+${d.newUsersToday} novos hoje`} />
      </div>

      {/* KPI Row 3: Platform P&L */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Target className="w-4 h-4" />} label="Apostado" value={fmt(d.valorApostado)} color="#f97316" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Ganhos Plat." value={fmt(d.ganhosPlat)} color="#22c55e" sub="Perdas dos usuários" />
        <StatCard icon={<TrendingDown className="w-4 h-4" />} label="Perdas Plat." value={fmt(d.perdasPlat)} color="#ef4444" sub="Ganhos dos usuários" />
        <StatCard icon={<Zap className="w-4 h-4" />} label="Resultado" value={fmt(d.resultadoPlat)} color={d.resultadoPlat >= 0 ? "#22c55e" : "#ef4444"} trend={d.resultadoPlat >= 0 ? "up" : "down"} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Win/Lose donut */}
        <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-semibold text-white text-sm mb-6">Distribuição</h3>
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 140 140">
                {totalOps === 0 ? (
                  <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
                ) : (
                  <>
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#ef4444" strokeWidth="16" strokeLinecap="round"
                      strokeDasharray={`${(d.loses / totalOps) * 345.6} 345.6`}
                      transform="rotate(-90 70 70)" />
                    <circle cx="70" cy="70" r="55" fill="none" stroke="#22c55e" strokeWidth="16" strokeLinecap="round"
                      strokeDasharray={`${(d.wins / totalOps) * 345.6} 345.6`}
                      strokeDashoffset={`-${(d.loses / totalOps) * 345.6}`}
                      transform="rotate(-90 70 70)" />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{totalOps}</span>
                <span className="text-[10px] text-gray-500">operações</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400">Ganhos <span className="text-white font-semibold">{winRate}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-xs text-gray-400">Perdas <span className="text-white font-semibold">{loseRate}%</span></span>
            </div>
          </div>
        </div>

        {/* 7-day chart */}
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-white text-sm">Últimos 7 dias</h3>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/60" /> Ganhos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/60" /> Perdas</span>
            </div>
          </div>
          {chart7d.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-gray-600 text-sm">Sem dados no período</div>
          ) : (
            <div className="relative h-44">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <div key={i} className="absolute left-10 right-0 border-t" style={{ bottom: `${pct * 100}%`, borderColor: "rgba(255,255,255,0.04)" }}>
                  <span className="absolute -left-10 text-[10px] text-gray-600 -translate-y-1/2">
                    {Math.round(maxChart * pct)}
                  </span>
                </div>
              ))}
              <div className="ml-10 h-full flex items-end gap-3">
                {chart7d.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full flex items-end gap-1 relative" style={{ height: "85%" }}>
                      <div className="flex-1 rounded-md transition-all group-hover:opacity-100 opacity-80"
                        style={{ height: `${Math.max((c.ganhos / maxChart) * 100, 2)}%`, background: "linear-gradient(to top, rgba(34,197,94,0.4), rgba(34,197,94,0.7))" }} />
                      <div className="flex-1 rounded-md transition-all group-hover:opacity-100 opacity-80"
                        style={{ height: `${Math.max((c.perdas / maxChart) * 100, 2)}%`, background: "linear-gradient(to top, rgba(239,68,68,0.4), rgba(239,68,68,0.7))" }} />
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{fmtDate(c.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Operations summary */}
        <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-semibold text-white text-sm mb-5">Operações</h3>
          <div className="flex flex-col gap-5">
            {/* Win bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Vitórias dos usuários</span>
                <span className="text-xs font-bold text-green-400">{d.wins}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: totalOps ? `${(d.wins / totalOps) * 100}%` : "0%", background: "linear-gradient(to right, #22c55e, #16a34a)" }} />
              </div>
            </div>
            {/* Lose bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Derrotas dos usuários</span>
                <span className="text-xs font-bold text-red-400">{d.loses}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: totalOps ? `${(d.loses / totalOps) * 100}%` : "0%", background: "linear-gradient(to right, #ef4444, #dc2626)" }} />
              </div>
            </div>
          </div>

          {/* Summary numbers */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">{d.wins}</div>
              <div className="text-[10px] text-gray-500 mt-1">Vitórias<br />(Perdas Plataforma)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{d.loses}</div>
              <div className="text-[10px] text-gray-500 mt-1">Derrotas<br />(Ganhos Plataforma)</div>
            </div>
          </div>
        </div>

        {/* Financial summary */}
        <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="font-semibold text-white text-sm mb-5">Resumo Financeiro</h3>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Entradas (Depósitos)", value: d.totalDeposits, color: "#22c55e", icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
              { label: "Saídas (Saques)", value: d.totalWithdrawals, color: "#ef4444", icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
              { label: "Saldo em Contas", value: d.saldoTotal, color: "#3b82f6", icon: <Wallet className="w-3.5 h-3.5" /> },
              { label: "Lucro da Plataforma", value: d.resultadoPlat, color: d.resultadoPlat >= 0 ? "#22c55e" : "#ef4444", icon: <Zap className="w-3.5 h-3.5" /> },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-lg transition-all hover:translate-x-0.5"
                style={{ background: `${r.color}08`, border: `1px solid ${r.color}15` }}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${r.color}15`, color: r.color }}>
                    {r.icon}
                  </div>
                  <span className="text-[13px] text-gray-300">{r.label}</span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: r.color }}>{fmt(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profitable users */}
      <div className="rounded-xl p-5" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-500/10">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Usuários Lucrativos</h3>
              <p className="text-[11px] text-gray-500">Lucrando mais do que depositaram</p>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "rgba(234,179,8,0.1)", color: "#eab308" }}>
              {profUsers.length}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input type="text" placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white outline-none w-44 placeholder:text-gray-600" />
          </div>
        </div>

        {profUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-600 text-sm">Nenhum usuário lucrativo no momento</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-[11px] text-gray-500 font-medium uppercase tracking-wider"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Usuário</th>
                  <th className="text-right py-3 px-4 text-[11px] text-gray-500 font-medium uppercase tracking-wider"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Depositado</th>
                  <th className="text-right py-3 px-4 text-[11px] text-gray-500 font-medium uppercase tracking-wider"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Saldo</th>
                  <th className="text-right py-3 px-4 text-[11px] text-gray-500 font-medium uppercase tracking-wider"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Lucro</th>
                </tr>
              </thead>
              <tbody>
                {profUsers.map((u, i) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < profUsers.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium text-[13px]">{u.name}</div>
                          <div className="text-[10px] text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">{fmt(u.deposited)}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{fmt(u.real_balance)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-green-400 font-bold">{fmt(u.net_profit)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
