"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, Eye, Loader2 } from "lucide-react";

type KycDoc = {
  id: number; user_id: number; full_name: string; cpf: string;
  doc_front_path: string; doc_back_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_note: string | null; submitted_at: number; reviewed_at: number | null;
  first_name: string; last_name: string; email: string;
};

type ReviewState = { id: number; action: "approve" | "reject" } | null;

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
    if (s === "approved") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}><CheckCircle2 className="w-3 h-3" />Aprovado</span>;
    if (s === "rejected") return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}><XCircle className="w-3 h-3" />Reprovado</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}><Clock className="w-3 h-3" />Pendente</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-white">Verificação KYC</h2>
        <p className="text-sm text-gray-500 mt-1">Revise e aprove os documentos enviados pelos usuários.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-2">
          <CheckCircle2 className="w-10 h-10" />
          <div className="text-sm">Nenhum documento enviado ainda.</div>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "#161c2c", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Usuário","Nome","CPF","Enviado em","Status","Documentos","Ação"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id} style={{ background: i % 2 === 0 ? "#111622" : "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td className="px-4 py-3 text-gray-300">{d.first_name} {d.last_name}<div className="text-xs text-gray-600">{d.email}</div></td>
                  <td className="px-4 py-3 text-white font-medium">{d.full_name}</td>
                  <td className="px-4 py-3 text-gray-400">{d.cpf}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.submitted_at).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">{statusBadge(d.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setPreview(d.doc_front_path)} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <Eye className="w-3 h-3" />Frente
                      </button>
                      <button onClick={() => setPreview(d.doc_back_path)} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <Eye className="w-3 h-3" />Verso
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {d.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => { setReview({ id: d.id, action: "approve" }); setNote(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-80"
                          style={{ background: "#22c55e" }}>Aprovar</button>
                        <button onClick={() => { setReview({ id: d.id, action: "reject" }); setNote(""); }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-80"
                          style={{ background: "#ef4444" }}>Reprovar</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setPreview(null)}>
          <img src={preview} alt="Documento" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Review confirm modal */}
      {review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md flex flex-col gap-4" style={{ background: "#161c2c", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="text-white font-bold text-base">
              {review.action === "approve" ? "Aprovar documentos?" : "Reprovar documentos?"}
            </div>
            {review.action === "reject" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-semibold">Motivo da reprovação (opcional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Documento ilegível"
                  className="px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button onClick={() => setReview(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white" style={{ background: "rgba(255,255,255,0.06)" }}>Cancelar</button>
              <button onClick={handleReview} disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
                style={{ background: review.action === "approve" ? "#22c55e" : "#ef4444" }}>
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
