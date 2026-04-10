"use client";

import { useEffect, useState } from "react";
import { RefreshCw, DollarSign, CreditCard, Receipt, TrendingUp, TrendingDown, Users, Wallet, Gift, BarChart3, Target, Zap, PieChart, LineChart, Search, AlertTriangle } from "lucide-react";

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

function KPI({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-xl p-4 border flex flex-col gap-2" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "22" }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      {sub && <span className="text-[10px] text-gray-600">{sub}</span>}
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

  if (loading && !data) return <div className="flex items-center justify-center py-20 text-gray-500">Carregando...</div>;
  const d = data!;

  const chart7d = d.chart7d ?? [];
  const maxChart = Math.max(...chart7d.map(c => Math.max(c.ganhos, c.perdas)), 1);
  const totalOps = d.wins + d.loses;
  const profUsers = (d.profitableUsers ?? []).filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-gray-500">Visão geral da plataforma</p>
        </div>
        <button onClick={() => load(period)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "#cbd5e1" }}>
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Período:</span>
        {PERIODS.map(p => (
          <button key={p.days} onClick={() => setPeriod(p.days)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: period === p.days ? "#f97316" : "rgba(255,255,255,0.05)", color: period === p.days ? "#fff" : "#94a3b8" }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Row 1: Deposits/Withdrawals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={<DollarSign className="w-4 h-4" />} label="Total Depósitos" value={fmt(d.totalDeposits)} color="#22c55e" />
        <KPI icon={<CreditCard className="w-4 h-4" />} label="Total Saques" value={fmt(d.totalWithdrawals)} color="#ef4444" />
        <KPI icon={<Receipt className="w-4 h-4" />} label="Ticket Médio" value={fmt(d.avgTicket)} color="#3b82f6" />
        <KPI icon={<TrendingUp className="w-4 h-4" />} label="Fluxo Líquido" value={fmt(d.fluxoLiquido)} color={d.fluxoLiquido >= 0 ? "#22c55e" : "#ef4444"} />
      </div>

      {/* Row 2: Users/Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={<Wallet className="w-4 h-4" />} label="Saldo Total Usuários" value={fmt(d.saldoTotal)} color="#3b82f6" />
        <KPI icon={<Gift className="w-4 h-4" />} label="Bônus Total Usuários" value={fmt(d.bonusTotal)} color="#22c55e" />
        <KPI icon={<BarChart3 className="w-4 h-4" />} label="Saldo + Bônus" value={fmt(d.saldoTotal + d.bonusTotal)} color="#a855f7" />
        <KPI icon={<Users className="w-4 h-4" />} label="Total Usuários" value={String(d.totalUsers)} color="#f97316" sub={`+${d.newUsersToday} hoje`} />
      </div>

      {/* Row 3: Platform P&L */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI icon={<Target className="w-4 h-4" />} label="Valor Apostado" value={fmt(d.valorApostado)} color="#f97316" sub="(Perdas dos usuários)" />
        <KPI icon={<TrendingUp className="w-4 h-4" />} label="Ganhos Plataforma" value={fmt(d.ganhosPlat)} color="#22c55e" sub="(Perdas dos usuários)" />
        <KPI icon={<TrendingDown className="w-4 h-4" />} label="Perdas Plataforma" value={fmt(d.perdasPlat)} color="#ef4444" sub="(Ganhos dos usuários)" />
        <KPI icon={<Zap className="w-4 h-4" />} label="Resultado Plataforma" value={fmt(d.resultadoPlat)} color={d.resultadoPlat >= 0 ? "#22c55e" : "#ef4444"} sub="Ganhos - Perdas" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pie: Win/Lose distribution */}
        <div className="rounded-xl border p-5" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-white text-sm">Distribuição de Resultados</span>
          </div>
          <div className="flex items-center justify-center py-6">
            <svg width="140" height="140" viewBox="0 0 140 140">
              {totalOps === 0 ? (
                <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="20" />
              ) : (
                <>
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#ef4444" strokeWidth="20"
                    strokeDasharray={`${(d.loses / totalOps) * 345.6} 345.6`}
                    transform="rotate(-90 70 70)" />
                  <circle cx="70" cy="70" r="55" fill="none" stroke="#22c55e" strokeWidth="20"
                    strokeDasharray={`${(d.wins / totalOps) * 345.6} 345.6`}
                    strokeDashoffset={`-${(d.loses / totalOps) * 345.6}`}
                    transform="rotate(-90 70 70)" />
                </>
              )}
            </svg>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" /> Ganhos</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" /> Perdas</span>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Ganhos</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Perdas</span>
          </div>
        </div>

        {/* Line chart: 7 days performance */}
        <div className="lg:col-span-2 rounded-xl border p-5" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <LineChart className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-white text-sm">Desempenho dos Últimos 7 Dias</span>
          </div>
          {chart7d.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">Sem dados</div>
          ) : (
            <div className="relative h-40">
              {/* Y axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <div key={i} className="absolute left-0 text-[10px] text-gray-600" style={{ bottom: `${pct * 100}%`, transform: "translateY(50%)" }}>
                  R${Math.round(maxChart * pct)}
                </div>
              ))}
              <div className="ml-10 h-full flex items-end gap-2">
                {chart7d.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5" style={{ height: "100%" }}>
                      <div className="flex-1 rounded-sm transition-all" style={{ height: `${(c.ganhos / maxChart) * 100}%`, background: "rgba(34,197,94,0.6)" }} />
                      <div className="flex-1 rounded-sm transition-all" style={{ height: `${(c.perdas / maxChart) * 100}%`, background: "rgba(239,68,68,0.6)" }} />
                    </div>
                    <span className="text-[9px] text-gray-600">{fmtDate(c.date)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">⚬ Ganhos</span>
                <span className="flex items-center gap-1">⚬ Perdas</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Operations count */}
        <div className="rounded-xl border p-5" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-white text-sm">Quantidade de Operações</span>
          </div>
          <div className="flex flex-col gap-4 py-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Vitórias Usuários</div>
              <div className="w-full h-6 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-green-500/60 transition-all flex items-center px-2"
                  style={{ width: totalOps ? `${(d.wins / totalOps) * 100}%` : "0%" }}>
                  <span className="text-[10px] text-white font-bold">{d.wins}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Derrotas Usuários</div>
              <div className="w-full h-6 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-red-500/60 transition-all flex items-center px-2"
                  style={{ width: totalOps ? `${(d.loses / totalOps) * 100}%` : "0%" }}>
                  <span className="text-[10px] text-white font-bold">{d.loses}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-around mt-2">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{d.wins}</div>
              <div className="text-[10px] text-gray-500">Vitórias Usuários<br/>(Perdas Plataforma)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{d.loses}</div>
              <div className="text-[10px] text-gray-500">Derrotas Usuários<br/>(Ganhos Plataforma)</div>
            </div>
          </div>
        </div>

        {/* Financial summary */}
        <div className="rounded-xl border p-5" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="font-semibold text-white text-sm">Resumo Financeiro</span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { label: "Entradas (Depósitos)", value: d.totalDeposits, color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
              { label: "Saídas (Saques)", value: d.totalWithdrawals, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
              { label: "Saldo em Contas", value: d.saldoTotal, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
              { label: "Lucro da Plataforma", value: d.resultadoPlat, color: d.resultadoPlat >= 0 ? "#22c55e" : "#ef4444", bg: "rgba(249,115,22,0.08)" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: r.bg }}>
                <span className="text-sm text-gray-300">{r.label}</span>
                <span className="text-sm font-bold" style={{ color: r.color }}>{fmt(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profitable users */}
      <div className="rounded-xl border p-5" style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold text-white text-sm">Usuários Lucrativos</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-400">{profUsers.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <input type="text" placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-white outline-none w-40" />
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mb-3">Usuários que estão lucrando mais do que depositaram</p>
        {profUsers.length === 0 ? (
          <div className="text-center py-6 text-gray-600 text-sm">Nenhum usuário lucrativo no momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Usuário</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Depositado</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Saldo atual</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">Lucro líquido</th>
                </tr>
              </thead>
              <tbody>
                {profUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-2 px-3">
                      <div className="text-white font-medium">{u.name}</div>
                      <div className="text-[10px] text-gray-500">{u.email}</div>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300">{fmt(u.deposited)}</td>
                    <td className="py-2 px-3 text-right text-gray-300">{fmt(u.real_balance)}</td>
                    <td className="py-2 px-3 text-right text-green-400 font-bold">{fmt(u.net_profit)}</td>
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
