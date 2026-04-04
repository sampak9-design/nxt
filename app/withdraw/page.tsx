"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Wallet, Clock, CheckCircle2, ChevronDown, Building2, Info } from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";

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
  if (isPix) {
    return (
      <div className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ width: 36, height: 36, background: "#32BCAD" }}>
        <PixIcon size={20} color="white" />
      </div>
    );
  }
  return (
    <div className="rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ width: 36, height: 36, background: "#f1f5f9" }}>
      <Building2 style={{ width: 18, height: 18, color: "#9ca3af" }} />
    </div>
  );
}

function MethodIconLarge({ isPix }: { isPix: boolean }) {
  if (isPix) {
    return (
      <div className="rounded-full flex items-center justify-center"
        style={{ width: 80, height: 80, background: "#e6f7f6" }}>
        <PixIcon size={40} color="#32BCAD" />
      </div>
    );
  }
  return (
    <div className="rounded-full flex items-center justify-center"
      style={{ width: 80, height: 80, background: "#f1f5f9" }}>
      <Building2 style={{ width: 36, height: 36, color: "#9ca3af" }} />
    </div>
  );
}

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

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setRealBalance(d.user.real_balance ?? 0);
    }).catch(() => {});
    fetch("/api/kyc/status").then(r => r.json()).then(d => {
      setKycStatus(d.status ?? "none");
    }).catch(() => {});
  }, []);

  const canWithdraw = realBalance > 0;
  const amountNum   = parseFloat(amount) || 0;
  const valid       = canWithdraw && amountNum > 0 && amountNum <= realBalance && !!pixKey && !!name && !!cpf;
  const handleSubmit = () => { if (!valid) return; setSubmitted(true); };

  /* ── Methods list content (sem card próprio) ── */
  const MethodsListContent = ({ activeId, onSelect }: { activeId: string | null; onSelect: (m: Method) => void }) => (
    <>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0f2f5" }}>
        <span className="text-sm font-semibold" style={{ color: "#374151" }}>Métodos de retirada</span>
      </div>
      {METHODS.map((m, i) => {
        const isActive = activeId === m.id;
        return (
          <button
            key={m.id}
            onClick={() => { if (!m.locked) onSelect(m); }}
            className="w-full flex items-center gap-3 px-4 transition-colors"
            style={{
              paddingTop: 12,
              paddingBottom: 12,
              background: isActive ? "#f9fafb" : "transparent",
              borderLeft: isActive ? "3px solid #32BCAD" : "3px solid transparent",
              borderBottom: i < METHODS.length - 1 ? "1px solid #f4f6f8" : "none",
              cursor: m.locked ? "default" : "pointer",
            }}
          >
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

  /* ── Form content (sem card próprio) ── */
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
          <button
            onClick={() => window.location.href = "/traderoom"}
            className="py-3 font-bold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "#34A93E", borderRadius: 6, marginTop: 4, width: "75%", display: "block", marginLeft: "auto", marginRight: "auto" }}
          >
            Depositar
          </button>
          <a href="#" className="text-xs underline" style={{ color: "#9ca3af" }}>Condições de Retirada</a>
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
    <div className="min-h-screen" style={{ background: "#f4f6f8" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e8eaed" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZyroLogo size={28} />
            <span className="text-lg font-bold" style={{ color: "#f97316" }}>ZyroOption</span>
          </div>
          <button
            onClick={() => window.location.href = "/traderoom"}
            className="px-5 py-2 font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "#f97316", borderRadius: 6 }}
          >
            Negociar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
        {/* Page title */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#1f2937" }}>Retirada de fundos</h1>
          <p className="mt-1 text-sm" style={{ color: "#9ca3af" }}>Você tem 1 retirada(s) gratuita(s) até o final do mês.</p>
        </div>

        {/* KYC warning banner */}
        {kycStatus !== null && kycStatus !== "approved" && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg text-sm"
            style={{ background: "#fffbeb", border: "1px solid #fcd34d" }}>
            <Info className="w-4 h-4 flex-shrink-0" style={{ color: "#d97706" }} />
            <span style={{ color: "#92400e" }}>
              <strong>Verificação de identidade necessária.</strong>{" "}
              Para solicitar saques, você precisa verificar sua identidade.{" "}
              <a href="/verify" className="underline font-semibold" style={{ color: "#d97706" }}>
                Verificar agora
              </a>
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
            <button
              onClick={() => { setSubmitted(false); setAmount(""); setPixKey(""); setName(""); setCpf(""); setMobileSelected(null); }}
              className="px-8 py-3 font-semibold text-white text-sm transition-all hover:opacity-90"
              style={{ background: "#34A93E", borderRadius: 6 }}
            >
              Nova retirada
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: each panel is its own card */}
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

            {/* Desktop: ONE card with two columns side by side */}
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
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm" style={{ color: "#374151" }}>{q}</span>
                  <ChevronDown
                    className="w-4 h-4 flex-shrink-0 ml-3 transition-transform"
                    style={{ color: "#9ca3af", transform: openFaq === i ? "rotate(180deg)" : "none" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center gap-1.5 pb-8">
          <Info className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
          <span className="text-sm" style={{ color: "#9ca3af" }}>Se precisar, fale com o suporte.</span>
        </div>
      </div>
    </div>
  );
}
