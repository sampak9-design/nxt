"use client";

import { useState } from "react";
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle,
  Activity, BarChart2, Layers, LogOut, ChevronRight, Bell,
} from "lucide-react";

export type AdminPage = "dashboard" | "users" | "deposits" | "withdrawals" | "trades" | "assets" | "reports";

const NAV: { id: AdminPage; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: "dashboard",   label: "Dashboard",  icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "users",       label: "Usuários",   icon: <Users className="w-4 h-4" />,            badge: 1 },
  { id: "deposits",    label: "Depósitos",  icon: <ArrowDownCircle className="w-4 h-4" />,  badge: 2 },
  { id: "withdrawals", label: "Saques",     icon: <ArrowUpCircle className="w-4 h-4" />,    badge: 2 },
  { id: "trades",      label: "Operações",  icon: <Activity className="w-4 h-4" /> },
  { id: "assets",      label: "Ativos",     icon: <Layers className="w-4 h-4" /> },
  { id: "reports",     label: "Relatórios", icon: <BarChart2 className="w-4 h-4" /> },
];

interface Props {
  children: React.ReactNode;
  page: AdminPage;
  setPage: (p: AdminPage) => void;
}

export default function AdminLayout({ children, page, setPage }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#0d1117", color: "#e2e8f0" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? 56 : 220,
          background: "#111622",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {!collapsed && (
            <span className="font-bold text-orange-500 text-base whitespace-nowrap">ZyroOption Admin</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto w-6 h-6 flex items-center justify-center rounded text-gray-500 hover:text-white"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                title={collapsed ? item.label : undefined}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative"
                style={{
                  background: active ? "rgba(249,115,22,0.12)" : "transparent",
                  color:      active ? "#f97316" : "#94a3b8",
                  borderLeft: active ? "2px solid #f97316" : "2px solid transparent",
                }}
              >
                {item.icon}
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500 text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t py-2 flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-white transition-colors"
            onClick={() => window.location.href = "/trade"}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="h-14 flex items-center justify-between px-6 flex-shrink-0 border-b"
          style={{ background: "#111622", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <h1 className="font-semibold text-white text-sm">
            {NAV.find((n) => n.id === page)?.label}
          </h1>
          <div className="flex items-center gap-3">
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500" />
            </button>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "#f97316" }}>
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
