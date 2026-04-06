"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

export default function SettingsPage() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    </div>
  );
}
