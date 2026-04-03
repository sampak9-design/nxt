"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Wallet, Clock, CheckCircle2, Lock } from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";

const PixIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 40 40" width={size} height={size}>
    <path d="M20 8l5.3 5.3-5.3 5.3-5.3-5.3L20 8zm10 10l-5.3 5.3 5.3 5.3L35.3 23 30 18zm-10 10l5.3 5.3L20 38.6l-5.3-5.3L20 28zm-10-10l5.3 5.3L10 28.6 4.7 23.3 10 18z" fill="#32BCAD"/>
  </svg>
);

const METHODS = [
  { id: "pix-cpf",    name: "PIX (CPF)",          time: "1 – 3 dias úteis", locked: false, isPix: true  },
  { id: "pix-phone",  name: "PIX (PHONE)",         time: "1 – 3 dias úteis", locked: false, isPix: true  },
  { id: "pix-email",  name: "PIX (E-MAIL)",        time: "1 – 3 dias úteis", locked: false, isPix: true  },
  { id: "pix-random", name: "PIX (RANDOM)",        time: "1 – 3 dias úteis", locked: false, isPix: true  },
  { id: "agibank",    name: "Agibank",              time: "1 – 8 dias úteis", locked: true,  isPix: false },
  { id: "bradesco",   name: "Banco Bradesco S.A.", time: "1 – 8 dias úteis", locked: true,  isPix: false },
  { id: "itau",       name: "Itaú",                time: "1 – 8 dias úteis", locked: true,  isPix: false },
  { id: "nubank",     name: "Nubank",              time: "1 – 8 dias úteis", locked: true,  isPix: false },
];

type Method = typeof METHODS[0];

function MethodIcon({ isPix, small }: { isPix: boolean; small?: boolean }) {
  const sz = small ? 36 : 36;
  if (isPix) {
    return (
      <div className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ width: sz, height: sz, background: "#32BCAD" }}>
        <PixIcon size={20} />
      </div>
    );
  }
  return (
    <div className="rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ width: sz, height: sz, background: "#f1f5f9" }}>
      <Wallet className="text-gray-400" style={{ width: 18, height: 18 }} />
    </div>
  );
}

function MethodIconLarge({ isPix }: { isPix: boolean }) {
  if (isPix) {
    return (
      <div className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ background: "#e6f7f6" }}>
        <PixIcon size={44} />
      </div>
    );
  }
  return (
    <div className="w-24 h-24 rounded-full flex items-center justify-center"
      style={{ background: "#f1f5f9" }}>
      <Wallet className="w-10 h-10 text-gray-400" />
    </div>
  );
}

