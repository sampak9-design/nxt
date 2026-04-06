"use client";

import { useState } from "react";
import { X, ChevronDown } from "lucide-react";

type TabKey = "aparencia" | "negociacao" | "atalhos" | "notificacoes" | "privacidade" | "conta";

interface Props {
  onClose: () => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "aparencia",    label: "Aparência" },
  { key: "negociacao",   label: "Negociação" },
  { key: "atalhos",      label: "Atalhos do teclado" },
  { key: "notificacoes", label: "Notificações" },
  { key: "privacidade",  label: "Privacidade" },
  { key: "conta",        label: "Configurações da conta" },
];

const THEMES = [
  { id: "dark",    bg: "linear-gradient(135deg, #0f1422 0%, #1a2036 100%)", label: "Padrão" },
  { id: "mclaren", bg: "linear-gradient(135deg, #1a0f0a 0%, #3d1a0f 100%)", label: "McLaren" },
  { id: "orange",  bg: "linear-gradient(135deg, #1a0a00 0%, #4d1a00 100%)", label: "Laranja" },
  { id: "light",   bg: "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)", label: "Claro" },
];

const SCALES = [80, 90, 100, 110, 120];

export default function SettingsModal({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("aparencia");
  const [selectedTheme, setSelectedTheme] = useState("dark");
  const [showWorldMap, setShowWorldMap] = useState(true);
  const [scale, setScale] = useState(100);
  const [showLine, setShowLine] = useState(true);
  const [showValue, setShowValue] = useState(true);

  return (
    <div
      className="fixed inset-0 z-[9999] flex"
      style={{ background: "#0b0f1a" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button — top-left */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
        title="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Content container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-center py-6">
          <h1 className="text-2xl font-semibold text-white">Definições</h1>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex-1 flex overflow-hidden px-6 md:px-12 pb-6 gap-8 max-w-[1200px] w-full mx-auto">
          {/* Left sidebar tabs */}
          <div className="w-64 flex-shrink-0 flex flex-col">
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {TABS.map((t) => {
                const active = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className="w-full flex items-center px-5 py-4 text-left text-sm transition-colors"
                    style={{
                      background: active ? "rgba(249,115,22,0.1)" : "transparent",
                      color: active ? "#f97316" : "#cbd5e1",
                      borderLeft: active ? "3px solid #f97316" : "3px solid transparent",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 px-2 text-[11px] text-gray-500 leading-relaxed">
              Versão do site: 3916.2.7884 (compilação oficial)
            </div>
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto pr-2">
            {activeTab === "aparencia" && <AparenciaTab
              selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme}
              showWorldMap={showWorldMap} setShowWorldMap={setShowWorldMap}
              scale={scale} setScale={setScale}
              showLine={showLine} setShowLine={setShowLine}
              showValue={showValue} setShowValue={setShowValue}
            />}
            {activeTab !== "aparencia" && (
              <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                Em breve…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Aparência tab ──────────────────────────────────────────────── */

interface AparenciaProps {
  selectedTheme: string; setSelectedTheme: (v: string) => void;
  showWorldMap: boolean; setShowWorldMap: (v: boolean) => void;
  scale: number; setScale: (v: number) => void;
  showLine: boolean; setShowLine: (v: boolean) => void;
  showValue: boolean; setShowValue: (v: boolean) => void;
}

function AparenciaTab({
  selectedTheme, setSelectedTheme,
  showWorldMap, setShowWorldMap,
  scale, setScale,
  showLine, setShowLine,
  showValue, setShowValue,
}: AparenciaProps) {
  return (
    <div className="flex flex-col gap-7">
      {/* Two selects */}
      <div className="grid grid-cols-2 gap-5">
        <Field label="Fuso horário">
          <Select value="(UTC-3) São Paulo" />
        </Field>
        <Field label="Idioma da interface">
          <Select value="Português" flag="🇵🇹" />
        </Field>
      </div>

      {/* Theme */}
      <div>
        <div className="text-[10px] tracking-[0.12em] font-semibold text-gray-500 mb-3">
          AJUSTES DE TEMA
        </div>
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTheme(t.id)}
              className="relative h-24 rounded-lg overflow-hidden transition-all"
              style={{
                background: t.bg,
                outline: selectedTheme === t.id ? "2px solid #f97316" : "2px solid transparent",
                outlineOffset: 0,
              }}
            >
              {/* fake chart line */}
              <svg viewBox="0 0 120 60" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path d="M0,35 L15,25 L30,40 L45,20 L60,30 L75,15 L90,35 L105,25 L120,30" stroke="#f97316" strokeWidth="1.5" fill="none" />
                <circle cx="105" cy="25" r="2" fill="#f97316" />
              </svg>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-4 cursor-pointer">
          <Checkbox checked={showWorldMap} onChange={setShowWorldMap} />
          <span className="text-[13px] text-gray-300">Exibir o mapa do mundo no fundo do gráfico</span>
        </label>
      </div>

      {/* Scale */}
      <div>
        <div className="text-[10px] tracking-[0.12em] font-semibold text-gray-500 mb-3">
          ESCALA DE INTERFACE
        </div>
        <div className="grid grid-cols-5 gap-3">
          {SCALES.map((s) => (
            <button
              key={s}
              onClick={() => setScale(s)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${scale === s ? "#f97316" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <Radio checked={scale === s} />
              <span className="text-[13px] text-gray-200">{s}%</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customize menu */}
      <div className="flex items-center gap-4">
        <button
          className="px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          Personalizar menu…
        </button>
        <span className="text-[12px] text-gray-500 flex-1">
          Localização e visibilidade de itens de menu para acesso rápido às seções certas
        </span>
      </div>

      {/* Open positions section */}
      <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex gap-5 mb-5">
          {/* preview image */}
          <div className="w-44 h-24 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: "linear-gradient(135deg, #0f1422, #1a2036)" }}>
            <svg viewBox="0 0 160 80" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 L20,40 L40,55 L60,30 L80,35 L100,20 L120,25 L140,45 L160,35" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.6" />
              <line x1="0" y1="35" x2="160" y2="35" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="80" cy="35" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
              <rect x="140" y="30" width="18" height="10" rx="2" fill="#10b981" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[11px] tracking-[0.1em] font-semibold text-gray-400 mb-1">POSIÇÕES ABERTAS NO GRÁFICO</div>
            <div className="text-[11px] text-gray-500 mb-3">Configurações gerais</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={showLine} onChange={setShowLine} />
              <span className="text-[13px] text-gray-300">Mostrar uma linha pontilhada no gráfico para posições compradas</span>
            </label>
          </div>
        </div>

        <div className="flex gap-5">
          <div className="w-44 h-24 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: "linear-gradient(135deg, #0f1422, #1a2036)" }}>
            <svg viewBox="0 0 160 80" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path d="M0,50 L20,40 L40,55 L60,30 L80,35 L100,20 L120,25 L140,45 L160,35" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.6" />
              <circle cx="55" cy="32" r="3" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
            </svg>
            <div className="absolute left-10 top-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "#10b981" }}>$100</div>
          </div>
          <div className="flex-1">
            <div className="text-[11px] text-gray-500 mb-3">Binárias, Blitz</div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={showValue} onChange={setShowValue} />
              <span className="text-[13px] text-gray-300">Exibir o valor da compra no gráfico</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared controls ────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500 mb-2">{label}</div>
      {children}
    </div>
  );
}

function Select({ value, flag }: { value: string; flag?: string }) {
  return (
    <button
      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {flag && <span className="text-base">{flag}</span>}
      <span className="text-[13px] text-gray-200 flex-1 text-left">{value}</span>
      <ChevronDown className="w-4 h-4 text-gray-500" />
    </button>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
      style={{
        background: checked ? "#f97316" : "transparent",
        border: `1.5px solid ${checked ? "#f97316" : "rgba(255,255,255,0.25)"}`,
      }}
    >
      {checked && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
    </button>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <div
      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ border: `1.5px solid ${checked ? "#f97316" : "rgba(255,255,255,0.25)"}` }}
    >
      {checked && <div className="w-2 h-2 rounded-full" style={{ background: "#f97316" }} />}
    </div>
  );
}
