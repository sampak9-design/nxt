"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Trash2, Plus, RefreshCw } from "lucide-react";

type Signal = {
  assetId: string;
  direction: "up" | "down";
  strength: number;
  expiresAt: number;
  createdAt: number;
};

const OTC_ASSETS = [
  // OTC forex
  { id: "EURUSD-OTC", name: "EUR/USD (OTC)" },
  { id: "GBPUSD-OTC", name: "GBP/USD (OTC)" },
  { id: "BTCUSD-OTC", name: "BTC/USD (OTC)" },
  // OTC stock indices
  { id: "OTC_DJI",    name: "Wall Street 30 (OTC)" },
  { id: "OTC_FTSE",   name: "UK 100 (OTC)" },
  { id: "OTC_GDAXI",  name: "Germany 40 (OTC)" },
  { id: "OTC_NDX",    name: "US Tech 100 (OTC)" },
  { id: "OTC_SPC",    name: "US 500 (OTC)" },
  { id: "OTC_N225",   name: "Japan 225 (OTC)" },
  { id: "OTC_AEX",    name: "Netherlands 25 (OTC)" },
  { id: "OTC_AS51",   name: "Australia 200 (OTC)" },
  { id: "OTC_FCHI",   name: "France 40 (OTC)" },
  { id: "OTC_HSI",    name: "Hong Kong 50 (OTC)" },
  { id: "OTC_SSMI",   name: "Swiss 20 (OTC)" },
  { id: "OTC_SX5E",   name: "Euro 50 (OTC)" },
];

function msToLabel(ms: number) {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${s}s`;
}

export default function SignalsPage() {
  const [signals, setSignals]       = useState<Signal[]>([]);
  const [now, setNow]               = useState(Date.now());
  const [assetId, setAssetId]       = useState(OTC_ASSETS[0].id);
  const [direction, setDirection]   = useState<"up" | "down">("up");
  const [strength, setStrength]     = useState(0.5);
  const [duration, setDuration]     = useState(60); // seconds
  const [loading, setLoading]       = useState(false);

  const refresh = useCallback(async () => {
    const r = await fetch("/api/otc-signal");
    const d = await r.json();
    setSignals(d.signals ?? []);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Live countdown
  useEffect(() => {
    const iv = setInterval(() => { setNow(Date.now()); }, 1000);
    return () => clearInterval(iv);
  }, []);

  const create = async () => {
    setLoading(true);
    await fetch("/api/otc-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId, direction, strength, durationMs: duration * 1000 }),
    });
    await refresh();
    setLoading(false);
  };

  const remove = async (id: string) => {
    await fetch(`/api/otc-signal?assetId=${encodeURIComponent(id)}`, { method: "DELETE" });
    await refresh();
  };

  const removeAll = async () => {
    await fetch("/api/otc-signal", { method: "DELETE" });
    await refresh();
  };

  const activeSignals = signals.filter((s) => s.expiresAt > now);

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Sinais OTC</h1>
          <p className="text-sm text-gray-400 mt-1">Controle a direção do gráfico nos ativos OTC</p>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {/* ── Create signal ── */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: "#161c2d", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <h2 className="text-sm font-semibold text-white mb-4">Novo sinal</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Asset picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Ativo OTC</label>
            <select
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {OTC_ASSETS.map((a) => (
                <option key={a.id} value={a.id} style={{ background: "#161c2d" }}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Duração: {duration}s</label>
            <input
              type="range" min={10} max={300} step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
              <span>10s</span><span>5min</span>
            </div>
          </div>
        </div>

        {/* Direction */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-1.5">Direção</label>
          <div className="flex gap-3">
            <button
              onClick={() => setDirection("up")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: direction === "up" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                border: direction === "up" ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.08)",
                color: direction === "up" ? "#22c55e" : "#64748b",
              }}
            >
              <TrendingUp className="w-4 h-4" /> COMPRA (subir)
            </button>
            <button
              onClick={() => setDirection("down")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: direction === "down" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                border: direction === "down" ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                color: direction === "down" ? "#ef4444" : "#64748b",
              }}
            >
              <TrendingDown className="w-4 h-4" /> VENDA (descer)
            </button>
          </div>
        </div>

        {/* Strength */}
        <div className="mb-5">
          <label className="block text-xs text-gray-400 mb-1.5">
            Intensidade: <span className="text-white font-semibold">{Math.round(strength * 100)}%</span>
            <span className="text-gray-500 ml-2">
              {strength <= 0.3 ? "(sutil)" : strength <= 0.6 ? "(médio)" : "(forte)"}
            </span>
          </label>
          <input
            type="range" min={0.05} max={1} step={0.05}
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>Sutil</span><span>Máximo</span>
          </div>
        </div>

        <button
          onClick={create}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: loading ? "#374151" : "#f97316" }}
        >
          <Plus className="w-4 h-4" />
          {loading ? "Criando..." : "Criar sinal"}
        </button>
      </div>

      {/* ── Active signals ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">
          Sinais ativos
          {activeSignals.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white bg-orange-500">
              {activeSignals.length}
            </span>
          )}
        </h2>
        {activeSignals.length > 1 && (
          <button
            onClick={removeAll}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Remover todos
          </button>
        )}
      </div>

      {activeSignals.length === 0 ? (
        <div
          className="rounded-xl py-10 text-center text-sm text-gray-500"
          style={{ background: "#161c2d", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          Nenhum sinal ativo no momento
        </div>
      ) : (
        <div className="space-y-2">
          {activeSignals.map((s) => {
            const remaining = s.expiresAt - now;
            const pct = Math.min(100, (remaining / (s.expiresAt - s.createdAt)) * 100);
            const assetName = OTC_ASSETS.find((a) => a.id === s.assetId)?.name ?? s.assetId;
            const isUp = s.direction === "up";
            return (
              <div
                key={s.assetId}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: "#161c2d", border: `1px solid ${isUp ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` }}
              >
                {/* Direction icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isUp ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}
                >
                  {isUp
                    ? <TrendingUp className="w-5 h-5" style={{ color: "#22c55e" }} />
                    : <TrendingDown className="w-5 h-5" style={{ color: "#ef4444" }} />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white truncate">{assetName}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                      style={{ background: isUp ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", color: isUp ? "#22c55e" : "#ef4444" }}
                    >
                      {isUp ? "↑ COMPRA" : "↓ VENDA"}
                    </span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      força {Math.round(s.strength * 100)}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: isUp ? "#22c55e" : "#ef4444" }}
                    />
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Expira em {msToLabel(remaining)}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => remove(s.assetId)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
