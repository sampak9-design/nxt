"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Calendar, FileText, Download, ArrowDownCircle, ArrowUpCircle, DollarSign, HelpCircle, LogOut, Clock } from "lucide-react";
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

// ── DateRangePicker ─────────────────────────────────────────────────────
const MONTHS_PT = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DAYS_PT = ["2\u00aa","3\u00aa","4\u00aa","5\u00aa","6\u00aa","S\u00e1","Do"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function startDay(y: number, m: number) { return (new Date(y, m, 1).getDay() + 6) % 7; } // Mon=0

function DateRangePicker({ from, to, onChange }: {
  from: Date; to: Date; onChange: (f: Date, t: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<"from" | "to">("from");
  const [tmpFrom, setTmpFrom] = useState(from);
  const [tmpTo, setTmpTo] = useState(to);
  const ref = useRef<HTMLDivElement>(null);

  // Two months: left = previous month, right = current month relative to `to`
  const rightMonth = tmpTo.getMonth();
  const rightYear  = tmpTo.getFullYear();
  const leftMonth  = rightMonth === 0 ? 11 : rightMonth - 1;
  const leftYear   = rightMonth === 0 ? rightYear - 1 : rightYear;
  const [viewYear, setViewYear] = useState(rightYear);
  const [viewMonth, setViewMonth] = useState(rightMonth);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };
  const leftM = viewMonth === 0 ? 11 : viewMonth - 1;
  const leftY = viewMonth === 0 ? viewYear - 1 : viewYear;

  const handleDay = (d: Date) => {
    if (selecting === "from") {
      setTmpFrom(d);
      if (d > tmpTo) setTmpTo(d);
      setSelecting("to");
    } else {
      if (d < tmpFrom) { setTmpFrom(d); }
      else { setTmpTo(d); setSelecting("from"); }
    }
  };

  const apply = () => { onChange(tmpFrom, tmpTo); setOpen(false); };

  const setPreset = (name: string) => {
    const now = new Date(); now.setHours(0,0,0,0);
    let f = new Date(now), t = new Date(now);
    if (name === "hoje") { /* already today */ }
    else if (name === "ontem") { f.setDate(f.getDate() - 1); t = new Date(f); }
    else if (name === "semana") { f.setDate(f.getDate() - 7); }
    else if (name === "mes") { f.setMonth(f.getMonth() - 1); }
    setTmpFrom(f); setTmpTo(t);
  };

  const isInRange = (d: Date) => d >= tmpFrom && d <= tmpTo;
  const isStart   = (d: Date) => d.toDateString() === tmpFrom.toDateString();
  const isEnd     = (d: Date) => d.toDateString() === tmpTo.toDateString();

  const renderMonth = (y: number, m: number) => {
    const days = daysInMonth(y, m);
    const start = startDay(y, m);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let i = 1; i <= days; i++) cells.push(new Date(y, m, i));
    return (
      <div className="flex-1">
        <div className="text-center font-bold text-gray-800 mb-2">{MONTHS_PT[m]} {y}</div>
        <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
          {DAYS_PT.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const inR = isInRange(d);
            const isS = isStart(d);
            const isE = isEnd(d);
            const today = d.toDateString() === new Date().toDateString();
            return (
              <button key={d.toISOString()} onClick={() => handleDay(d)}
                className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm transition-colors"
                style={{
                  background: isS || isE ? "#f97316" : inR ? "rgba(249,115,22,0.15)" : "transparent",
                  color: isS || isE ? "#fff" : today ? "#f97316" : inR ? "#f97316" : "#374151",
                  fontWeight: isS || isE || today ? 700 : 400,
                  outline: today && !isS && !isE ? "2px solid #f97316" : "none",
                  outlineOffset: -2,
                }}>
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const fmtShort = (d: Date) => `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  const fmtTop   = (d: Date) => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(v => !v); setViewYear(to.getFullYear()); setViewMonth(to.getMonth()); }}
        className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm hover:border-orange-300 transition-colors"
        style={{ borderColor: open ? "#f97316" : "#d1d5db" }}>
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-gray-700">{fmtShort(from)} — {fmtShort(to)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-start sm:justify-end sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2">
          {/* Mobile backdrop */}
          <div className="fixed inset-0 bg-black/20 sm:hidden" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:w-[620px] bg-white border rounded-t-xl sm:rounded-xl shadow-2xl p-4 sm:p-5 max-h-[85vh] overflow-y-auto" style={{ borderColor: "#e5e7eb" }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">Selecione um período</span>
            <span className="text-sm font-semibold" style={{ color: "#f97316" }}>
              {fmtTop(tmpFrom)} — {fmtTop(tmpTo)}
            </span>
          </div>

          {/* Calendars — 1 on mobile, 2 on desktop */}
          <div className="flex gap-4 sm:gap-6 mb-4">
            <button onClick={prevMonth} className="text-gray-400 hover:text-gray-700 text-lg px-1">←</button>
            <div className="hidden sm:block flex-1">{renderMonth(leftY, leftM)}</div>
            {renderMonth(viewYear, viewMonth)}
            <button onClick={nextMonth} className="text-gray-400 hover:text-gray-700 text-lg px-1">→</button>
          </div>

          {/* Presets + apply */}
          <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "#f3f4f6" }}>
            <div className="flex gap-4">
              {[["hoje","Hoje"],["ontem","Ontem"],["semana","Semana"],["mes","Mês"]].map(([k,l]) => (
                <button key={k} onClick={() => setPreset(k)} className="text-sm text-gray-600 hover:text-gray-900 font-medium">{l}</button>
              ))}
            </div>
            <button onClick={apply}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white" style={{ background: "#f97316" }}>
              Aplicar
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

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

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isVipL, setIsVipL] = useState(false);
  const [kycL, setKycL] = useState("none");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) { setUser(d.user); setAvatarUrl(d.user.avatar_url ? `${d.user.avatar_url}?t=${Date.now()}` : null); setIsVipL(!!d.user.is_marketing); setKycL(d.user.kyc_status || "none"); }
    });
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const handleAvatarUpload = async (file: File) => {
    const fd = new FormData(); fd.append("avatar", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
    if (res.ok) { const d = await res.json(); setAvatarUrl(`${d.avatar_url}?t=${Date.now()}`); }
  };

  const items = [
    { icon: FileText,        label: "Verificação" },
    { icon: ArrowDownCircle, label: "Depositar" },
    { icon: ArrowUpCircle,   label: "Retirar fundos" },
    { icon: DollarSign,      label: "Histórico do saldo" },
    { icon: Clock,           label: "Histórico de trading" },
    { icon: HelpCircle,      label: "Serviço de suporte" },
    { icon: LogOut,          label: "Sair", danger: true },
  ];

  const handleClick = (label: string) => {
    if (label === "Sair") { fetch("/api/auth/logout", { method: "POST" }).finally(() => { window.location.href = "/"; }); return; }
    if (label === "Retirar fundos") { window.location.href = "/withdraw"; return; }
    if (label === "Verificação") { window.location.href = "/verify"; return; }
    if (label === "Depositar") { window.location.href = "/traderoom"; return; }
    if (label === "Histórico de trading") { window.location.href = "/history"; return; }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.15)" }} onMouseDown={onClose} />
      <div ref={ref} className="fixed right-0 top-0 h-full overflow-y-auto z-50 shadow-2xl" style={{ width: 300, background: "#fff", borderLeft: "1px solid #e5e7eb" }}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }} />
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "#f3f4f6" }}>
          <UserAvatar avatarUrl={avatarUrl} isVip={isVipL} kycStatus={kycL} size={40} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{user?.first_name} {user?.last_name}</div>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="py-2">
          {items.map(({ icon: Icon, label, danger }: any) => (
            <button key={label} onClick={() => handleClick(label)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors"
              style={{ color: danger ? "#ef4444" : "#374151" }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
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
  const [showProfile, setShowProfile] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); d.setHours(0,0,0,0); return d; });
  const [dateTo, setDateTo]     = useState<Date>(() => { const d = new Date(); d.setHours(23,59,59,999); return d; });
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

  const filtered = trades.filter(t => {
    const ts = t.started_at;
    return ts >= dateFrom.getTime() && ts <= dateTo.getTime() + 86400000;
  });
  const totalInvest  = filtered.reduce((s, t) => s + t.amount, 0);
  const totalProfit  = filtered.reduce((s, t) => s + t.net_profit, 0);
  const totalPatrim  = totalInvest + totalProfit;

  const totalPages   = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated    = filtered.slice((page - 1) * perPage, page * perPage);

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
      <header className="h-14 flex items-center justify-between px-3 sm:px-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/traderoom")}>
          <ZyroLogo size={32} />
          <span className="font-bold text-gray-800 text-base hidden sm:block">ZyroOption</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <img src="https://flagcdn.com/20x15/br.png" alt="PT" />
            <span className="hidden sm:block">Pt</span>
          </button>
          <button onClick={() => setShowProfile(v => !v)}>
            <UserAvatar avatarUrl={avatarUrl} isVip={isVip} kycStatus={kycStatus} size={36} />
          </button>
          <button onClick={() => router.push("/traderoom")}
            className="px-4 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: "#f97316" }}>
            Negociar
          </button>
        </div>
      </header>

      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Title + tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Histórico de trading</h1>
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
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 sm:gap-4 mb-4 p-4 bg-gray-50 rounded-xl border" style={{ borderColor: "#e5e7eb" }}>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">Instrumento de negociação</span>
                <div className="relative">
                  <select className="appearance-none bg-white border rounded-lg px-3 py-2 pr-8 text-sm w-full sm:w-auto" style={{ borderColor: "#d1d5db", minWidth: 160 }}>
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
                <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1); }} />
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
            <div className="border rounded-xl overflow-x-auto" style={{ borderColor: "#e5e7eb" }}>
              <table className="w-full text-sm" style={{ minWidth: 700 }}>
                <thead>
                  <tr className="bg-gray-50" style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Hora da compra (fechamento) UTC(-03:00)</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Ativo</th>
                    <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Conta</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Investimento</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">L/P Bruto</th>
                    <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Patrimônio</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">Carregando...</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400">Nenhuma operação encontrada.</td></tr>
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
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: t.account_type === "real" ? "rgba(16,185,129,0.1)" : "rgba(249,115,22,0.1)",
                              color: t.account_type === "real" ? "#10b981" : "#f97316",
                            }}>
                            {t.account_type === "real" ? "Real" : "Demo"}
                          </span>
                        </td>
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 text-sm text-gray-500">
              <span>Mostrando {filtered.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)} de {filtered.length}</span>
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
