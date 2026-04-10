"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import {
  CheckCircle2, Clock, XCircle, Upload, ChevronDown,
  ArrowDownCircle, ArrowUpCircle, FileText, HelpCircle,
  DollarSign, LogOut, Camera, Crown, Key, Settings, X,
} from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";

type KycStatus = "none" | "pending" | "approved" | "rejected";
type Step = 1 | 2 | 3;

/* ── Profile dropdown (appears on this page's header) ── */
function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isVipLocal, setIsVipLocal] = useState(false);
  const [kycLocal, setKycLocal] = useState("none");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        setAvatarUrl(d.user.avatar_url ? `${d.user.avatar_url}?t=${Date.now()}` : null);
        setIsVipLocal(!!d.user.is_marketing);
        setKycLocal(d.user.kyc_status || "none");
      }
    });
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const handleAvatarUpload = async (file: File) => {
    const fd = new FormData(); fd.append("avatar", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: fd });
    if (res.ok) { const d = await res.json(); setAvatarUrl(`${d.avatar_url}?t=${Date.now()}`); }
  };

  const initials = user ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase() : "Z";
  const name     = user ? `${user.first_name} ${user.last_name}` : "";

  const items = [
    { icon: FileText,        label: "Verificação",      dot: true },
    { icon: ArrowDownCircle, label: "Depositar" },
    { icon: ArrowUpCircle,   label: "Retirar fundos" },
    { icon: DollarSign,      label: "Histórico do saldo" },
    { icon: Clock,           label: "Histórico de trading" },
    { icon: HelpCircle,      label: "Serviço de suporte" },
    { icon: LogOut,          label: "Sair", danger: true },
  ];

  const handleClick = (label: string) => {
    if (label === "Sair") { fetch("/api/auth/logout", { method: "POST" }).finally(() => { window.location.href = "/"; }); return; }
    if (label === "Retirar fundos") { window.location.href = "/withdraw"; return; }
    if (label === "Carregar foto") { fileRef.current?.click(); return; }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.15)" }} onMouseDown={onClose} />

      <div ref={ref} className="fixed right-0 top-0 h-full overflow-y-auto z-50 shadow-2xl"
        style={{ width: 300, background: "#fff", borderLeft: "1px solid #e5e7eb" }}>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#f3f4f6" }}>
        <UserAvatar avatarUrl={avatarUrl} isVip={isVipLocal} kycStatus={kycLocal} size={36} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800 truncate">{user?.email}</div>
          <div className="text-xs text-gray-500">Conta real <span className="font-bold text-green-600">R${(user?.real_balance ?? 0).toFixed(2)}</span></div>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Warning */}
      <div className="mx-3 my-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium"
        style={{ background: "#fff7ed", color: "#f97316" }}>
        <span className="text-base">⚠️</span> Adicionar informações pessoais
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3">
        <button onClick={() => { window.location.href = "/traderoom"; }}
          className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ background: "#22c55e" }}>
          Depositar
        </button>
        <button onClick={() => { window.location.href = "/traderoom"; }}
          className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ background: "#f97316" }}>
          Negociar
        </button>
      </div>

      <div className="border-t" style={{ borderColor: "#f3f4f6" }} />

      {/* Menu */}
      {items.map(({ icon: Icon, label, dot, danger }) => (
        <button key={label} onClick={() => handleClick(label)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
          style={{ color: danger ? "#ef4444" : "#374151" }}>
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: danger ? "#ef4444" : "#9ca3af" }} />
          <span className="flex-1 text-left">{label}</span>
          {dot && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
        </button>
      ))}
    </div>
    </>
  );
}

