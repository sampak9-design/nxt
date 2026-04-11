"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, Eye, EyeOff, Link2 } from "lucide-react";

type Status = "idle" | "loading" | "ok" | "error";

const glowCard = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

const pulseCSS = `
  @keyframes statusPulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; } 50% { opacity: 0.7; box-shadow: 0 0 8px 2px currentColor; } }
  .status-pulse { animation: statusPulse 2s ease-in-out infinite; }
`;

export default function IntegrationPage() {
  const [clientId,     setClientId]     = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [sandbox,      setSandbox]      = useState(true);
  const [showSecret,   setShowSecret]   = useState(false);
  const [saveStatus,   setSaveStatus]   = useState<Status>("idle");
  const [testStatus,   setTestStatus]   = useState<Status>("idle");
  const [testMsg,      setTestMsg]      = useState("");
  const [loaded,       setLoaded]       = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        const s = d.settings ?? {};
        setClientId(s.bspay_client_id ?? "");
        setClientSecret(s.bspay_client_secret ?? "");
        setSandbox(s.bspay_sandbox !== "false");
        setLoaded(true);
      });
  }, []);

  const handleSave = async () => {
    setSaveStatus("loading");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bspay_client_id:     clientId.trim(),
        bspay_client_secret: clientSecret.trim(),
        bspay_sandbox:       String(sandbox),
      }),
    });
    setSaveStatus(res.ok ? "ok" : "error");
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  const handleTest = async () => {
    setTestStatus("loading");
    setTestMsg("");
    try {
      const res = await fetch("/api/admin/test-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, sandbox }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus("ok");
        setTestMsg(data.message);
      } else {
        setTestStatus("error");
        setTestMsg(data.message ?? "Credenciais inválidas.");
      }
    } catch {
      setTestStatus("error");
      setTestMsg("Erro de conexão com o servidor.");
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(249,115,22,0.4)";
    e.target.style.boxShadow = "0 0 12px rgba(249,115,22,0.15)";
  };

  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(255,255,255,0.07)";
    e.target.style.boxShadow = "none";
  };

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
    </div>
  );

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <style dangerouslySetInnerHTML={{ __html: pulseCSS }} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <Link2 className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Integração de Pagamentos</h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 ml-8">
          Configure o gateway BSPay para depósitos via PIX
        </p>
      </div>

      {/* BSPay card */}
      <div className="rounded-2xl p-6 flex flex-col gap-5" style={glowCard}>

        {/* Logo + link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-white text-sm"
              style={{
                background: "linear-gradient(135deg, #32BCAD, #2aa89a)",
                boxShadow: "0 0 16px rgba(50,188,173,0.3)",
              }}>
              BS
            </div>
            <div>
              <div className="text-white font-extrabold text-sm">BSPay</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500">Gateway de pagamento PIX</div>
            </div>
          </div>
          <a href="https://bspay.readme.io/reference/come%C3%A7ando" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-all duration-200 hover:translate-x-0.5">
            Documentação <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} />

        {/* Environment toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white font-extrabold">Ambiente</div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
              Sandbox para testes, Produção para real
            </div>
          </div>
          <div className="flex rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <button
              onClick={() => setSandbox(true)}
              className="px-4 py-2 text-xs font-extrabold transition-all duration-300"
              style={{
                background: sandbox
                  ? "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.1))"
                  : "transparent",
                color: sandbox ? "#f97316" : "#64748b",
                boxShadow: sandbox ? "inset 0 0 12px rgba(249,115,22,0.1)" : "none",
              }}
            >
              Sandbox
            </button>
            <button
              onClick={() => setSandbox(false)}
              className="px-4 py-2 text-xs font-extrabold transition-all duration-300"
              style={{
                background: !sandbox
                  ? "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))"
                  : "transparent",
                color: !sandbox ? "#22c55e" : "#64748b",
                boxShadow: !sandbox ? "inset 0 0 12px rgba(34,197,94,0.1)" : "none",
              }}
            >
              Produção
            </button>
          </div>
        </div>

        {/* Client ID */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="Seu client_id da BSPay"
            className="w-full px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none rounded-xl transition-all duration-200"
            style={inputStyle}
            onFocus={inputFocus}
            onBlur={inputBlur}
          />
        </div>

        {/* Client Secret */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Client Secret</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={e => setClientSecret(e.target.value)}
              placeholder="Seu client_secret da BSPay"
              className="w-full px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none rounded-xl pr-11 transition-all duration-200"
              style={inputStyle}
              onFocus={inputFocus}
              onBlur={inputBlur}
            />
            <button onClick={() => setShowSecret(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors duration-200">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Webhook info */}
        <div className="rounded-xl p-4 text-xs"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Webhook URL</span>
          <div className="text-white font-mono font-extrabold mt-1.5 text-sm">
            {typeof window !== "undefined" ? window.location.origin : ""}/api/pix-webhook
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-widest text-gray-600">
            Configure este URL no painel BSPay para confirmar depósitos automaticamente.
          </div>
        </div>

        {/* Test result */}
        {testStatus !== "idle" && (
          <div className="flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm"
            style={{
              background: testStatus === "ok"
                ? "rgba(34,197,94,0.08)"
                : testStatus === "error"
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(255,255,255,0.03)",
              border: `1px solid ${
                testStatus === "ok"
                  ? "rgba(34,197,94,0.2)"
                  : testStatus === "error"
                    ? "rgba(239,68,68,0.2)"
                    : "rgba(255,255,255,0.07)"
              }`,
              boxShadow: testStatus === "ok"
                ? "0 0 12px rgba(34,197,94,0.1)"
                : testStatus === "error"
                  ? "0 0 12px rgba(239,68,68,0.1)"
                  : "none",
            }}>
            {testStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0 mt-0.5" />}
            {testStatus === "ok"      && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />}
            {testStatus === "error"   && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
            <span className="font-medium" style={{ color: testStatus === "ok" ? "#4ade80" : testStatus === "error" ? "#f87171" : "#94a3b8" }}>
              {testStatus === "loading" ? "Testando conexão..." : testMsg}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={!clientId || !clientSecret || testStatus === "loading"}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-40 disabled:hover:translate-y-0"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            Testar conexão
          </button>

          <button
            onClick={handleSave}
            disabled={!clientId || !clientSecret || saveStatus === "loading"}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all duration-200 hover:-translate-y-[1px] disabled:opacity-40 disabled:hover:translate-y-0"
            style={{
              background: saveStatus === "ok"
                ? "linear-gradient(135deg, #22c55e, #16a34a)"
                : "linear-gradient(135deg, #f97316, #ea580c)",
              boxShadow: saveStatus === "ok"
                ? "0 0 16px rgba(34,197,94,0.3)"
                : "0 0 16px rgba(249,115,22,0.3)",
            }}
          >
            {saveStatus === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saveStatus === "ok"      && <CheckCircle2 className="w-3.5 h-3.5" />}
            {saveStatus === "ok" ? "Salvo!" : "Salvar configurações"}
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="rounded-2xl p-5 flex items-center gap-4" style={glowCard}>
        <div className="w-3 h-3 rounded-full flex-shrink-0 status-pulse"
          style={{
            background: clientId && clientSecret ? "#22c55e" : "#64748b",
            color: clientId && clientSecret ? "rgba(34,197,94,0.4)" : "rgba(100,116,139,0.4)",
            boxShadow: clientId && clientSecret
              ? "0 0 8px rgba(34,197,94,0.4)"
              : "none",
          }} />
        <div>
          <div className="text-sm text-white font-extrabold">
            {clientId && clientSecret ? "Gateway configurado" : "Gateway não configurado"}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">
            {clientId && clientSecret
              ? `Ambiente: ${sandbox ? "Sandbox (testes)" : "Produção"}`
              : "Insira as credenciais BSPay para ativar depósitos PIX reais."}
          </div>
        </div>
      </div>
    </div>
  );
}
