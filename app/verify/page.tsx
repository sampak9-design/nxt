"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, XCircle, Upload, FileText, ShieldCheck } from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";

type KycStatus = "none" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: KycStatus }) {
  const map: Record<KycStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    none:     { label: "Não enviado",  color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: <FileText className="w-4 h-4" /> },
    pending:  { label: "Em análise",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: <Clock className="w-4 h-4" /> },
    approved: { label: "Aprovado",     color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: <CheckCircle2 className="w-4 h-4" /> },
    rejected: { label: "Reprovado",    color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: <XCircle className="w-4 h-4" /> },
  };
  const s = map[status];
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}>
      {s.icon}{s.label}
    </span>
  );
}

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus]     = useState<KycStatus>("none");
  const [doc, setDoc]           = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf]           = useState("");
  const [front, setFront]       = useState<File | null>(null);
  const [back, setBack]         = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/kyc/status")
      .then(r => r.json())
      .then(d => { setStatus(d.status ?? "none"); setDoc(d.doc ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatCpf = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
            .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
            .replace(/(\d{3})(\d{3})/, "$1.$2")
            .replace(/(\d{3})/, "$1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !cpf.trim() || !front || !back) {
      setError("Preencha todos os campos e envie os dois documentos."); return;
    }
    setSubmitting(true); setError("");
    const fd = new FormData();
    fd.append("full_name", fullName);
    fd.append("cpf", cpf);
    fd.append("doc_front", front);
    fd.append("doc_back",  back);
    try {
      const res = await fetch("/api/kyc/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar."); }
      else { setSuccess(true); setStatus("pending"); }
    } catch { setError("Erro de conexão."); }
    setSubmitting(false);
  };

  const canSubmit = status === "none" || status === "rejected";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f1420" }}>
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0f1420", color: "#e2e8f0" }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-6 border-b flex-shrink-0"
        style={{ background: "#111622", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <ZyroLogo size={28} />
          <span className="font-bold text-white text-base">ZyroOption</span>
        </div>
        <button
          onClick={() => router.push("/traderoom")}
          className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: "#f97316" }}
        >
          Negociar
        </button>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Verificação de documentos</h1>
          <p className="text-sm text-gray-500 mt-1">Obrigatório para solicitar saque.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status card */}
          <div className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              Status
            </div>
            <StatusBadge status={status} />
            <p className="text-xs text-gray-500">
              {status === "none"     && "Envie os documentos para iniciar."}
              {status === "pending"  && "Seus documentos estão sendo analisados. Aguarde."}
              {status === "approved" && "Sua identidade foi verificada com sucesso."}
              {status === "rejected" && (doc?.rejection_note ? `Motivo: ${doc.rejection_note}` : "Documentos reprovados. Envie novamente.")}
            </p>
            {status === "approved" && (
              <div className="text-xs text-gray-500 mt-auto">
                <div className="font-medium text-white">{doc?.full_name}</div>
                <div>CPF: {doc?.cpf}</div>
              </div>
            )}
            <div className="text-[10px] text-gray-600 mt-auto">
              Dica: envie fotos bem iluminadas, sem cortes e com texto legível.
            </div>
          </div>

          {/* Form card */}
          <div className="md:col-span-2 rounded-2xl p-6"
            style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-sm font-semibold text-white mb-1">Envio de documentos</div>
            <div className="text-xs text-gray-500 mb-5">
              As imagens são comprimidas automaticamente antes do envio (para ficar leve e legível).
            </div>

            {status === "approved" ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
                <div className="text-white font-semibold">Verificação concluída</div>
                <div className="text-xs text-gray-500">Seus documentos foram aprovados.</div>
              </div>
            ) : status === "pending" && !success ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Clock className="w-12 h-12 text-yellow-400" />
                <div className="text-white font-semibold">Em análise</div>
                <div className="text-xs text-gray-500 text-center max-w-xs">Seus documentos estão sendo revisados pela nossa equipe. Você será notificado em breve.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {success && (
                  <div className="rounded-lg px-4 py-3 text-sm text-green-400 flex items-center gap-2"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Documentos enviados com sucesso! Aguarde a análise.
                  </div>
                )}
                {error && (
                  <div className="rounded-lg px-4 py-3 text-sm text-red-400 flex items-center gap-2"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <XCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">Nome completo *</label>
                    <input
                      type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">CPF *</label>
                    <input
                      type="text" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Documento (frente) *", ref: frontRef, file: front, setFile: setFront },
                    { label: "Documento (verso) *",  ref: backRef,  file: back,  setFile: setBack  },
                  ].map(({ label, ref, file, setFile }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400">{label}</label>
                      <button type="button" onClick={() => ref.current?.click()}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors hover:border-orange-500"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${file ? "rgba(249,115,22,0.5)" : "rgba(255,255,255,0.1)"}`, color: file ? "#f97316" : "#64748b" }}>
                        <Upload className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{file ? file.name : "Escolher arquivo"}</span>
                      </button>
                      <input ref={ref} type="file" accept="image/jpg,image/jpeg,image/png"
                        className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    </div>
                  ))}
                </div>

                <div className="text-xs text-gray-600">
                  Formatos aceitos: JPG/JPEG/PNG • Máx 15MB • Reenvio liberado apenas se reprovado.
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={submitting}
                    className="px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                    style={{ background: "#f97316" }}>
                    {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {submitting ? "Enviando..." : "Enviar para análise"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
