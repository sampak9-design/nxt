"use client";

import { useState } from "react";
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle,
  Activity, BarChart2, Layers, LogOut, ChevronLeft, Bell, Plug, ShieldCheck, Settings, Zap,
  Menu, X,
} from "lucide-react";

export type AdminPage = "dashboard" | "users" | "deposits" | "withdrawals" | "kyc" | "trades" | "assets" | "reports" | "integration" | "otc_manip" | "settings";

const NAV_SECTIONS: { title?: string; items: { id: AdminPage; label: string; icon: React.ReactNode }[] }[] = [
  {
    title: "Geral",
    items: [
      { id: "dashboard",   label: "Dashboard",   icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
      { id: "users",       label: "Usuários",    icon: <Users className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { id: "deposits",    label: "Depósitos",   icon: <ArrowDownCircle className="w-[18px] h-[18px]" /> },
      { id: "withdrawals", label: "Saques",       icon: <ArrowUpCircle className="w-[18px] h-[18px]" /> },
      { id: "kyc",         label: "KYC",           icon: <ShieldCheck className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: "Operações",
    items: [
      { id: "trades",      label: "Operações",   icon: <Activity className="w-[18px] h-[18px]" /> },
      { id: "assets",      label: "Ativos",       icon: <Layers className="w-[18px] h-[18px]" /> },
      { id: "otc_manip",   label: "OTC",           icon: <Zap className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: "Sistema",
    items: [
      { id: "integration", label: "Integração",   icon: <Plug className="w-[18px] h-[18px]" /> },
      { id: "reports",     label: "Relatórios",   icon: <BarChart2 className="w-[18px] h-[18px]" /> },
      { id: "settings",    label: "Configurações", icon: <Settings className="w-[18px] h-[18px]" /> },
    ],
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap((s) => s.items);

interface Props {
  children: React.ReactNode;
  page: AdminPage;
  setPage: (p: AdminPage) => void;
}

export default function AdminLayout({ children, page, setPage }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
          Z
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-white text-[13px] leading-tight">ZyroOption</span>
            <span className="text-[10px] text-gray-500 leading-tight">Painel Admin</span>
          </div>
        )}
        <button
          onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
          className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all hidden md:flex"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white md:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 py-3 overflow-y-auto px-3">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-5" : ""}>
            {!collapsed && section.title && (
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                {section.title}
              </div>
            )}
            {collapsed && si > 0 && (
              <div className="mx-2 my-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setPage(item.id); setMobileOpen(false); }}
                    title={collapsed ? item.label : undefined}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                    style={{
                      background: active ? "rgba(249,115,22,0.15)" : "transparent",
                      color:      active ? "#f97316" : "#8b95a5",
                    }}
                  >
                    <span className="flex-shrink-0" style={{ opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                    {active && !collapsed && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 flex-shrink-0">
        <div className={`rounded-lg p-3 mb-3 ${collapsed ? "hidden" : ""}`}
          style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
          <div className="text-[11px] font-semibold text-orange-400 mb-1">ZyroOption Pro</div>
          <div className="text-[10px] text-gray-500 leading-relaxed">Plataforma ativa e operacional</div>
        </div>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          onClick={() => window.location.href = "/traderoom"}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Voltar ao Trade</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#0a0e1a", color: "#e2e8f0" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col flex-shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? 68 : 240,
          background: "#0f1320",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full flex flex-col" style={{ background: "#0f1320" }}>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 flex items-center justify-between px-6 flex-shrink-0"
          style={{ background: "#0f1320", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 md:hidden"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="font-semibold text-white text-[15px]">
                {ALL_NAV.find((n) => n.id === page)?.label}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
              <Bell className="w-[18px] h-[18px] text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500" />
            </button>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "#0a0e1a" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
