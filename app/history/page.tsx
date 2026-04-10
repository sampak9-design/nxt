"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Calendar, FileText, Download } from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";
import UserAvatar from "@/components/UserAvatar";

type Trade = {
  id: string;
  asset_id: string;
  asset_name: string;
  direction: "up" | "down";
  amount: number;
  payout: number;
  result: "win" | "lose";
  net_profit: number;
  account_type: "practice" | "real";
  entry_price: number;
  exit_price: number;
  started_at: number;
  resolved_at: number;
};

type Tab = "trading" | "saldo";
type AccountFilter = "all" | "practice" | "real";

function fmt(n: number) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtDate(ms: number) {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}.${mm}.${yy}, ${hh}:${mi}:${ss}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("trading");
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isVip, setIsVip] = useState(false);
  const [kycStatus, setKycStatus] = useState("none");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) {
        setAvatarUrl(d.user.avatar_url ? `${d.user.avatar_url}?t=${Date.now()}` : null);
        setIsVip(!!d.user.is_marketing);
        setKycStatus(d.user.kyc_status || "none");
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = accountFilter === "all" ? "" : `&account=${accountFilter}`;
    fetch(`/api/trades?limit=500${q}`)
      .then(r => r.json())
      .then(d => { setTrades(d.trades ?? []); setPage(1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accountFilter]);

  const totalInvest  = trades.reduce((s, t) => s + t.amount, 0);
  const totalProfit  = trades.reduce((s, t) => s + t.net_profit, 0);
  const totalPatrim  = totalInvest + totalProfit;

  const totalPages   = Math.max(1, Math.ceil(trades.length / perPage));
  const paginated    = trades.slice((page - 1) * perPage, page * perPage);

  const exportCSV = () => {
    const header = "Data,Ativo,Investimento,L/P Bruto,Patrimônio,Resultado\n";
    const rows = trades.map(t =>
      `${fmtDate(t.started_at)},${t.asset_name},${t.amount},${t.net_profit},${t.amount + t.net_profit},${t.result}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "historico-trading.csv"; a.click();
  };

  return (
    <div className="min-h-screen bg-white" style={{ color: "#111827" }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/traderoom")}>
          <ZyroLogo size={32} />
          <span className="font-bold text-gray-800 text-base hidden sm:block">ZyroOption</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <img src="https://flagcdn.com/20x15/br.png" alt="PT" />
            <span className="hidden sm:block">Pt</span>
          </button>
          <UserAvatar avatarUrl={avatarUrl} isVip={isVip} kycStatus={kycStatus} size={36} />
          <button onClick={() => router.push("/traderoom")}
            className="px-4 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: "#f97316" }}>
            Negociar
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Title + tabs */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Histórico de trading</h1>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setTab("trading")}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: tab === "trading" ? "#f97316" : "transparent", color: tab === "trading" ? "#fff" : "#6b7280" }}
            >Trading</button>
            <button
              onClick={() => setTab("saldo")}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
              style={{ background: tab === "saldo" ? "#f97316" : "transparent", color: tab === "saldo" ? "#fff" : "#6b7280" }}
            >Saldo</button>
          </div>
        </div>

        {tab === "trading" && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-end gap-4 mb-4 p-4 bg-gray-50 rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">Instrumento de negociação</span>
                <div className="relative">
                  <select className="appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm" style={{ borderColor: "#d1d5db", minWidth: 160 }}>
                    <option>Opções</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">Tipo de conta</span>
                <div className="relative">
                  <select
                    value={accountFilter}
                    onChange={e => setAccountFilter(e.target.value as AccountFilter)}
                    className="appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm" style={{ borderColor: "#d1d5db", minWidth: 160 }}
                  >
                    <option value="all">Todas</option>
                    <option value="practice">Demonstração</option>
                    <option value="real">Real</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">Data</span>
                <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#d1d5db" }}>
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">Último mês</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-2">Dados para o período selecionado</p>
            <p className="text-xs text-gray-400 mb-4 italic">Você só pode baixar dados relativos à sua conta real e cobrindo no máximo 3 meses.</p>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="p-4 border rounded-xl" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs text-gray-500">Investimento total</span>
                <div className="text-xl font-bold text-gray-900 mt-1">R${fmt(totalInvest)}</div>
                <span className="text-[10px] text-gray-400">Soma do valor investido</span>
              </div>
              <div className="p-4 border rounded-xl" style={{ borderColor: "#e5e7eb" }}>
                <span className="text-xs text-gray-500">Total do Patrimônio</span>
                <div className="text-xl font-bold mt-1" style={{ color: "#f97316" }}>R${fmt(totalPatrim)}</div>
                <span className="text-[10px] text-gray-400">Investimento + lucro</span>
              </div>
              <div className="p-4 border rounded-xl" style={{ borderColor: totalProfit >= 0 ? "#22c55e" : "#ef4444", borderWidth: 2 }}>
                <span className="text-xs text-gray-500">Lucro bruto total</span>
                <div className="text-xl font-bold mt-1" style={{ color: totalProfit >= 0 ? "#22c55e" : "#ef4444" }}>
                  R${fmt(totalProfit)}
                </div>
                <span className="text-[10px] text-gray-400">Resultado do período</span>
              </div>
              <button className="p-4 border rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors" style={{ borderColor: "#e5e7eb" }}>
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500">PDF</span>
              </button>
              <button onClick={exportCSV} className="p-4 border rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-gray-50 transition-colors" style={{ borderColor: "#e5e7eb" }}>
                <Download className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-500">CSV</span>
              </button>
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50" style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Hora da compra (fechamento) UTC(-03:00)</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Ativo</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Investimento</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">L/P Bruto</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Patrimônio</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Carregando...</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400">Nenhuma operação encontrada.</td></tr>
                  ) : paginated.map(t => {
                    const patrim = t.amount + t.net_profit;
                    const pctStr = t.result === "win" ? `${t.payout.toFixed(2)}%` : "-100.00%";
                    const isExp = expandedId === t.id;
                    return (
                      <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" style={{ borderBottom: "1px solid #f3f4f6" }}
                        onClick={() => setExpandedId(isExp ? null : t.id)}
                      >
                        <td className="py-3 px-4">
                          <div className="text-xs text-gray-700">{fmtDate(t.started_at)}.000</div>
                          <div className="text-xs text-gray-400">{fmtDate(t.resolved_at)}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">{t.asset_name}</td>
                        <td className="py-3 px-4 text-right text-gray-700">R${fmt(t.amount)}</td>
                        <td className="py-3 px-4 text-right">
                          <div style={{ color: t.result === "win" ? "#22c55e" : "#ef4444" }} className="font-medium">
                            {t.result === "win" ? "+" : ""}R${fmt(t.net_profit)}
                          </div>
                          <div className="text-[10px]" style={{ color: t.result === "win" ? "#22c55e" : "#ef4444" }}>{pctStr}</div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">R${fmt(patrim)}</td>
                        <td className="py-3 px-4 text-center">
                          <ChevronDown className={`w-4 h-4 text-orange-400 transition-transform ${isExp ? "rotate-180" : ""}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>Mostrando {(page - 1) * perPage + 1}–{Math.min(page * perPage, trades.length)} de {trades.length}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40" style={{ borderColor: "#d1d5db" }}
                >Anterior</button>
                <span className="text-sm">Página <strong>{page}</strong> de <strong>{totalPages}</strong></span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40" style={{ borderColor: "#d1d5db" }}
                >Próxima</button>
              </div>
            </div>
          </>
        )}

        {tab === "saldo" && (
          <div className="text-center py-20 text-gray-400">Em breve…</div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 px-6 text-center" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <ZyroLogo size={28} />
          <span className="text-sm text-gray-500">© 2026 ZyroOption. Todos os direitos reservados.</span>
        </div>
        <div className="text-sm text-gray-400 mb-4">
          Powered by <span className="font-bold text-gray-600">ZyroOption</span>
        </div>
        <div className="flex justify-center gap-3 mb-6">
          {["facebook", "twitter", "instagram", "youtube"].map(s => (
            <div key={s} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: s === "facebook" ? "#1877f2" : s === "twitter" ? "#1da1f2" : s === "instagram" ? "#e4405f" : "#ff0000" }}>
              <span className="text-white text-xs font-bold">{s[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 max-w-3xl mx-auto leading-relaxed">
          AVISO DE RISCO: A ZyroOption fornece seus serviços exclusivamente em territórios em que é licenciada.
          A ZyroOption não está autorizada pela Comissão de Valores Mobiliários (&quot;CVM&quot;), a diferença diretamente
          dos tipos de distribuição de valores mobiliários ou investidores residentes no Brasil.
        </p>
      </footer>
    </div>
  );
}
