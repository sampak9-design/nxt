"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Trash2, Image as ImageIcon, Save, Settings, ShieldCheck } from "lucide-react";

const glowCard = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

export default function SettingsPage() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [protections, setProtections] = useState<Record<string, boolean>>({
    prot_block_devtools: false,
    prot_debugger_trap: false,
    prot_anti_copy: false,
    prot_detect_devtools: false,
    prot_block_print: false,
  });
  const [savingProt, setSavingProt] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (!mapUrl) {
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
        const s = d?.settings ?? {};
        setProtections({
          prot_block_devtools: s.prot_block_devtools === "true",
          prot_debugger_trap: s.prot_debugger_trap === "true",
          prot_anti_copy: s.prot_anti_copy === "true",
          prot_detect_devtools: s.prot_detect_devtools === "true",
          prot_block_print: s.prot_block_print === "true",
        });
      })
      .catch(() => {});
  };

  useEffect(() => { loadCurrent(); }, []);

  const toggleProt = async (key: string) => {
    const next = !protections[key];
    setSavingProt(key);
    setProtections(p => ({ ...p, [key]: next }));
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: String(next) }),
    });
    setSavingProt(null);
  };

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleUpload(f);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Page title */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Settings className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Configurações</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 ml-8">
          Personalização visual do gráfico
        </p>
      </div>

      <div className="rounded-2xl p-6" style={glowCard}>
        <div className="flex items-center gap-2.5 mb-1">
          <ImageIcon className="w-5 h-5 text-orange-400" />
          <h2 className="text-sm font-extrabold text-white">Mapa-múndi do fundo do gráfico</h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-5 ml-7">
          PNG, SVG, JPG, WEBP — máx. 10 MB
        </p>

        {/* Drop zone / Preview */}
        <div
          className="rounded-2xl overflow-hidden mb-5 flex items-center justify-center transition-all duration-300 cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: dragOver
              ? "2px dashed rgba(249,115,22,0.6)"
              : "2px dashed rgba(255,255,255,0.08)",
            boxShadow: dragOver ? "0 0 24px rgba(249,115,22,0.15)" : "none",
            minHeight: 240,
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !mapUrl && fileRef.current?.click()}
        >
          {mapUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mapUrl} alt="World map" className="max-w-full max-h-[280px] object-contain p-4" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-8">
              <Upload className="w-8 h-8 text-gray-600" />
              <span className="text-xs text-gray-600">Arraste uma imagem ou clique para selecionar</span>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-400 mb-4 px-3 py-2 rounded-lg"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              background: uploading
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: uploading ? "none" : "0 0 16px rgba(249,115,22,0.3)",
              color: uploading ? "#64748b" : "#fff",
            }}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Enviando..." : "Enviar imagem"}
          </button>

          {mapUrl && (
            <button
              onClick={() => setMapUrl(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold transition-all duration-200 hover:-translate-y-[1px]"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                border: "1px solid rgba(239,68,68,0.25)",
                boxShadow: "0 0 12px rgba(239,68,68,0.1)",
              }}
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </button>
          )}

          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold text-white transition-all duration-200 hover:-translate-y-[1px] ml-auto disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              background: saving
                ? "rgba(255,255,255,0.05)"
                : "linear-gradient(135deg, #22c55e, #16a34a)",
              boxShadow: saving ? "none" : "0 0 16px rgba(34,197,94,0.3)",
              color: saving ? "#64748b" : "#fff",
            }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </button>

          {savedFlash && (
            <span className="text-xs font-extrabold text-emerald-400"
              style={{ textShadow: "0 0 8px rgba(34,197,94,0.3)" }}>
              Salvo
            </span>
          )}
        </div>
      </div>
      {/* Protection toggles */}
      <div className="rounded-2xl p-6" style={glowCard}>
        <div className="flex items-center gap-2.5 mb-1">
          <ShieldCheck className="w-5 h-5 text-orange-400" />
          <h2 className="text-sm font-extrabold text-white">Proteção do código fonte</h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-5 ml-7">
          Controle individual de cada camada de proteção
        </p>

        <div className="flex flex-col gap-3">
          {[
            { key: "prot_block_devtools", label: "Bloquear DevTools", desc: "Bloqueia F12, clique direito, Ctrl+U, Ctrl+Shift+I e limpa o console" },
            { key: "prot_debugger_trap", label: "Debugger Trap", desc: "Loop infinito de debugger que trava o DevTools se alguém abrir" },
            { key: "prot_anti_copy", label: "Anti-Cópia", desc: "Desabilita seleção de texto, copiar, colar e arrastar imagens" },
            { key: "prot_detect_devtools", label: "Detectar DevTools", desc: "Detecta DevTools aberto e mostra tela vermelha de bloqueio" },
            { key: "prot_block_print", label: "Bloquear Print", desc: "Esconde conteúdo ao imprimir e bloqueia Print Screen" },
          ].map(({ key, label, desc }) => {
            const on = protections[key];
            return (
              <div key={key} className="flex items-center justify-between p-4 rounded-xl transition-all"
                style={{ background: on ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${on ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}` }}>
                <div>
                  <div className="text-sm text-white font-semibold">{label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{desc}</div>
                </div>
                <button
                  onClick={() => toggleProt(key)}
                  disabled={savingProt === key}
                  className="relative w-12 h-7 rounded-full transition-all duration-300 flex-shrink-0 disabled:opacity-50"
                  style={{
                    background: on ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.1)",
                    boxShadow: on ? "0 0 12px rgba(34,197,94,0.3)" : "none",
                  }}
                >
                  <div className="absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300"
                    style={{ left: on ? 26 : 4 }} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-[11px] text-gray-600 leading-relaxed">
          Essas proteções não se aplicam no painel admin.
          <span className="text-yellow-500/70"> Nota: proteções frontend podem ser contornadas por desenvolvedores experientes, mas bloqueiam 90% dos curiosos.</span>
        </div>
      </div>
    </div>
  );
}
