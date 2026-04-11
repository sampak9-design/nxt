"use client";

import { REVENUE_CHART, TRADES, ASSETS } from "./mockData";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, BarChart3, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";

const glowCard = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

export default function ReportsPage() {
  const totalRevenue  = REVENUE_CHART.reduce((a, d) => a + d.revenue, 0);
  const totalDeposits = REVENUE_CHART.reduce((a, d) => a + d.deposits, 0);
  const totalPayouts  = REVENUE_CHART.reduce((a, d) => a + d.payouts, 0);
  const margin        = totalDeposits > 0 ? ((totalRevenue / totalDeposits) * 100).toFixed(1) : "0";
  const totalTrades   = REVENUE_CHART.reduce((a, d) => a + d.trades, 0);

  const maxVal = Math.max(...REVENUE_CHART.map((d) => Math.max(d.deposits, d.payouts)));

  // P&L by asset
  const byAsset = ASSETS.map((a) => {
    const assetTrades = TRADES.filter((t) => t.asset === a.name && t.accountType === "real");
    const vol    = assetTrades.reduce((s, t) => s + t.amount, 0);
    const losses = assetTrades.filter((t) => t.result === "lose").reduce((s, t) => s + t.amount, 0);
    const payouts = assetTrades.filter((t) => t.result === "win").reduce((s, t) => s + t.profit, 0);
    return { name: a.name, type: a.type, vol, edge: losses - payouts, trades: assetTrades.length };
  }).filter((a) => a.trades > 0).sort((a, b) => b.edge - a.edge);

  const maxEdge = Math.max(...byAsset.map((x) => Math.abs(x.edge)), 1);

  const STAT_CARDS = [
    { label: "Receita Líquida", value: `R$ ${totalRevenue.toLocaleString()}`, color: "#10b981", icon: <TrendingUp className="w-4 h-4" />, trend: "up" as const },
    { label: "Depósitos", value: `R$ ${totalDeposits.toLocaleString()}`, color: "#3b82f6", icon: <DollarSign className="w-4 h-4" />, trend: "up" as const },
    { label: "Pagamentos", value: `R$ ${totalPayouts.toLocaleString()}`, color: "#ef4444", icon: <CreditCard className="w-4 h-4" />, trend: "down" as const },
    { label: "Margem", value: `${margin}%`, color: "#f97316", icon: <Target className="w-4 h-4" /> },
    { label: "Total Trades", value: totalTrades.toLocaleString(), color: "#8b5cf6", icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const TYPE_COLORS: Record<string, string> = {
    Crypto: "#f97316", Forex: "#3b82f6", OTC: "#a855f7",
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px]">
      <style>{`
        @keyframes rpt-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .rpt-fade { animation: rpt-fade-up 0.5s ease-out forwards; opacity: 0; }
        @keyframes rpt-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>

      {/* Header */}
      <div className="rpt-fade">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))", boxShadow: "0 0 20px rgba(139,92,246,0.1)" }}>
            <BarChart3 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Relatórios</h1>
            <p className="text-sm text-gray-500">Análise financeira e performance por ativo</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {STAT_CARDS.map((s, i) => (
          <div key={s.label} className="relative group rpt-fade" style={{ animationDelay: `${50 + i * 60}ms` }}>
            <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
              style={{ background: `linear-gradient(135deg, ${s.color}30, transparent 60%, ${s.color}15)`, filter: "blur(1px)" }} />
            <div className="relative rounded-2xl p-4 h-full overflow-hidden transition-transform duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: "linear-gradient(145deg, rgba(17,24,39,0.95), rgba(10,15,30,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}>
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.04]"
                style={{ background: `radial-gradient(circle, ${s.color}, transparent)`, transform: "translate(30%, -30%)" }} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">{s.label}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${s.color}20, ${s.color}10)`, boxShadow: `0 0 16px ${s.color}15` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xl font-extrabold text-white leading-none tracking-tight">{s.value}</span>
                {s.trend && (
                  <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    s.trend === "up" ? "text-emerald-400" : "text-red-400"
                  }`} style={{ background: s.trend === "up" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)" }}>
                    {s.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rpt-fade" style={{ animationDelay: "400ms" }}>
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.15), transparent, rgba(139,92,246,0.1))" }} />
          <div className="relative rounded-2xl p-6 overflow-hidden" style={glowCard}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-bold text-white text-[15px]">Depósitos vs Pagamentos</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Últimos 14 dias</p>
              </div>
              <div className="flex items-center gap-6 text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }} /> Depósitos
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }} /> Pagamentos
                </span>
              </div>
            </div>

            <div className="relative h-56">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <div key={i} className="absolute left-14 right-0" style={{ bottom: `${pct * 100}%`, borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                  <span className="absolute -left-14 text-[10px] text-gray-600 font-medium -translate-y-1/2 w-12 text-right">
                    R${Math.round(maxVal * pct / 1000)}k
                  </span>
                </div>
              ))}

              <div className="ml-14 h-full flex items-end gap-2">
                {REVENUE_CHART.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 hidden group-hover/bar:flex flex-col items-center z-20 pointer-events-none">
                      <div className="rounded-xl px-4 py-3 text-[11px] whitespace-nowrap shadow-2xl"
                        style={{ background: "linear-gradient(135deg, rgba(17,24,39,0.98), rgba(10,15,30,0.95))", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
                        <div className="font-bold text-white mb-1.5">{d.date}</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> <span className="text-blue-400">Dep: R${d.deposits.toLocaleString()}</span></div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-red-400">Pag: R${d.payouts.toLocaleString()}</span></div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> <span className="text-emerald-400">Rec: R${d.revenue.toLocaleString()}</span></div>
                          <div className="text-gray-500">{d.trades} trades</div>
                        </div>
                      </div>
                      <div className="w-2 h-2 rotate-45 -mt-1" style={{ background: "rgba(17,24,39,0.98)", borderRight: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)" }} />
                    </div>

                    <div className="w-full flex items-end gap-1.5" style={{ height: "88%" }}>
                      <div className="flex-1 rounded-lg transition-all duration-300 group-hover/bar:shadow-lg relative overflow-hidden cursor-pointer"
                        style={{
                          height: `${Math.max((d.deposits / maxVal) * 100, 3)}%`,
                          background: "linear-gradient(to top, rgba(59,130,246,0.3), rgba(99,102,241,0.7))",
                          boxShadow: "0 0 8px rgba(59,130,246,0.1)",
                        }}>
                        <div className="absolute inset-0 opacity-0 group-hover/bar:opacity-40"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "rpt-shimmer 1.5s ease-in-out" }} />
                      </div>
                      <div className="flex-1 rounded-lg transition-all duration-300 group-hover/bar:shadow-lg relative overflow-hidden cursor-pointer"
                        style={{
                          height: `${Math.max((d.payouts / maxVal) * 100, 3)}%`,
                          background: "linear-gradient(to top, rgba(239,68,68,0.3), rgba(239,68,68,0.7))",
                          boxShadow: "0 0 8px rgba(239,68,68,0.1)",
                        }}>
                        <div className="absolute inset-0 opacity-0 group-hover/bar:opacity-40"
                          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", animation: "rpt-shimmer 1.5s ease-in-out" }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{d.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* P&L by Asset */}
      <div className="rpt-fade" style={{ animationDelay: "500ms" }}>
        <div className="relative group">
          <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
            style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.15), transparent, rgba(249,115,22,0.1))" }} />
          <div className="relative rounded-2xl p-6 overflow-hidden" style={glowCard}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-white text-[15px]">P&L por Ativo</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Conta real — margem da casa por ativo</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)" }}>
                <TrendingUp className="w-3.5 h-3.5" />
                {byAsset.length} ativos
              </div>
            </div>

            {byAsset.length === 0 ? (
              <div className="text-center py-12 text-gray-600 text-sm">Nenhuma operação real registrada</div>
            ) : (
              <div className="flex flex-col gap-3">
                {byAsset.map((a, i) => {
                  const positive = a.edge >= 0;
                  const color = positive ? "#10b981" : "#ef4444";
                  const typeColor = TYPE_COLORS[a.type] ?? "#64748b";
                  return (
                    <div key={a.name} className="group/row flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.02]"
                      style={{ animationDelay: `${550 + i * 40}ms` }}>
                      {/* Asset name + type */}
                      <div className="w-32 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] text-white font-semibold">{a.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                            style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}20` }}>
                            {a.type}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex-1 h-7 rounded-lg overflow-hidden relative" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="h-full rounded-lg transition-all duration-700 relative overflow-hidden"
                          style={{
                            width: `${Math.max((Math.abs(a.edge) / maxEdge) * 100, 4)}%`,
                            background: `linear-gradient(90deg, ${color}30, ${color}70)`,
                            boxShadow: `0 0 12px ${color}20`,
                          }}>
                          <div className="absolute inset-0 opacity-30"
                            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)", animation: "rpt-shimmer 3s ease-in-out infinite" }} />
                        </div>
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-[12px] font-extrabold tracking-tight" style={{ color, textShadow: `0 0 8px ${color}40` }}>
                            {positive ? "+" : ""}R${Math.abs(a.edge).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Volume + trades */}
                      <div className="w-28 flex-shrink-0 text-right">
                        <div className="text-[11px] text-gray-400 font-medium">R${a.vol.toLocaleString()}</div>
                        <div className="text-[10px] text-gray-600">{a.trades} ops</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 rpt-fade" style={{ animationDelay: "600ms" }}>
        {[
          { label: "Receita Total", value: `R$ ${totalRevenue.toLocaleString()}`, color: "#10b981", desc: "Depósitos - Pagamentos", icon: <TrendingUp className="w-4 h-4" /> },
          { label: "Margem Bruta", value: `${margin}%`, color: "#f97316", desc: "Receita / Depósitos × 100", icon: <Target className="w-4 h-4" /> },
          { label: "Volume Total", value: `R$ ${(totalDeposits + totalPayouts).toLocaleString()}`, color: "#8b5cf6", desc: "Depósitos + Pagamentos", icon: <BarChart3 className="w-4 h-4" /> },
        ].map((item) => (
          <div key={item.label} className="relative group">
            <div className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"
              style={{ background: `linear-gradient(135deg, ${item.color}25, transparent 60%, ${item.color}10)`, filter: "blur(1px)" }} />
            <div className="relative rounded-2xl p-5 h-full transition-transform duration-300 group-hover:translate-y-[-2px]"
              style={{
                background: "linear-gradient(145deg, rgba(17,24,39,0.95), rgba(10,15,30,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`, boxShadow: `0 0 16px ${item.color}15` }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                </div>
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">{item.label}</span>
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight" style={{ textShadow: `0 0 20px ${item.color}20` }}>{item.value}</div>
              <div className="text-[10px] text-gray-600 mt-1">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
