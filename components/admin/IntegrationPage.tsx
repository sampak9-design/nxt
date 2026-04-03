"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";

type Status = "idle" | "loading" | "ok" | "error";

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

  if (!loaded) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
    </div>
  );

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white">Integração de Pagamentos</h2>
        <p className="text-sm text-gray-500 mt-1">Configure o gateway BSPay para depósitos via PIX.</p>
      </div>

      {/* BSPay card */}
      <div className="rounded-xl border p-6 flex flex-col gap-5"
        style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.08)" }}>

        {/* Logo + link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm"
              style={{ background: "#32BCAD" }}>
              BS
            </div>
            <div>
              <div className="text-white font-semibold text-sm">BSPay</div>
              <div className="text-gray-500 text-xs">Gateway de pagamento PIX</div>
            </div>
          </div>
          <a href="https://bspay.readme.io/reference/come%C3%A7ando" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
            Documentação <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />

        {/* Environment toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white font-medium">Ambiente</div>
            <div className="text-xs text-gray-500 mt-0.5">Sandbox para testes, Produção para real</div>
          </div>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setSandbox(true)}
              className="px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: sandbox ? "rgba(249,115,22,0.2)" : "transparent",
                color: sandbox ? "#f97316" : "#64748b",
              }}
            >
              Sandbox
            </button>
            <button
              onClick={() => setSandbox(false)}
              className="px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: !sandbox ? "rgba(34,197,94,0.2)" : "transparent",
                color: !sandbox ? "#22c55e" : "#64748b",
              }}
            >
              Produção
            </button>
          </div>
        </div>

        {/* Client ID */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 tracking-wide">CLIENT ID</label>
          <input
            type="text"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="Seu client_id da BSPay"
            className="w-full px-3 py-2.5 text-sm text-white focus:outline-none rounded-lg"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Client Secret */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-400 tracking-wide">CLIENT SECRET</label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              value={clientSecret}
              onChange={e => setClientSecret(e.target.value)}
              placeholder="Seu client_secret da BSPay"
              className="w-full px-3 py-2.5 text-sm text-white focus:outline-none rounded-lg pr-10"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button onClick={() => setShowSecret(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Webhook info */}
        <div className="rounded-lg p-3 text-xs text-gray-400"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-gray-300 font-medium">Webhook URL: </span>
          {typeof window !== "undefined" ? window.location.origin : ""}/api/pix-webhook
          <div className="mt-1 text-gray-600">Configure este URL no painel BSPay para confirmar depósitos automaticamente.</div>
        </div>

        {/* Test result */}
        {testStatus !== "idle" && (
          <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
            style={{
              background: testStatus === "ok" ? "rgba(34,197,94,0.1)" : testStatus === "error" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${testStatus === "ok" ? "rgba(34,197,94,0.3)" : testStatus === "error" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
            }}>
            {testStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0 mt-0.5" />}
            {testStatus === "ok"      && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />}
            {testStatus === "error"   && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
            <span style={{ color: testStatus === "ok" ? "#4ade80" : testStatus === "error" ? "#f87171" : "#94a3b8" }}>
              {testStatus === "loading" ? "Testando conexão..." : testMsg}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleTest}
            disabled={!clientId || !clientSecret || testStatus === "loading"}
            className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: "rgba(255,255,255,0.08)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Testar conexão
          </button>

          <button
            onClick={handleSave}
            disabled={!clientId || !clientSecret || saveStatus === "loading"}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "#f97316" }}
          >
            {saveStatus === "loading" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saveStatus === "ok"      && <CheckCircle2 className="w-3.5 h-3.5" />}
            {saveStatus === "ok" ? "Salvo!" : "Salvar configurações"}
          </button>
        </div>
      </div>

      {/* Status indicator */}
      <div className="rounded-xl border p-4 flex items-center gap-3"
        style={{ background: "#161c2c", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: clientId && clientSecret ? "#22c55e" : "#64748b" }} />
        <div>
          <div className="text-sm text-white font-medium">
            {clientId && clientSecret ? "Gateway configurado" : "Gateway não configurado"}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {clientId && clientSecret
              ? `Ambiente: ${sandbox ? "Sandbox (testes)" : "Produção"}`
              : "Insira as credenciais BSPay para ativar depósitos PIX reais."}
          </div>
        </div>
      </div>
    </div>
  );
}
