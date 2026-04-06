"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Image as ImageIcon, Palette, Save } from "lucide-react";

const COLOR_FIELDS: { key: string; label: string; def: string }[] = [
  { key: "color_buy",  label: "Botão COMPRAR (acima)", def: "#2ecc71" },
  { key: "color_sell", label: "Botão VENDER (abaixo)", def: "#e74c3c" },
  { key: "color_grid", label: "Linhas da grade do gráfico", def: "rgba(255,255,255,0.07)" },
  { key: "color_win",  label: "Resultado WIN",            def: "#22c55e" },
  { key: "color_lose", label: "Resultado LOSE",           def: "#ef4444" },
];

function toHex(v: string): string {
  if (!v) return "#000000";
  if (v.startsWith("#")) return v.length === 4
    ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`
    : v;
  // rgba/rgb → hex (ignore alpha)
  const m = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const h = (n: number) => n.toString(16).padStart(2, "0");
    return `#${h(+m[1])}${h(+m[2])}${h(+m[3])}`;
  }
  return "#000000";
}

export default function SettingsPage() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [colors, setColors] = useState<Record<string, string>>(
    Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, f.def]))
  );
  const [savingColors, setSavingColors] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadCurrent = () => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        const s = d?.settings ?? {};
        const url = s.world_map_url;
        if (url) setMapUrl(`${url.split("?")[0]}?v=${Date.now()}`);
        else setMapUrl(null);
        setColors((prev) => {
          const next = { ...prev };
          for (const f of COLOR_FIELDS) if (s[f.key]) next[f.key] = s[f.key];
          return next;
        });
      })
      .catch(() => {});
  };

  const saveColors = async () => {
    setSavingColors(true);
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colors),
      });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setSavingColors(false);
    }
  };

  useEffect(() => { loadCurrent(); }, []);

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
              onClick={async () => {
                if (!confirm("Remover a imagem atual?")) return;
                await fetch("/api/admin/settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ world_map_url: "" }),
                });
                setMapUrl(null);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </button>
          )}
        </div>
      </div>

      {/* Colors */}
      <div
        className="rounded-xl p-5 mt-6"
        style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-semibold text-white">Cores do gráfico e botões</h2>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Personalize as cores das colunas do gráfico, dos botões de compra/venda e dos resultados.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {COLOR_FIELDS.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <input
                type="color"
                value={toHex(colors[f.key])}
                onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer flex-shrink-0"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-gray-200 font-medium">{f.label}</div>
                <input
                  type="text"
                  value={colors[f.key]}
                  onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                  className="w-full mt-1 px-2 py-1 rounded text-[11px] font-mono"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", color: "#cbd5e1" }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={saveColors}
            disabled={savingColors}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: savingColors ? "rgba(255,255,255,0.04)" : "#f97316",
              color: savingColors ? "#64748b" : "#fff",
              cursor: savingColors ? "not-allowed" : "pointer",
            }}
          >
            <Save className="w-4 h-4" />
            {savingColors ? "Salvando…" : "Salvar cores"}
          </button>
          <button
            onClick={() => setColors(Object.fromEntries(COLOR_FIELDS.map((f) => [f.key, f.def])))}
            className="px-4 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "rgba(255,255,255,0.04)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Restaurar padrão
          </button>
          {savedFlash && <span className="text-xs text-emerald-400">✓ Salvo</span>}
        </div>
      </div>
    </div>
  );
}
