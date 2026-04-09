"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Volume2, Settings, ChevronUp } from "lucide-react";

export default function TradeFooter() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const day = brt.getUTCDate();
      const months = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
      const month = months[brt.getUTCMonth()];
      const h = String(brt.getUTCHours()).padStart(2, "0");
      const m = String(brt.getUTCMinutes()).padStart(2, "0");
      const s = String(brt.getUTCSeconds()).padStart(2, "0");
      setTime(`${day} ${month}, ${h}:${m}:${s} (UTC-3)`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <footer
      className="hidden md:flex items-center h-8 px-3 gap-4 flex-shrink-0 border-t text-[11px]"
      style={{ background: "#0f1320", borderColor: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
    >
      {/* Left: support */}
      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold text-white"
          style={{ background: "#dc2626" }}
        >
          <MessageCircle className="w-3 h-3" />
          SUPORTE
        </button>
        <span className="text-gray-500">support@zyrooption.com</span>
        <span className="text-gray-600">TODO DIA, A TODA HORA</span>
      </div>

      {/* Center: portfolio bar */}
      <div className="flex-1 flex items-center justify-center">
        <div
          className="flex items-center gap-3 px-3 py-0.5 rounded"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <span className="text-[10px] text-gray-400 font-medium">Portfólio total</span>
          <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors">
            Exibir posições
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right: icons + clock */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-600">
          Powered by <span className="font-semibold text-gray-400">ZyroOption</span>
        </span>
        <button className="text-gray-500 hover:text-white transition-colors" title="Som">
          <Volume2 className="w-3.5 h-3.5" />
        </button>
        <button className="text-gray-500 hover:text-white transition-colors" title="Configurações">
          <Settings className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
          HORA ATUAL: <span className="text-gray-300">{time}</span>
        </span>
      </div>
    </footer>
  );
}
