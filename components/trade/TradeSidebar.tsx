"use client";

import {
  BriefcaseBusiness, History, BellRing, Users,
  Medal, Newspaper, Zap, LifeBuoy, Cog, ChevronRight,
} from "lucide-react";

type SidebarPanel = "portfolio" | "history" | null;

interface Props {
  activePanel: SidebarPanel;
  setActivePanel: (p: SidebarPanel) => void;
  openTradeCount: number;
}

export default function TradeSidebar({ activePanel, setActivePanel, openTradeCount }: Props) {
  const toggle = (p: SidebarPanel) => setActivePanel(activePanel === p ? null : p);

  return (
    <aside
      className="hidden lg:flex flex-col w-20 h-full border-r py-2 flex-shrink-0 overflow-y-auto"
      style={{ borderColor: "var(--color-border)", background: "var(--color-third)" }}
    >
      <div className="flex flex-col items-center gap-0.5">
        {/* Portfolio */}
        <button
          onClick={() => toggle("portfolio")}
          title="Portfólio Total"
          className="relative flex flex-col items-center gap-1 w-full px-2 py-2.5 rounded text-xs transition-colors"
          style={{ color: activePanel === "portfolio" ? "var(--color-primary)" : "var(--color-icons)" }}
        >
          <div className="relative">
            <BriefcaseBusiness className="w-6 h-6" />
            {openTradeCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                {openTradeCount}
              </span>
            )}
          </div>
          <span className="text-center leading-tight">PORTFÓLIO{"\n"}TOTAL</span>
        </button>

        {/* History */}
        <button
          onClick={() => toggle("history")}
          title="Histórico Trading"
          className="flex flex-col items-center gap-1 w-full px-2 py-2.5 rounded text-xs transition-colors"
          style={{ color: activePanel === "history" ? "var(--color-primary)" : "var(--color-icons)" }}
        >
          <History className="w-6 h-6" />
          <span className="text-center leading-tight whitespace-pre">{"HISTÓRICO\nTRADING"}</span>
        </button>

        {[
          { icon: BellRing,  label: "MEU\nDESEMPENHO" },
          { icon: Users,     label: "CHATS E\nSUPORTE" },
          { icon: Medal,     label: "TABELA\nDE\nLÍDERES" },
          { icon: Newspaper, label: "Notícias" },
          { icon: Zap,       label: "Boosters" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={label.replace(/\n/g, " ")}
            className="flex flex-col items-center gap-1 w-full px-2 py-2.5 rounded text-xs transition-colors"
            style={{ color: "var(--color-icons)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-icons)")}
          >
            <Icon className="w-6 h-6" />
            <span className="text-center leading-tight whitespace-pre">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-0.5">
        {[
          { icon: LifeBuoy, label: "Ajuda" },
          { icon: Cog,      label: "Config." },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            title={label}
            className="flex flex-col items-center gap-1 w-full px-2 py-2.5 rounded text-xs transition-colors"
            style={{ color: "var(--color-icons)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-icons)")}
          >
            <Icon className="w-6 h-6" />
            <span>{label}</span>
          </button>
        ))}
        <button
          className="flex flex-col items-center gap-1 w-full px-2 py-2.5 rounded text-xs transition-colors"
          style={{ color: "var(--color-icons)" }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
