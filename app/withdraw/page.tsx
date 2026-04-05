"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Wallet, CheckCircle2, ChevronDown, Building2, Info, XCircle, Clock, FileText, ArrowDownCircle, ArrowUpCircle, DollarSign, HelpCircle, LogOut, X } from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";

/* ── PIX icon ── */
const PixIcon = ({ size = 20, color = "#32BCAD" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 40 40" width={size} height={size}>
    <path d="M20 8l5.3 5.3-5.3 5.3-5.3-5.3L20 8zm10 10l-5.3 5.3 5.3 5.3L35.3 23 30 18zm-10 10l5.3 5.3L20 38.6l-5.3-5.3L20 28zm-10-10l5.3 5.3L10 28.6 4.7 23.3 10 18z" fill={color}/>
  </svg>
);

const METHODS = [
  { id: "pix-cpf",    name: "PIX (CPF)",          time: "1 - 3 dias úteis", locked: false, isPix: true  },
  { id: "pix-phone",  name: "PIX (PHONE)",         time: "1 - 3 dias úteis", locked: false, isPix: true  },
  { id: "pix-email",  name: "PIX (E-MAIL)",        time: "1 - 3 dias úteis", locked: false, isPix: true  },
  { id: "pix-random", name: "PIX (RANDOM)",        time: "1 - 3 dias úteis", locked: false, isPix: true  },
  { id: "agibank",    name: "Agibank",              time: "1 - 8 dias úteis", locked: true,  isPix: false },
  { id: "bradesco",   name: "Banco Bradesco S.A.", time: "1 - 8 dias úteis", locked: true,  isPix: false },
];
type Method = typeof METHODS[0];

const FAQ_ITEMS = [
  "Quanto tempo leva para a retirada via PIX cair na conta?",
  "Existe valor mínimo para retirar?",
  "Posso retirar do saldo DEMO?",
  "Por que alguns métodos aparecem como bloqueados?",
];

function MethodIcon({ isPix }: { isPix: boolean }) {
  if (isPix) return (
    <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#32BCAD" }}>
      <PixIcon size={20} color="white" />
    </div>
  );
  return (
    <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#f1f5f9" }}>
      <Building2 style={{ width: 18, height: 18, color: "#9ca3af" }} />
    </div>
  );
}

function MethodIconLarge({ isPix }: { isPix: boolean }) {
  if (isPix) return (
    <div className="rounded-full flex items-center justify-center" style={{ width: 80, height: 80, background: "#e6f7f6" }}>
      <PixIcon size={40} color="#32BCAD" />
    </div>
  );
  return (
    <div className="rounded-full flex items-center justify-center" style={{ width: 80, height: 80, background: "#f1f5f9" }}>
      <Building2 style={{ width: 36, height: 36, color: "#9ca3af" }} />
    </div>
  );
}

/* ── Profile panel (right side) ── */
function ProfilePanel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string>("none");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) { setUser(d.user); setAvatarUrl(d.user.avatar_url ? `${d.user.avatar_url}?t=${Date.now()}` : null); }
    });
    fetch("/api/kyc/status").then(r => r.json()).then(d => setKycStatus(d.status ?? "none"));
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

  const initials = user ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() : "Z";

  const items = [
    { icon: FileText,        label: "Verificação",          dot: kycStatus !== "approved" },
    { icon: ArrowDownCircle, label: "Depositar" },
    { icon: ArrowUpCircle,   label: "Retirar fundos" },
    { icon: DollarSign,      label: "Histórico do saldo" },
    { icon: Clock,           label: "Histórico de trading" },
    { icon: HelpCircle,      label: "Serviço de suporte" },
    { icon: LogOut,          label: "Sair", danger: true },
  ];

  const handleClick = (label: string) => {
    if (label === "Sair") { fetch("/api/auth/logout", { method: "POST" }).finally(() => { window.location.href = "/"; }); return; }
    if (label === "Retirar fundos") { onClose(); return; }
    if (label === "Verificação") { window.location.href = "/verify"; return; }
    if (label === "Depositar") { window.location.href = "/traderoom"; return; }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.15)" }} onMouseDown={onClose} />
      <div ref={ref} className="fixed right-0 top-0 h-full overflow-y-auto z-50 shadow-2xl"
        style={{ width: 300, background: "#fff", borderLeft: "1px solid #e5e7eb" }}>

        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ""; }} />

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#f3f4f6" }}>
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
            style={{ background: avatarUrl ? "transparent" : "linear-gradient(135deg,#f97316,#ea6c0a)" }}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-sm font-bold text-white">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{user?.email}</div>
            <div className="text-xs text-gray-500">Conta real <span className="font-bold text-green-600">R${(user?.real_balance ?? 0).toFixed(2)}</span></div>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Warning if KYC not approved */}
        {kycStatus !== "approved" && (
          <div className="mx-3 my-2 px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium"
            style={{ background: "#fff7ed", color: "#f97316" }}>
            <span className="text-base">⚠️</span> Adicionar informações pessoais
          </div>
        )}

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

        {items.map(({ icon: Icon, label, dot, danger }: any) => (
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

/* ── Main page ── */
export default function WithdrawPage() {
  const [selected, setSelected]             = useState<Method>(METHODS[0]);
  const [mobileSelected, setMobileSelected] = useState<Method | null>(null);
  const [realBalance, setRealBalance]       = useState(0);
  const [kycStatus, setKycStatus]           = useState<string | null>(null);
  const [amount, setAmount]                 = useState("");
  const [pixKey, setPixKey]                 = useState("");
  const [name, setName]                     = useState("");
  const [cpf, setCpf]                       = useState("");
  const [submitted, setSubmitted]           = useState(false);
  const [openFaq, setOpenFaq]               = useState<number | null>(null);
  const [showProfile, setShowProfile]       = useState(false);
  const [avatarUrl, setAvatarUrl]           = useState<string | null>(null);
  const [initials, setInitials]             = useState("Z");

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) {
        setRealBalance(d.user.real_balance ?? 0);
        setInitials(`${d.user.first_name?.[0] ?? ""}${d.user.last_name?.[0] ?? ""}`.toUpperCase());
        setAvatarUrl(d.user.avatar_url ? `${d.user.avatar_url}?t=${Date.now()}` : null);
      }
    }).catch(() => {});
    fetch("/api/kyc/status").then(r => r.json()).then(d => setKycStatus(d.status ?? "none")).catch(() => {});
  }, []);

  const canWithdraw = realBalance > 0;
  const amountNum   = parseFloat(amount) || 0;
  const valid       = canWithdraw && amountNum > 0 && amountNum <= realBalance && !!pixKey && !!name && !!cpf;
  const handleSubmit = () => { if (!valid) return; setSubmitted(true); };

  const MethodsListContent = ({ activeId, onSelect }: { activeId: string | null; onSelect: (m: Method) => void }) => (
    <>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f2f5" }}>
        <span className="text-sm font-semibold" style={{ color: "#374151" }}>Métodos de retirada</span>
      </div>
      {METHODS.map((m, i) => {
        const isActive = activeId === m.id;
        return (
          <button key={m.id} onClick={() => { if (!m.locked) onSelect(m); }}
            className="w-full flex items-center gap-3 px-4 transition-colors"
            style={{
              paddingTop: 12, paddingBottom: 12,
              background: isActive ? "#f9fafb" : "transparent",
              borderLeft: isActive ? "3px solid #32BCAD" : "3px solid transparent",
              borderBottom: i < METHODS.length - 1 ? "1px solid #f4f6f8" : "none",
              cursor: m.locked ? "default" : "pointer",
            }}>
            <MethodIcon isPix={m.isPix} />
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium truncate" style={{ color: "#1f2937" }}>{m.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{m.time}</div>
            </div>
            {m.locked && (
              <div className="px-2 py-0.5 rounded" style={{ background: "#f1f5f9" }}>
                <span className="text-[11px] font-medium" style={{ color: "#6b7280" }}>BLOQUEADO</span>
              </div>
            )}
          </button>
        );
      })}
    </>
  );

  const FormContent = ({ m, onBack }: { m: Method; onBack?: () => void }) => (
    <>
      {onBack && (
        <div className="px-5 pt-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium mb-3" style={{ color: "#6b7280" }}>
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      )}
      {!canWithdraw ? (
        <div className="flex flex-col items-center px-8 py-10 gap-3">
          <MethodIconLarge isPix={m.isPix} />
          <h2 className="text-lg font-bold mt-1" style={{ color: "#1f2937" }}>{m.name}</h2>
          <div className="text-sm" style={{ color: "#6b7280" }}>
            Saldo REAL disponível: <span className="font-bold" style={{ color: "#1f2937" }}>R$ {realBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-sm text-center" style={{ color: "#9ca3af" }}>Você não pode retirar fundos porque seu saldo é 0.</p>
          <button onClick={() => window.location.href = "/traderoom"}
            className="py-3 font-bold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "#34A93E", borderRadius: 6, marginTop: 4, width: "75%", display: "block", marginLeft: "auto", marginRight: "auto" }}>
            Depositar
          </button>
        </div>
      ) : (
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid #f4f6f8" }}>
            <MethodIcon isPix={m.isPix} />
            <div>
              <div className="font-semibold text-sm" style={{ color: "#1f2937" }}>{m.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{m.time}</div>
            </div>
            <div className="ml-auto px-3 py-1 text-xs font-semibold" style={{ background: "#f0fdf4", color: "#34A93E", borderRadius: 6 }}>
              R$ {realBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>VALOR (R$)</label>
            <input type="number" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 6, background: "#fafafa" }}
              className="w-full px-3 py-2.5 text-sm focus:outline-none text-gray-900" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>CHAVE PIX</label>
            <input type="text" placeholder="CPF, e-mail, telefone ou chave aleatória" value={pixKey} onChange={e => setPixKey(e.target.value)}
              style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 6, background: "#fafafa" }}
              className="w-full px-3 py-2.5 text-sm focus:outline-none text-gray-900" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>NOME</label>
              <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)}
                style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 6, background: "#fafafa" }}
                className="w-full px-3 py-2.5 text-sm focus:outline-none text-gray-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>CPF</label>
              <input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)}
                style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 6, background: "#fafafa" }}
                className="w-full px-3 py-2.5 text-sm focus:outline-none text-gray-900" />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={!valid}
            className="w-full py-3 font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#34A93E", borderRadius: 6 }}>
            Solicitar retirada
          </button>
          <a href="#" className="text-xs underline text-center" style={{ color: "#9ca3af" }}>Condições de Retirada</a>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-white" style={{ color: "#111827" }}>

      {/* ── Header ── */}
      <header className="h-14 flex items-center justify-between px-6 border-b bg-white" style={{ borderColor: "#e5e7eb" }}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = "/traderoom"}>
          <ZyroLogo size={32} />
          <span className="font-bold text-gray-800 text-base hidden sm:block">ZyroOption</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
            <img src="https://flagcdn.com/20x15/br.png" alt="PT" />
            <span className="hidden sm:block">Pt</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowProfile(v => !v)}
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
              style={{ border: "2px solid #f97316", background: avatarUrl ? "transparent" : "linear-gradient(135deg,#f97316,#ea6c0a)" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-white">{initials}</span>}
            </button>
          </div>
          <button onClick={() => window.location.href = "/traderoom"}
            className="px-4 py-1.5 rounded-lg text-sm font-bold text-white" style={{ background: "#f97316" }}>
            Negociar
          </button>
        </div>
      </header>

      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}

      {/* ── Sub-header ── */}
      <div className="flex items-center px-6 py-3 border-b" style={{ borderColor: "#e5e7eb" }}>
        <span className="text-sm font-medium text-gray-700">Retirada de fundos</span>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* KYC warning */}
        {kycStatus !== null && kycStatus !== "approved" && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
            style={{ background: "#fffbeb", border: "1px solid #fcd34d" }}>
            <Info className="w-4 h-4 flex-shrink-0" style={{ color: "#d97706" }} />
            <span style={{ color: "#92400e" }}>
              <strong>Verificação de identidade necessária.</strong>{" "}
              Para solicitar saques, você precisa verificar sua identidade.{" "}
              <a href="/verify" className="underline font-semibold" style={{ color: "#d97706" }}>Verificar agora</a>
            </span>
          </div>
        )}

        {submitted ? (
          <div className="p-10 text-center max-w-md mx-auto" style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 12 }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#f0fdf4" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "#34A93E" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1f2937" }}>Solicitação enviada!</h2>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
              Sua retirada de <strong style={{ color: "#1f2937" }}>R$ {amountNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> foi solicitada com sucesso.
            </p>
            <button onClick={() => { setSubmitted(false); setAmount(""); setPixKey(""); setName(""); setCpf(""); setMobileSelected(null); }}
              className="px-8 py-3 font-semibold text-white text-sm transition-all hover:opacity-90"
              style={{ background: "#34A93E", borderRadius: 6 }}>
              Nova retirada
            </button>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden">
              {!mobileSelected ? (
                <div className="overflow-hidden" style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 12 }}>
                  <MethodsListContent activeId={null} onSelect={setMobileSelected} />
                </div>
              ) : (
                <div className="overflow-hidden" style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 12 }}>
                  <FormContent m={mobileSelected} onBack={() => setMobileSelected(null)} />
                </div>
              )}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-hidden" style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 12 }}>
              <div className="grid" style={{ gridTemplateColumns: "280px 1fr" }}>
                <div style={{ borderRight: "1px solid #e8eaed" }}>
                  <MethodsListContent activeId={selected.id} onSelect={setSelected} />
                </div>
                <div>
                  <FormContent m={selected} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* History */}
        <div className="mt-6" style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 12 }}>
          <div className="px-6 py-5 text-center" style={{ borderBottom: "1px solid #f0f2f5" }}>
            <span className="text-base font-bold" style={{ color: "#1f2937" }}>Solicitações de retirada</span>
          </div>
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#f4f6f8" }}>
              <Wallet className="w-5 h-5" style={{ color: "#9ca3af" }} />
            </div>
            <p className="text-sm" style={{ color: "#9ca3af" }}>Nenhum pedido</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: "#1f2937" }}>Perguntas frequentes</h2>
          <div className="overflow-hidden" style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 12 }}>
            {FAQ_ITEMS.map((q, i) => (
              <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? "1px solid #f0f2f5" : "none" }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-sm" style={{ color: "#374151" }}>{q}</span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0 ml-3 transition-transform"
                    style={{ color: "#9ca3af", transform: openFaq === i ? "rotate(180deg)" : "none" }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-1.5 pb-8">
          <Info className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
          <span className="text-sm" style={{ color: "#9ca3af" }}>Se precisar, fale com o suporte.</span>
        </div>
      </div>
    </div>
  );
}
