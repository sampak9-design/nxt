"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Image as ImageIcon, Save, Zap } from "lucide-react";

export default function SettingsPage() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manipMode, setManipMode] = useState<"off" | "always" | "vip_safe">("always");
  const [manipStats, setManipStats] = useState<Record<string, { up: number; down: number; count: number }>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const loadManip = () => {
    fetch("/api/admin/otc-manip")
      .then((r) => r.json())
      .then((d) => {
        if (d?.mode) setManipMode(d.mode);
        if (d?.stats) setManipStats(d.stats);
      })
      .catch(() => {});
  };

  const saveManipMode = async (m: "off" | "always" | "vip_safe") => {
    setManipMode(m);
    await fetch("/api/admin/otc-manip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    });
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (!mapUrl) {
        // Delete the actual file as well
        await fetch("/api/admin/world-map", { method: "DELETE" });
      } else {
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ world_map_url: mapUrl }),
        });
      }
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  const loadCurrent = () => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const url = d?.settings?.world_map_url;
        if (url) setMapUrl(`${url.split("?")[0]}?v=${Date.now()}`);
        else setMapUrl(null);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadCurrent();
    loadManip();
    const iv = setInterval(loadManip, 5000);
    return () => clearInterval(iv);
  }, []);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/world-map", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Erro ao enviar");
      setMapUrl(`${data.url.split("?")[0]}?v=${Date.now()}`);
    } catch (e: any) {
      setError(e?.message || "Erro ao enviar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-white mb-1">Configurações</h1>
      <p className="text-sm text-gray-500 mb-6">Personalização visual do gráfico</p>

      <div
        className="rounded-xl p-5"
        style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-white">Mapa-múndi do fundo do gráfico</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Faça upload de uma imagem (PNG, SVG, JPG, WEBP — máx. 10 MB) para usar como
          plano de fundo da área do gráfico no traderoom.
        </p>

        {/* Preview */}
        <div
          className="rounded-lg overflow-hidden mb-4 flex items-center justify-center"
          style={{
            background: "#0d1117",
            border: "1px dashed rgba(255,255,255,0.08)",
            minHeight: 220,
          }}
        >
          {mapUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mapUrl} alt="World map" className="max-w-full max-h-[260px] object-contain" />
          ) : (
            <span className="text-xs text-gray-600">Nenhuma imagem definida</span>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-400 mb-3">{error}</div>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.target.value = "";
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: uploading ? "rgba(255,255,255,0.04)" : "#f97316",
              color: uploading ? "#64748b" : "#fff",
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Enviando…" : "Enviar imagem"}
          </button>

          {mapUrl && (
            <button
              onClick={() => setMapUrl(null)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </button>
          )}

          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
            style={{
              background: saving ? "rgba(255,255,255,0.04)" : "#22c55e",
              color: saving ? "#64748b" : "#fff",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando…" : "Salvar"}
          </button>
          {savedFlash && <span className="text-xs text-emerald-400">✓ Salvo</span>}
        </div>
      </div>

      {/* OTC Manipulation */}
      <div
        className="rounded-xl p-5 mt-6"
        style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-white">Manipulação OTC</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Controla a manipulação de preço dos ativos OTC nos últimos 10 segundos antes da expiração.
          Modo suave — drift gradual contra o lado com maior volume de apostas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          {([
            { id: "off",      label: "Desligado",      desc: "Preço real sem manipulação" },
            { id: "always",   label: "Casa sempre ganha", desc: "Força contra a maioria" },
            { id: "vip_safe", label: "VIP seguro",     desc: "Só manipula não-VIP" },
          ] as const).map((opt) => {
            const active = manipMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => saveManipMode(opt.id)}
                className="text-left p-3 rounded-lg transition-colors"
                style={{
                  background: active ? "rgba(249,115,22,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "#f97316" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div className="text-[13px] font-semibold" style={{ color: active ? "#f97316" : "#e2e8f0" }}>
                  {opt.label}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Live exposure table */}
        <div className="text-[10px] tracking-[0.12em] font-semibold text-gray-500 mb-2">
          EXPOSIÇÃO AO VIVO
        </div>
        {Object.keys(manipStats).length === 0 ? (
          <div className="text-xs text-gray-600 py-4 text-center">Sem trades abertas no momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left py-2 px-2 font-medium">Ativo</th>
                  <th className="text-right py-2 px-2 font-medium">Trades</th>
                  <th className="text-right py-2 px-2 font-medium">UP (R$)</th>
                  <th className="text-right py-2 px-2 font-medium">DOWN (R$)</th>
                  <th className="text-right py-2 px-2 font-medium">Casa força</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(manipStats).map(([asset, s]) => (
                  <tr key={asset} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="py-2 px-2 text-white font-medium">{asset}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{s.count}</td>
                    <td className="py-2 px-2 text-right text-emerald-400">{s.up.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-red-400">{s.down.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-orange-400 font-semibold">
                      {s.up > s.down ? "↓ DOWN" : s.down > s.up ? "↑ UP" : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