export default function WithdrawPage() {
  const [selected, setSelected]             = useState<Method>(METHODS[0]);
  const [mobileSelected, setMobileSelected] = useState<Method | null>(null);
  const [realBalance, setRealBalance]       = useState(0);
  const [amount, setAmount]                 = useState("");
  const [pixKey, setPixKey]                 = useState("");
  const [name, setName]                     = useState("");
  const [cpf, setCpf]                       = useState("");
  const [submitted, setSubmitted]           = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setRealBalance(d.user.real_balance ?? 0);
    }).catch(() => {});
  }, []);

  const canWithdraw = realBalance > 0;
  const amountNum   = parseFloat(amount) || 0;
  const valid       = canWithdraw && amountNum > 0 && amountNum <= realBalance && !!pixKey && !!name && !!cpf;
  const handleSubmit = () => { if (!valid) return; setSubmitted(true); };

  const MethodsList = ({ activeId, onSelect }: { activeId: string | null; onSelect: (m: Method) => void }) => (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e8eaed", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #f0f2f5" }}>
        <span className="text-xs font-bold tracking-widest" style={{ color: "#9ca3af" }}>MÉTODOS DE RETIRADA</span>
      </div>
      {METHODS.map((m, i) => {
        const isActive = activeId === m.id;
        return (
          <button
            key={m.id}
            onClick={() => { if (!m.locked) onSelect(m); }}
            className="w-full flex items-center gap-3 px-5 transition-all"
            style={{
              paddingTop: 14,
              paddingBottom: 14,
              background: isActive ? "rgba(249,115,22,0.05)" : "transparent",
              borderLeft: isActive ? "3px solid #f97316" : "3px solid transparent",
              borderBottom: i < METHODS.length - 1 ? "1px solid #f4f6f8" : "none",
              cursor: m.locked ? "default" : "pointer",
              opacity: m.locked ? 0.55 : 1,
            }}
          >
            <MethodIcon isPix={m.isPix} />
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold truncate" style={{ color: isActive ? "#f97316" : "#1a1a2e" }}>{m.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock style={{ width: 11, height: 11, color: "#9ca3af" }} />
                <span className="text-xs" style={{ color: "#9ca3af" }}>{m.time}</span>
              </div>
            </div>
            {m.locked && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: "#f1f5f9" }}>
                <Lock style={{ width: 10, height: 10, color: "#9ca3af" }} />
                <span className="text-[10px] font-semibold" style={{ color: "#9ca3af" }}>BLOQUEADO</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  const Form = ({ m, onBack }: { m: Method; onBack?: () => void }) => (
    <div className="rounded-2xl" style={{ background: "#fff", border: "1px solid #e8eaed", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {onBack && (
        <div className="px-6 pt-5">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium mb-4" style={{ color: "#f97316" }}>
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      )}

      {!canWithdraw ? (
        <div className="flex flex-col items-center px-8 py-12 gap-4">
          <MethodIconLarge isPix={m.isPix} />
          <h2 className="text-xl font-bold mt-2" style={{ color: "#1a1a2e" }}>{m.name}</h2>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: "#f8fafc" }}>
            <span className="text-sm" style={{ color: "#6b7280" }}>Saldo REAL disponível:</span>
            <span className="text-sm font-bold" style={{ color: "#1a1a2e" }}>R$ {realBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          <p className="text-sm text-center" style={{ color: "#9ca3af" }}>Você não pode retirar fundos porque seu saldo é 0.</p>
          <button
            onClick={() => window.location.href = "/traderoom"}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "#22c55e" }}
          >
            Depositar agora
          </button>
          <a href="#" className="text-xs underline" style={{ color: "#d1d5db" }}>Condições de Retirada</a>
        </div>
      ) : (
        <div className="p-6 md:p-8 flex flex-col gap-5">
          {/* Method header */}
          <div className="flex items-center gap-3 pb-5" style={{ borderBottom: "1px solid #f4f6f8" }}>
            <MethodIcon isPix={m.isPix} />
            <div>
              <div className="font-bold text-sm" style={{ color: "#1a1a2e" }}>{m.name}</div>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock style={{ width: 11, height: 11, color: "#9ca3af" }} />
                <span className="text-xs" style={{ color: "#9ca3af" }}>{m.time}</span>
              </div>
            </div>
            <div className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "#f0fdf4", color: "#22c55e" }}>
              Saldo: R$ {realBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Fields */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>VALOR (R$)</label>
            <input type="number" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 12, background: "#fafafa" }}
              className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>CHAVE PIX</label>
            <input type="text" placeholder="CPF, e-mail, telefone ou chave aleatória" value={pixKey} onChange={e => setPixKey(e.target.value)}
              style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 12, background: "#fafafa" }}
              className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>NOME COMPLETO</label>
              <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)}
                style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 12, background: "#fafafa" }}
                className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: "#6b7280" }}>CPF</label>
              <input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)}
                style={{ fontSize: 16, border: "1px solid #e8eaed", borderRadius: 12, background: "#fafafa" }}
                className="w-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-900 transition-all" />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={!valid}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{ background: "#22c55e" }}>
            Solicitar retirada
          </button>
          <a href="#" className="text-xs underline text-center" style={{ color: "#d1d5db" }}>Condições de Retirada</a>
        </div>
      )}
    </div>
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
          <button onClick={() => window.location.href = "/traderoom"}
            className="px-5 py-2 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90"
            style={{ background: "#f97316" }}>
            Negociar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#1a1a2e" }}>Retirada de fundos</h1>
          <p className="mt-1 text-sm" style={{ color: "#9ca3af" }}>Você tem 1 retirada(s) gratuita(s) até o final do mês.</p>
        </div>

        {submitted ? (
          <div className="rounded-2xl p-10 text-center max-w-md mx-auto" style={{ background: "#fff", border: "1px solid #e8eaed", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#f0fdf4" }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: "#22c55e" }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1a1a2e" }}>Solicitação enviada!</h2>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
              Sua retirada de <strong style={{ color: "#1a1a2e" }}>R$ {amountNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> foi solicitada com sucesso.
            </p>
            <button
              onClick={() => { setSubmitted(false); setAmount(""); setPixKey(""); setName(""); setCpf(""); setMobileSelected(null); }}
              className="px-8 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
              style={{ background: "#f97316" }}
            >
              Nova retirada
            </button>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden">
              {!mobileSelected
                ? <MethodsList activeId={null} onSelect={setMobileSelected} />
                : <Form m={mobileSelected} onBack={() => setMobileSelected(null)} />
              }
            </div>

            {/* Desktop: side by side */}
            <div className="hidden md:grid gap-6" style={{ gridTemplateColumns: "300px 1fr" }}>
              <MethodsList activeId={selected.id} onSelect={setSelected} />
              <Form m={selected} />
            </div>
          </>
        )}

        {/* History */}
        <div className="mt-8 rounded-2xl" style={{ background: "#fff", border: "1px solid #e8eaed", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #f0f2f5" }}>
            <span className="text-xs font-bold tracking-widest" style={{ color: "#9ca3af" }}>SOLICITAÇÕES DE RETIRADA</span>
          </div>
          <div className="flex flex-col items-center py-14 gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#f4f6f8" }}>
              <Wallet className="w-6 h-6" style={{ color: "#d1d5db" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#9ca3af" }}>Nenhuma solicitação encontrada</p>
          </div>
        </div>
      </div>
    </div>
  );
}
