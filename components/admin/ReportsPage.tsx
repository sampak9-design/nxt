"use client";

import { REVENUE_CHART, TRADES, ASSETS } from "./mockData";

export default function ReportsPage() {
  const totalRevenue  = REVENUE_CHART.reduce((a, d) => a + d.revenue, 0);
  const totalDeposits = REVENUE_CHART.reduce((a, d) => a + d.deposits, 0);
  const totalPayouts  = REVENUE_CHART.reduce((a, d) => a + d.payouts, 0);
  const margin        = totalDeposits > 0 ? ((totalRevenue / totalDeposits) * 100).toFixed(1) : "0";

  const maxDeposit = Math.max(...REVENUE_CHART.map((d) => d.deposits));

  // P&L by asset
  const byAsset = ASSETS.map((a) => {
    const assetTrades = TRADES.filter((t) => t.asset === a.name && t.accountType === "real");
    const vol    = assetTrades.reduce((s, t) => s + t.amount, 0);
    const losses = assetTrades.filter((t) => t.result === "lose").reduce((s, t) => s + t.amount, 0);
    const payouts = assetTrades.filter((t) => t.result === "win").reduce((s, t) => s + t.profit, 0);
    return { name: a.name, type: a.type, vol, edge: losses - payouts, trades: assetTrades.length };
  }).filter((a) => a.trades > 0).sort((a, b) => b.edge - a.edge);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: "Receita total",  value: `$${totalRevenue.toLocaleString()}`,  color: "#22c55e" },
          { label: "Depósitos",      value: `$${totalDeposits.toLocaleString()}`, color: "#3b82f6" },
          { label: "Pagamentos",     value: `$${totalPayouts.toLocaleString()}`,  color: "#ef4444" },
          { label: "Margem",         value: `${margin}%`,                          color: "#f97316" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4"
            style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-xl border p-5"
        style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="font-semibold text-white text-sm block mb-5">Depósitos vs Pagamentos — 14 dias</span>
        <div className="flex items-end gap-2 h-48">
          {REVENUE_CHART.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-[10px] whitespace-nowrap text-white shadow-xl">
                  <div className="font-semibold mb-1">{d.date}</div>
                  <div className="text-blue-400">Dep: ${d.deposits.toLocaleString()}</div>
                  <div className="text-red-400">Pag: ${d.payouts.toLocaleString()}</div>
                  <div className="text-green-400">Rec: ${d.revenue.toLocaleString()}</div>
                  <div className="text-gray-400">{d.trades} trades</div>
                </div>
              </div>
              <div className="w-full flex items-end gap-0.5" style={{ height: 168 }}>
                <div className="flex-1 rounded-t-sm transition-all"
                  style={{ height: `${(d.deposits / maxDeposit) * 100}%`, background: "rgba(59,130,246,0.6)" }} />
                <div className="flex-1 rounded-t-sm transition-all"
                  style={{ height: `${(d.payouts / maxDeposit) * 100}%`, background: "rgba(239,68,68,0.6)" }} />
              </div>
              <span className="text-[9px] text-gray-600">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* P&L by asset */}
      <div className="rounded-xl border p-5"
        style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="font-semibold text-white text-sm block mb-4">P&L por ativo (conta real)</span>
        {byAsset.length === 0 ? (
          <p className="text-xs text-gray-500">Nenhuma operação real registrada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {byAsset.map((a) => {
              const maxEdge = Math.max(...byAsset.map((x) => Math.abs(x.edge)), 1);
              const positive = a.edge >= 0;
              return (
                <div key={a.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-24 truncate">{a.name}</span>
                  <div className="flex-1 h-5 rounded overflow-hidden relative" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="h-full rounded transition-all"
                      style={{
                        width: `${(Math.abs(a.edge) / maxEdge) * 100}%`,
                        background: positive ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
                      }} />
                    <span className="absolute inset-0 flex items-center px-2 text-[10px] font-medium"
                      style={{ color: positive ? "#22c55e" : "#ef4444" }}>
                      {positive ? "+" : ""}{a.edge > 0 ? `$${a.edge}` : `-$${Math.abs(a.edge)}`}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 w-12 text-right">{a.trades} ops</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
