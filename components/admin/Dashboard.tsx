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

function GlowCard({ children, glow, className = "" }: { children: React.ReactNode; glow?: string; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      {glow && (
        <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
          style={{ background: `linear-gradient(135deg, ${glow}40, transparent, ${glow}20)` }} />
      )}
      <div className="relative rounded-2xl p-5 h-full backdrop-blur-sm overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}>
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, trend, sub, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string; color: string; trend?: "up" | "down"; sub?: string; delay?: number;
}) {
  return (
    <div className="relative group animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      {/* Glow on hover */}
      <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
        style={{ background: `linear-gradient(135deg, ${color}30, transparent 60%, ${color}15)`, filter: "blur(1px)" }} />
      <div className="relative rounded-2xl p-4 h-full overflow-hidden transition-transform duration-300 group-hover:translate-y-[-2px]"
        style={{
          background: "linear-gradient(145deg, rgba(17,24,39,0.95), rgba(10,15,30,0.9))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}>
        {/* Subtle gradient overlay */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04]"
          style={{ background: `radial-gradient(circle, ${color}, transparent)`, transform: "translate(30%, -30%)" }} />

        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)`, boxShadow: `0 0 20px ${color}15` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        </div>
        <div className="flex items-end gap-2.5">
          <span className="text-[22px] font-extrabold text-white leading-none tracking-tight">{value}</span>
          {trend && (
            <span className={`flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm ${
              trend === "up" ? "text-emerald-400" : "text-red-400"
            }`}
              style={{ background: trend === "up" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)" }}>
              {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            </span>
          )}
        </div>
        {sub && <span className="text-[10px] text-gray-600 mt-1.5 block">{sub}</span>}
      </div>
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
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
        </div>
        <span className="text-gray-500 text-sm font-medium">Carregando dashboard...</span>
      </div>
    </div>
  );
  const d = data!;

  const chart7d = d.chart7d ?? [];
  const maxChart = Math.max(...chart7d.map(c => Math.max(c.ganhos, c.perdas)), 1);
  const totalOps = d.wins + d.loses;
  const winPct = totalOps > 0 ? (d.wins / totalOps) * 100 : 0;
  const losePct = totalOps > 0 ? (d.loses / totalOps) * 100 : 0;
  const profUsers = (d.profitableUsers ?? []).filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <style>{`
        @keyframes fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.5s ease-out forwards; opacity: 0; }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-up">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Visão geral da plataforma em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period filter */}
          <div className="flex items-center rounded-xl overflow-hidden backdrop-blur-sm"
            style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setPeriod(p.days)}
                className="px-3.5 py-2.5 text-xs font-semibold transition-all relative"
                style={{
                  background: period === p.days ? "rgba(249,115,22,0.2)" : "transparent",
                  color: period === p.days ? "#fb923c" : "#4b5563",
                }}>
                {period === p.days && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-orange-500" />
                )}
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={() => load(period)}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-white/5 hover:scale-105 active:scale-95"
            style={{ background: "rgba(17,24,39,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Row 1: Financial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Depósitos" value={fmt(d.totalDeposits)} color="#10b981" trend="up" delay={50} />
        <StatCard icon={<CreditCard className="w-4 h-4" />} label="Saques" value={fmt(d.totalWithdrawals)} color="#ef4444" trend="down" delay={100} />
        <StatCard icon={<Receipt className="w-4 h-4" />} label="Ticket Médio" value={fmt(d.avgTicket)} color="#6366f1" delay={150} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Fluxo Líquido" value={fmt(d.fluxoLiquido)} color={d.fluxoLiquido >= 0 ? "#10b981" : "#ef4444"} trend={d.fluxoLiquido >= 0 ? "up" : "down"} delay={200} />
      </div>

      {/* KPI Row 2: Users */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Wallet className="w-4 h-4" />} label="Saldo Usuários" value={fmt(d.saldoTotal)} color="#3b82f6" delay={250} />
        <StatCard icon={<Gift className="w-4 h-4" />} label="Bônus Total" value={fmt(d.bonusTotal)} color="#8b5cf6" delay={300} />
        <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Saldo + Bônus" value={fmt(d.saldoTotal + d.bonusTotal)} color="#a78bfa" delay={350} />
        <StatCard icon={<Users className="w-4 h-4" />} label="Usuários" value={String(d.totalUsers)} color="#f97316" sub={`+${d.newUsersToday} novos hoje`} delay={400} />
      </div>

      {/* KPI Row 3: Platform P&L */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Target className="w-4 h-4" />} label="Apostado" value={fmt(d.valorApostado)} color="#f97316" delay={450} />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Ganhos Plat." value={fmt(d.ganhosPlat)} color="#10b981" sub="Perdas dos usuários" delay={500} />
        <StatCard icon={<TrendingDown className="w-4 h-4" />} label="Perdas Plat." value={fmt(d.perdasPlat)} color="#ef4444" sub="Ganhos dos usuários" delay={550} />
        <StatCard icon={<Zap className="w-4 h-4" />} label="Resultado" value={fmt(d.resultadoPlat)} color={d.resultadoPlat >= 0 ? "#10b981" : "#ef4444"} trend={d.resultadoPlat >= 0 ? "up" : "down"} delay={600} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "650ms" }}>
        {/* Donut */}
        <GlowCard glow="#f97316">
          <h3 className="font-bold text-white text-sm mb-6">Distribuição</h3>
          <div className="flex items-center justify-center py-2">
            <div className="relative">
              <svg width="160" height="160" viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                  <filter id="glow-green"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  <filter id="glow-red"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
                {totalOps === 0 ? (
                  <circle cx="80" cy="80" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
                ) : (
                  <>
                    <circle cx="80" cy="80" r="60" fill="none" stroke="url(#grad-red)" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${losePct / 100 * 377} 377`} transform="rotate(-90 80 80)" filter="url(#glow-red)" />
                    <circle cx="80" cy="80" r="60" fill="none" stroke="url(#grad-green)" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${winPct / 100 * 377} 377`} strokeDashoffset={`-${losePct / 100 * 377}`}
                      transform="rotate(-90 80 80)" filter="url(#glow-green)" />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white">{totalOps}</span>
                <span className="text-[10px] text-gray-500 font-medium">operações</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 0 8px rgba(16,185,129,0.4)" }} />
              <span className="text-xs text-gray-400">Win <span className="text-white font-bold">{winPct.toFixed(1)}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 0 8px rgba(239,68,68,0.4)" }} />
              <span className="text-xs text-gray-400">Loss <span className="text-white font-bold">{losePct.toFixed(1)}%</span></span>
            </div>
          </div>
        </GlowCard>

        {/* 7-day chart */}
        <GlowCard glow="#3b82f6" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white text-sm">Performance 7 dias</h3>
            <div className="flex items-center gap-5 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }} /> Ganhos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }} /> Perdas</span>
            </div>
          </div>
          {chart7d.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-600 text-sm">Sem dados no período</div>
          ) : (
            <div className="relative h-48">
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <div key={i} className="absolute left-12 right-0" style={{ bottom: `${pct * 100}%`, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                  <span className="absolute -left-12 text-[10px] text-gray-600 font-medium -translate-y-1/2 w-10 text-right">
                    {Math.round(maxChart * pct)}
                  </span>
                </div>
              ))}
              <div className="ml-12 h-full flex items-end gap-3">
                {chart7d.map((c, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full flex items-end gap-1.5 relative" style={{ height: "85%" }}>
                      <div className="flex-1 rounded-lg transition-all duration-300 group-hover:shadow-lg relative overflow-hidden"
                        style={{
                          height: `${Math.max((c.ganhos / maxChart) * 100, 3)}%`,
                          background: "linear-gradient(to top, rgba(16,185,129,0.3), rgba(16,185,129,0.7))",
                          boxShadow: "0 0 10px rgba(16,185,129,0.1)",
                        }}>
                        {/* Shimmer */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-30"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "shimmer 1.5s ease-in-out" }} />
                      </div>
                      <div className="flex-1 rounded-lg transition-all duration-300 group-hover:shadow-lg relative overflow-hidden"
                        style={{
                          height: `${Math.max((c.perdas / maxChart) * 100, 3)}%`,
                          background: "linear-gradient(to top, rgba(239,68,68,0.3), rgba(239,68,68,0.7))",
                          boxShadow: "0 0 10px rgba(239,68,68,0.1)",
                        }}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-30"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "shimmer 1.5s ease-in-out" }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{fmtDate(c.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlowCard>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: "700ms" }}>
        {/* Operations */}
        <GlowCard glow="#8b5cf6">
          <h3 className="font-bold text-white text-sm mb-6">Operações</h3>
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-gray-400 font-medium">Vitórias dos usuários</span>
                <span className="text-xs font-extrabold text-emerald-400">{d.wins}</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{
                    width: totalOps ? `${(d.wins / totalOps) * 100}%` : "0%",
                    background: "linear-gradient(90deg, #10b981, #34d399)",
                    boxShadow: "0 0 12px rgba(16,185,129,0.3)",
                  }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", animation: "shimmer 2s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-gray-400 font-medium">Derrotas dos usuários</span>
                <span className="text-xs font-extrabold text-red-400">{d.loses}</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{
                    width: totalOps ? `${(d.loses / totalOps) * 100}%` : "0%",
                    background: "linear-gradient(90deg, #ef4444, #f87171)",
                    boxShadow: "0 0 12px rgba(239,68,68,0.3)",
                  }}>
                  <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", animation: "shimmer 2s ease-in-out infinite" }} />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-emerald-400" style={{ textShadow: "0 0 20px rgba(16,185,129,0.3)" }}>{d.wins}</div>
              <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">Vitórias<br />(Perdas Plataforma)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-red-400" style={{ textShadow: "0 0 20px rgba(239,68,68,0.3)" }}>{d.loses}</div>
              <div className="text-[10px] text-gray-500 mt-1 leading-relaxed">Derrotas<br />(Ganhos Plataforma)</div>
            </div>
          </div>
        </GlowCard>

        {/* Financial summary */}
        <GlowCard glow="#10b981">
          <h3 className="font-bold text-white text-sm mb-5">Resumo Financeiro</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: "Entradas (Depósitos)", value: d.totalDeposits, color: "#10b981", icon: <ArrowUpRight className="w-3.5 h-3.5" /> },
              { label: "Saídas (Saques)", value: d.totalWithdrawals, color: "#ef4444", icon: <ArrowDownRight className="w-3.5 h-3.5" /> },
              { label: "Saldo em Contas", value: d.saldoTotal, color: "#3b82f6", icon: <Wallet className="w-3.5 h-3.5" /> },
              { label: "Lucro da Plataforma", value: d.resultadoPlat, color: d.resultadoPlat >= 0 ? "#10b981" : "#ef4444", icon: <Zap className="w-3.5 h-3.5" /> },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:translate-x-1 group cursor-default"
                style={{
                  background: `linear-gradient(135deg, ${r.color}08, ${r.color}03)`,
                  border: `1px solid ${r.color}12`,
                }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${r.color}20, ${r.color}10)`, color: r.color, boxShadow: `0 0 12px ${r.color}15` }}>
                    {r.icon}
                  </div>
                  <span className="text-[13px] text-gray-300 font-medium">{r.label}</span>
                </div>
                <span className="text-[14px] font-extrabold tracking-tight" style={{ color: r.color }}>{fmt(r.value)}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Profitable users */}
      <div className="animate-fade-up" style={{ animationDelay: "750ms" }}>
        <GlowCard glow="#eab308">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))", boxShadow: "0 0 20px rgba(234,179,8,0.1)" }}>
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">Usuários Lucrativos</h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                    style={{ background: "rgba(234,179,8,0.1)", color: "#fbbf24", border: "1px solid rgba(234,179,8,0.2)" }}>
                    {profUsers.length}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Lucrando mais do que depositaram</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl transition-all focus-within:border-gray-600"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Search className="w-4 h-4 text-gray-600" />
              <input type="text" placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-xs text-white outline-none w-48 placeholder:text-gray-600" />
            </div>
          </div>

          {profUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">Nenhum usuário lucrativo no momento</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 500 }}>
                <thead>
                  <tr>
                    {["Usuário", "Depositado", "Saldo", "Lucro"].map((h, i) => (
                      <th key={h} className={`${i === 0 ? "text-left" : "text-right"} py-3 px-4 text-[10px] text-gray-500 font-semibold uppercase tracking-widest`}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profUsers.map((u, i) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group"
                      style={{ borderBottom: i < profUsers.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white transition-transform duration-200 group-hover:scale-105"
                            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", boxShadow: "0 2px 8px rgba(249,115,22,0.3)" }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-semibold text-[13px]">{u.name}</div>
                            <div className="text-[10px] text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right text-gray-400 font-medium">{fmt(u.deposited)}</td>
                      <td className="py-3.5 px-4 text-right text-gray-300 font-medium">{fmt(u.real_balance)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-emerald-400 font-extrabold" style={{ textShadow: "0 0 12px rgba(16,185,129,0.3)" }}>{fmt(u.net_profit)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlowCard>
      </div>
    </div>
  );
}