/* ── Step indicator ── */
function Steps({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {[1, 2, 3].map((s, i) => {
        const done    = step > s;
        const active  = step === s;
        return (
          <div key={s} className="flex items-center">
            <div className="flex items-center justify-center rounded-full w-9 h-9 text-sm font-bold transition-all"
              style={{
                background: done ? "#f97316" : active ? "#fff" : "#e5e7eb",
                border: active ? "2px solid #f97316" : done ? "none" : "2px solid #d1d5db",
                color: done ? "#fff" : active ? "#f97316" : "#9ca3af",
              }}>
              {done ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {i < 2 && (
              <div className="w-16 h-0.5 mx-1" style={{ background: step > s + 0 ? "#f97316" : "#e5e7eb" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ── */
export default function VerifyPage() {
  const router = useRouter();

  // Auth/user
  const [user, setUser]       = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu]   = useState(false);

  // KYC state
  const [kycStatus, setKycStatus] = useState<KycStatus>("none");
  const [loading, setLoading]     = useState(true);

  // Form
  const [step, setStep]           = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [usResident, setUsResident] = useState(false);
  const [cpf, setCpf]             = useState("");
  const [front, setFront]         = useState<File | null>(null);
  const [back, setBack]           = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [isVip, setIsVip]         = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/kyc/status").then(r => r.json()),
    ]).then(([me, kyc]) => {
      if (me.user) {
        setUser(me.user);
        setAvatarUrl(me.user.avatar_url ? `${me.user.avatar_url}?t=${Date.now()}` : null);
        setFirstName(me.user.first_name ?? "");
        setLastName(me.user.last_name ?? "");
        setIsVip(!!me.user.is_marketing);
      }
      const s: KycStatus = kyc.status ?? "none";
      setKycStatus(s);
      if (s === "pending" || s === "approved") setStep(3);
      else if (s === "none" || s === "rejected") setStep(1);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatCpf = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
            .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
            .replace(/(\d{3})(\d{3})/, "$1.$2")
            .replace(/(\d{3})/, "$1");
  };

  const formatDate = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 8);
    return n.replace(/(\d{2})(\d{2})(\d{4})/, "$1.$2.$3")
            .replace(/(\d{2})(\d{2})/, "$1.$2")
            .replace(/(\d{2})/, "$1");
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !birthDate.trim()) {
      setError("Preencha todos os campos obrigatórios."); return;
    }
    setError("");
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf.trim() || !front || !back) {
      setError("Preencha o CPF e envie os dois documentos."); return;
    }
    setSubmitting(true); setError("");
    const fd = new FormData();
    fd.append("full_name", `${firstName} ${lastName}`);
    fd.append("cpf", cpf);
    fd.append("doc_front", front);
    fd.append("doc_back", back);
    try {
      const res = await fetch("/api/kyc/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar."); }
      else { setKycStatus("pending"); setStep(3); }
    } catch { setError("Erro de conexão."); }
    setSubmitting(false);
  };

  const initials = user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() : "Z";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white" style={{ color: "#111827" }}>

      {/* ── Header ── */}
      <header className="h-14 flex items-center justify-between px-6 border-b bg-white"
        style={{ borderColor: "#e5e7eb" }}>
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/traderoom")}>
          <ZyroLogo size={32} />
          <span className="font-bold text-gray-800 text-base hidden sm:block">ZyroOption</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Language */}
          <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <img src="https://flagcdn.com/20x15/br.png" alt="PT" />
            <span className="hidden sm:block">Pt</span>
          </button>

          {/* Avatar + dropdown */}
          <div className="relative">
            <button onClick={() => setShowMenu(v => !v)}>
              <UserAvatar avatarUrl={avatarUrl} isVip={isVip} kycStatus={kycStatus} size={36} />
            </button>
            {showMenu && <ProfileDropdown onClose={() => setShowMenu(false)} />}
          </div>

          {/* Negociar */}
          <button onClick={() => router.push("/traderoom")}
            className="px-4 py-1.5 rounded-lg text-sm font-bold text-white"
            style={{ background: "#f97316" }}>
            Negociar
          </button>
        </div>
      </header>

      {/* ── Sub-header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
        <span className="text-sm font-medium text-gray-700">Verificação da conta</span>
        <div className="text-right text-xs text-gray-400">
          {user?.created_at && (
            <div>Data de registro: {new Date(user.created_at).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}</div>
          )}
          <div>ID de perfil: {user?.id ?? "—"}</div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Steps step={step} />

        {/* ── Step 1: Dados pessoais ── */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Dados pessoais</h2>
            <p className="text-sm text-center text-gray-500 mb-10 max-w-md mx-auto">
              Fornecer informações pessoais corretas facilitará a verificação da sua conta e seu financiamento. Os detalhes que você fornecer serão mantidos em sigilo.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-600 flex items-center gap-2"
                style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <XCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div className="border-t pt-8" style={{ borderColor: "#e5e7eb" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Informações pessoais</h3>
                  <p className="text-sm text-gray-500">
                    Forneça seus dados pessoais exatamente como aparecem no seu documento de identificação para evitar problemas de verificação no futuro.
                  </p>
                </div>
                <form onSubmit={handleStep1Submit} className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Nome</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ borderColor: "#d1d5db" }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Sobrenome</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ borderColor: "#d1d5db" }} />
                    <p className="text-xs text-gray-400">Digite seu nome e sobrenome exatamente como aparecem em seu documento de identificação.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">Data de nascimento</label>
                    <input type="text" value={birthDate} onChange={e => setBirthDate(formatDate(e.target.value))}
                      placeholder="dd.mm.yyyy"
                      className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ borderColor: "#d1d5db" }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">País de cidadania</label>
                    <div className="relative">
                      <select className="w-full px-3 py-2.5 rounded-lg text-sm border appearance-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                        style={{ borderColor: "#d1d5db" }}>
                        <option>Brasil</option>
                        <option>Portugal</option>
                        <option>Outro</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={usResident} onChange={e => setUsResident(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-orange-500" />
                    <span className="text-sm text-gray-600">Sou cidadão ou residente para efeitos fiscais dos EUA.</span>
                  </label>
                  <button type="submit"
                    className="w-full py-3 rounded-lg text-sm font-bold text-white mt-2"
                    style={{ background: "#f97316" }}>
                    Enviar
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t mt-10 pt-8" style={{ borderColor: "#e5e7eb" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Endereço de residência</h3>
                  <p className="text-sm text-gray-500">Verifique se o endereço está correto.</p>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800">Brasil</span>
                    <img src="https://flagcdn.com/20x15/br.png" alt="BR" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Se este não for seu país de residência permanente, envie um e-mail para{" "}
                    <span className="text-orange-500">suporte@zyrooption.com</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Step 2: Documentos ── */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Verificação de identidade</h2>
            <p className="text-sm text-center text-gray-500 mb-10 max-w-md mx-auto">
              Envie seu CPF e fotos do documento de identidade (frente e verso) para concluir a verificação.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg text-sm text-red-600 flex items-center gap-2"
                style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <XCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div className="border-t pt-8" style={{ borderColor: "#e5e7eb" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Documentos</h3>
                  <p className="text-sm text-gray-500">
                    Envie fotos bem iluminadas, sem cortes e com texto legível. Formatos aceitos: JPG, PNG.
                  </p>
                </div>
                <form onSubmit={handleStep2Submit} className="md:col-span-2 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">CPF</label>
                    <input type="text" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ borderColor: "#d1d5db" }} />
                  </div>
                  {[
                    { label: "Documento (frente)", ref: frontRef, file: front, setFile: setFront },
                    { label: "Documento (verso)",  ref: backRef,  file: back,  setFile: setBack  },
                  ].map(({ label, ref, file, setFile }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">{label}</label>
                      <button type="button" onClick={() => ref.current?.click()}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border transition-colors hover:border-orange-400 text-left"
                        style={{ borderColor: file ? "#f97316" : "#d1d5db", color: file ? "#f97316" : "#9ca3af" }}>
                        <Upload className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{file ? file.name : "Escolher arquivo"}</span>
                      </button>
                      <input ref={ref} type="file" accept="image/jpg,image/jpeg,image/png"
                        className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    </div>
                  ))}
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => { setStep(1); setError(""); }}
                      className="flex-1 py-3 rounded-lg text-sm font-bold border transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#d1d5db", color: "#374151" }}>
                      Voltar
                    </button>
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-3 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: "#f97316" }}>
                      {submitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {submitting ? "Enviando..." : "Enviar para análise"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ── Step 3: Resultado ── */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-10 gap-6">
            {kycStatus === "approved" ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900">Verificação concluída</h2>
                <p className="text-sm text-gray-500 text-center max-w-sm">Sua identidade foi verificada com sucesso. Você já pode realizar saques.</p>
              </>
            ) : kycStatus === "rejected" ? (
              <>
                <XCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">Documentos reprovados</h2>
                <p className="text-sm text-gray-500 text-center max-w-sm">Seus documentos foram reprovados. Envie novamente com fotos mais nítidas.</p>
                <button onClick={() => { setStep(1); setFront(null); setBack(null); setError(""); }}
                  className="px-8 py-3 rounded-lg text-sm font-bold text-white"
                  style={{ background: "#f97316" }}>
                  Tentar novamente
                </button>
              </>
            ) : (
              <>
                <Clock className="w-16 h-16 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Em análise</h2>
                <p className="text-sm text-gray-500 text-center max-w-sm">Seus documentos estão sendo revisados pela nossa equipe. Você será notificado em breve.</p>
              </>
            )}
            <button onClick={() => router.push("/traderoom")}
              className="px-8 py-3 rounded-lg text-sm font-bold text-white"
              style={{ background: "#f97316" }}>
              Voltar a negociar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
