"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Volume2, Settings, ChevronUp, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import type { ActiveTrade } from "./TradeLayout";

interface Props {
  activeTrades: ActiveTrade[];
}

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const tick = () => setS(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);
  return <span className="text-[11px] font-mono text-blue-400">{s}s</span>;
}

export default function TradeFooter({ activeTrades }: Props) {
  const [time, setTime] = useState("");
  const [expanded, setExpanded] = useState(false);
  const openTrades = activeTrades.filter((t) => !t.result);

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
    <div className="hidden md:flex flex-col flex-shrink-0" style={{ zIndex: 30 }}>
      {/* Portfolio panel — expands upward */}
      {expanded && (
        <div
          className="border-t overflow-y-auto"
          style={{
            background: "#111622",
            borderColor: "rgba(255,255,255,0.06)",
            maxHeight: 200,
          }}
        >
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-4 py-2 sticky top-0"
            style={{ background: "#111622", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[11px] font-semibold text-white">Portfólio total</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Ocultar posições
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {openTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-[12px] text-gray-500">Você ainda não tem nenhuma posição aberta</span>
              <button
                className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded border transition-colors"
                style={{ borderColor: "rgba(255,255,255,0.12)", color: "#94a3b8" }}
              >
                + Selecione o ativo
              </button>
            </div>
          ) : (
            <div className="px-2 py-1">
              {openTrades.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: t.direction === "up" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)" }}
                  >
                    {t.direction === "up"
                      ? <TrendingUp className="w-3 h-3 text-green-400" />
                      : <TrendingDown className="w-3 h-3 text-red-400" />}
                  </div>
                  <span className="text-[11px] text-white font-medium w-20">{t.tabName}</span>
                  <span className="text-[11px] text-gray-400 font-mono">R$ {t.amount.toFixed(2)}</span>
                  <span className="text-[10px] text-gray-600 font-mono">@ {t.entryPrice.toFixed(5)}</span>
                  <span className="text-[10px] text-gray-500 uppercase">{t.direction}</span>
                  <div className="ml-auto">
                    <Countdown expiresAt={t.expiresAt} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Portfolio toggle bar */}
      <div
        className="flex items-center h-7 px-4 border-t cursor-pointer select-none"
        style={{ background: "#1a1f30", borderColor: "rgba(255,255,255,0.08)" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-[11px] font-semibold text-white">Portfólio total</span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-400 flex items-center gap-1">
          {expanded ? "Ocultar" : "Exibir"} posições
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </span>
      </div>

      {/* Bottom bar: support + powered + clock */}
      <footer
        className="flex items-center h-7 px-3 gap-4 border-t text-[11px]"
        style={{ background: "#0f1320", borderColor: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
      >
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

        <div className="flex-1" />

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
    </div>
  );
}
