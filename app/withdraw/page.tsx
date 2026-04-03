"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Wallet } from "lucide-react";
import ZyroLogo from "@/components/ZyroLogo";

const PIX_LOGO = (
  <svg viewBox="0 0 40 40" className="w-8 h-8">
    <rect width="40" height="40" rx="8" fill="#32BCAD"/>
    <path d="M20 8l5.3 5.3-5.3 5.3-5.3-5.3L20 8zm10 10l-5.3 5.3 5.3 5.3L35.3 23 30 18zm-10 10l5.3 5.3L20 38.6l-5.3-5.3L20 28zm-10-10l5.3 5.3L10 28.6 4.7 23.3 10 18z" fill="white"/>
  </svg>
);

const BANK_ICON = (
  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
    <Wallet className="w-4 h-4 text-gray-400" />
  </div>
);

const METHODS = [
  { id: "pix-cpf",    name: "PIX (CPF)",    time: "1 – 3 dias úteis", locked: false, logo: PIX_LOGO },
  { id: "pix-phone",  name: "PIX (PHONE)",  time: "1 – 3 dias úteis", locked: false, logo: PIX_LOGO },
  { id: "pix-email",  name: "PIX (E-MAIL)", time: "1 – 3 dias úteis", locked: false, logo: PIX_LOGO },
  { id: "pix-random", name: "PIX (RANDOM)", time: "1 – 3 dias úteis", locked: false, logo: PIX_LOGO },
  { id: "agibank",    name: "Agibank",       time: "1 – 8 dias úteis", locked: true,  logo: BANK_ICON },
  { id: "bradesco",   name: "Banco Bradesco S.A.", time: "1 – 8 dias úteis", locked: true, logo: BANK_ICON },
  { id: "itau",       name: "Itaú",          time: "1 – 8 dias úteis", locked: true,  logo: BANK_ICON },
  { id: "nubank",     name: "Nubank",        time: "1 – 8 dias úteis", locked: true,  logo: BANK_ICON },
];

type Method = typeof METHODS[0];

export default function WithdrawPage() {
  const [selected, setSelected]       = useState<Method | null>(null);
  const [realBalance, setRealBalance] = useState(0);
  const [amount, setAmount]           = useState("");
  const [pixKey, setPixKey]           = useState("");
  const [name, setName]               = useState("");
  const [cpf, setCpf]                 = useState("");
  const [submitted, setSubmitted]     = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setRealBalance(d.user.real_balance ?? 0);
    }).catch(() => {});
  }, []);

  const canWithdraw = realBalance > 0;
  const amountNum   = parseFloat(amount) || 0;
  const valid       = canWithdraw && amountNum > 0 && amountNum <= realBalance && pixKey && name && cpf;

  const handleSubmit = () => { if (!valid) return; setSubmitted(true); };

  const MethodsList = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Métodos de retirada</div>
      {METHODS.map((m) => (
        <button
          key={m.id}
          onClick={() => { if (!m.locked) setSelected(m); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-0"
          style={{
            background: selected?.id === m.id ? "rgba(249,115,22,0.06)" : "transparent",
            borderLeft: selected?.id === m.id ? "3px solid #f97316" : "3px solid transparent",
            opacity: m.locked ? 0.6 : 1,
            cursor: m.locked ? "default" : "pointer",
          }}
        >
          {m.logo}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
            <div className="text-xs text-gray-400">{m.time}</div>
          </div>
          {m.locked && (
            <span className="text-[10px] font-semibold text-gray-400 border border-gray-300 rounded px-1.5 py-0.5">BLOQUEADO</span>
          )}
        </button>
      ))}
    </div>
  );

  const Form = ({ m }: { m: Method }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
      {/* Back button — mobile only */}
      <button onClick={() => setSelected(null)} className="flex md:hidden items-center gap-1 text-sm text-orange-500 mb-4">
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      {!canWithdraw ? (
        <div className="flex flex-col items-center py-8 gap-4">
          {m.logo}
          <h2 className="text-xl font-bold text-gray-800">{m.name}</h2>
          <p className="text-sm text-gray-500">Saldo REAL disponível: <strong>R$ {realBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p>
          <p className="text-sm text-gray-400 text-center">Você não pode retirar fundos porque seu saldo é 0.</p>
          <button onClick={() => window.location.href = "/traderoom"} className="px-8 py-3 rounded-lg font-bold text-white mt-2" style={{ background: "#34A93E" }}>
            Depositar
          </button>
          <a href="#" className="text-xs text-gray-400 underline">Condições de Retirada</a>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            {m.logo}
            <div>
              <div className="font-bold text-gray-800">{m.name}</div>
              <div className="text-xs text-gray-400">{m.time}</div>
            </div>
          </div>
          <p className="text-sm text-gray-500">Saldo REAL disponível: <strong className="text-green-600">R$ {realBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input type="number" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontSize: 16 }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
            <input type="text" placeholder="CPF, e-mail, telefone ou chave aleatória" value={pixKey} onChange={e => setPixKey(e.target.value)} style={{ fontSize: 16 }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
            <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} style={{ fontSize: 16 }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input type="text" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(e.target.value)} style={{ fontSize: 16 }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-900" />
          </div>
          <button onClick={handleSubmit} disabled={!valid}
            className="w-full py-3 rounded-lg font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#34A93E" }}>
            Solicitar retirada
          </button>
          <a href="#" className="text-xs text-gray-400 underline text-center">Condições de Retirada</a>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#f4f6f8", color: "#111" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZyroLogo size={28} />
            <span className="text-lg font-bold text-orange-500">ZyroOption</span>
          </div>
          <button onClick={() => window.location.href = "/traderoom"} className="px-5 py-2 rounded font-semibold text-white text-sm" style={{ background: "#f97316" }}>
            Negociar
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Retirada de fundos</h1>
          <p className="text-gray-500 mt-1 text-sm">Você tem 1 retirada(s) gratuita(s) até o final do mês.</p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Solicitação enviada!</h2>
            <p className="text-gray-500 text-sm mb-6">Sua retirada de <strong>R$ {amountNum.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong> foi solicitada.</p>
            <button onClick={() => { setSubmitted(false); setAmount(""); setPixKey(""); setSelected(null); }} className="px-6 py-2 rounded font-semibold text-white text-sm" style={{ background: "#f97316" }}>
              Nova retirada
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: show list OR form */}
            <div className="md:hidden">
              {!selected ? <MethodsList /> : <Form m={selected} />}
            </div>

            {/* Desktop: side by side */}
            <div className="hidden md:flex gap-6 items-start">
              <div className="w-64 flex-shrink-0"><MethodsList /></div>
              <div className="flex-1">
                {selected
                  ? <Form m={selected} />
                  : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex flex-col items-center justify-center gap-3 text-gray-400" style={{ minHeight: 300 }}>
                      <Wallet className="w-10 h-10 text-gray-200" />
                      <p className="text-sm">Selecione um método de retirada</p>
                    </div>
                  )
                }
              </div>
            </div>
          </>
        )}

        {/* History */}
        <div className="mt-6 md:mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 text-center">Solicitações de retirada</h2>
          <div className="flex flex-col items-center py-8 gap-2">
            <Wallet className="w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-400">Nenhum pedido</p>
          </div>
        </div>
      </div>
    </div>
  );
}
