"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Eye, Loader2, ShieldCheck } from "lucide-react";

type KycDoc = {
  id: number; user_id: number; full_name: string; cpf: string;
  doc_front_path: string; doc_back_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_note: string | null; submitted_at: number; reviewed_at: number | null;
  first_name: string; last_name: string; email: string;
};

type ReviewState = { id: number; action: "approve" | "reject" } | null;

const glowCard = {
  background: "linear-gradient(135deg, rgba(17,24,39,0.9), rgba(17,24,39,0.7))",
  border: "1px solid rgba(255,255,255,0.07)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
};

export default function KycPage() {
  const [docs, setDocs]         = useState<KycDoc[]>([]);
  const [loading, setLoading]   = useState(true);
  const [preview, setPreview]   = useState<string | null>(null);
  const [review, setReview]     = useState<ReviewState>(null);
  const [note, setNote]         = useState("");
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/kyc").then(r => r.json()).then(d => { setDocs(d.docs ?? []); setLoading(false); });
  };
  useEffect(load, []);

  const handleReview = async () => {
    if (!review) return;
    setSaving(true);
    await fetch(`/api/admin/kyc/${review.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: review.action, note }),
    });
    setSaving(false); setReview(null); setNote(""); load();
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold"
        style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.2)" }}>
        <CheckCircle2 className="w-3.5 h-3.5" />Aprovado
      </span>
    );
    if (s === "rejected") return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold"
        style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", boxShadow: "0 0 8px rgba(239,68,68,0.2)" }}>
        <XCircle className="w-3.5 h-3.5" />Reprovado
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold"
        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", boxShadow: "0 0 8px rgba(245,158,11,0.2)" }}>
        <Clock className="w-3.5 h-3.5" />Pendente
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page title */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Verificação KYC</h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1 ml-8">
          Revise e aprove os documentos enviados pelos usuários
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-20 gap-3"
          style={glowCard}>
          <CheckCircle2 className="w-10 h-10 text-gray-600" />
          <div className="text-sm text-gray-500">Nenhum documento enviado ainda.</div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={glowCard}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Usuário","Nome","CPF","Enviado em","Status","Documentos","Ação"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] uppercase tracking-widest text-gray-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id}
                  className="transition-colors duration-200 hover:bg-white/[0.02]"
                  style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3.5">
                    <span className="text-gray-200 font-medium">{d.first_name} {d.last_name}</span>
                    <div className="text-[10px] text-gray-600 mt-0.5">{d.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-white font-extrabold">{d.full_name}</td>
                  <td className="px-4 py-3.5 text-gray-400 font-mono text-xs">{d.cpf}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{new Date(d.submitted_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3.5">{statusBadge(d.status)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <button onClick={() => setPreview(d.doc_front_path)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-[1px]"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Eye className="w-3.5 h-3.5" />Frente
                      </button>
                      <button onClick={() => setPreview(d.doc_back_path)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-[1px]"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Eye className="w-3.5 h-3.5" />Verso
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {d.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => { setReview({ id: d.id, action: "approve" }); setNote(""); }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white transition-all duration-200 hover:-translate-y-[1px]"
                          style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 0 12px rgba(34,197,94,0.3)" }}>
                          Aprovar
                        </button>
                        <button onClick={() => { setReview({ id: d.id, action: "reject" }); setNote(""); }}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold text-white transition-all duration-200 hover:-translate-y-[1px]"
                          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 0 12px rgba(239,68,68,0.3)" }}>
                          Reprovar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">Revisado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={() => setPreview(null)}>
          <div className="rounded-2xl overflow-hidden" style={{ ...glowCard, padding: 4 }} onClick={e => e.stopPropagation()}>
            <img src={preview} alt="Documento" className="max-w-full max-h-[80vh] rounded-xl object-contain" />
          </div>
        </div>
      )}

      {/* Review confirm modal */}
      {review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md flex flex-col gap-5"
            style={{ ...glowCard, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <div className="text-white font-extrabold text-lg tracking-tight">
              {review.action === "approve" ? "Aprovar documentos?" : "Reprovar documentos?"}
            </div>
            {review.action === "reject" && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
                  Motivo da reprovação (opcional)
                </label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Ex: Documento ilegível"
                  className="px-3.5 py-3 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow: "0 0 0 0 rgba(239,68,68,0)",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(239,68,68,0.4)"; e.target.style.boxShadow = "0 0 12px rgba(239,68,68,0.15)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; e.target.style.boxShadow = "0 0 0 0 rgba(239,68,68,0)"; }}
                />
              </div>
            )}
            <div className="flex gap-3 justify-end pt-1">
              <button onClick={() => setReview(null)}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all duration-200 hover:-translate-y-[1px]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                Cancelar
              </button>
              <button onClick={handleReview} disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-extrabold text-white flex items-center gap-2 disabled:opacity-50 transition-all duration-200 hover:-translate-y-[1px]"
                style={{
                  background: review.action === "approve"
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, #ef4444, #dc2626)",
                  boxShadow: review.action === "approve"
                    ? "0 0 16px rgba(34,197,94,0.3)"
                    : "0 0 16px rgba(239,68,68,0.3)",
                }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {review.action === "approve" ? "Confirmar aprovação" : "Confirmar reprovação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
