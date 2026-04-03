"use client";

import { useState } from "react";
import { X, ChevronLeft, Search, Lock, CheckCircle2, Copy, Check, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const AMOUNTS = [60, 100, 250, 500, 1000, 1500, 2000, 4000];
const MIN = 60;

type Method = {
  id: string;
  name: string;
  time: string;
  locked: boolean;
  recommended?: boolean;
  logo: React.ReactNode;
};

const PIX_LOGO = (
  <svg viewBox="0 0 40 40" className="w-9 h-9">
    <rect width="40" height="40" rx="8" fill="#32BCAD"/>
    <path d="M20 8l5.3 5.3-5.3 5.3-5.3-5.3L20 8zm10 10l-5.3 5.3 5.3 5.3L35.3 23 30 18zm-10 10l5.3 5.3L20 38.6l-5.3-5.3L20 28zm-10-10l5.3 5.3L10 28.6 4.7 23.3 10 18z" fill="white"/>
  </svg>
);

const METHODS: Method[] = [
  { id: "pix",        name: "PIX (Apenas seu CPF)", time: "1–6 horas",          locked: false, recommended: true, logo: PIX_LOGO },
  { id: "googlepay",  name: "Google Pay",            time: "Instantâneo",        locked: true,  logo: <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[10px] font-bold text-gray-700">G Pay</div> },
  { id: "applepay",   name: "Apple Pay",             time: "Instantâneo",        locked: true,  logo: <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg></div> },
  { id: "mastercard", name: "Mastercard",            time: "Instantâneo",        locked: true,  logo: <div className="w-9 h-9 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center"><div className="flex"><div className="w-5 h-5 rounded-full bg-red-500 opacity-90"/><div className="w-5 h-5 rounded-full bg-yellow-400 opacity-90 -ml-2"/></div></div> },
  { id: "visa",       name: "Visa",                  time: "Instantâneo · Contas verificadas", locked: true, logo: <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[11px] font-extrabold text-blue-800 tracking-tight">VISA</div> },
  { id: "picpay",     name: "PicPay (Apenas seu CPF)", time: "3–60 minutos",     locked: true,  logo: <div className="w-9 h-9 rounded-lg bg-[#21c25e] flex items-center justify-center text-white text-[9px] font-bold">PicPay</div> },
  { id: "boleto",     name: "Boleto Rápido",         time: "1–3 dias úteis",     locked: true,  logo: <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-700">BOLETO</div> },
];

interface Props {
  onDeposit: (amount: number) => void;
  onClose: () => void;
  isMarketing?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full justify-center"
      style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)", color: copied ? "#4ade80" : "#e2e8f0" }}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copiado!" : "Copiar código PIX"}
    </button>
  );
}

/* ── Marketing deposit ── */
function MarketingDeposit({ onDeposit, onClose }: { onDeposit: (n: number) => void; onClose: () => void }) {
  const [amount, setAmount] = useState(100);
  const [custom, setCustom] = useState("100");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const selectAmount = (v: number) => { setAmount(v); setCustom(String(v)); };

  const handleProcess = async () => {
    if (amount < MIN) { setError(`Mínimo: R$ ${MIN}`); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/marketing-deposit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Erro ao processar"); setLoading(false); return; }
      setSuccess(true);
      setTimeout(() => { onDeposit(amount); }, 1500);
    } catch { setError("Erro de conexão"); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col w-full md:w-[420px] md:rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "#1a2236", maxHeight: "95dvh" }}>
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
            <X className="w-4 h-4 text-white" />
          </button>
          <span className="font-semibold text-white">Depositar fundos</span>
        </div>
        <div className="overflow-y-auto flex-1 px-4 py-5 flex flex-col gap-4">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="w-14 h-14" style={{ color: "#34A93E" }} />
              <p className="text-white font-semibold">Depósito processado!</p>
              <p className="text-sm text-gray-400">R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} adicionado ao seu saldo real.</p>
            </div>
          ) : (
            <>
              <div>
                <div className="text-xs text-gray-400 mb-1">Valor</div>
                <input type="number" value={custom}
                  onChange={e => { setCustom(e.target.value); setAmount(parseFloat(e.target.value) || 0); }}
                  className="w-full bg-transparent text-white text-2xl font-bold focus:outline-none"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 6 }} />
                <div className="text-xs text-gray-500 mt-1">Mínimo: R$ {MIN},00</div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => selectAmount(a)} className="py-2 rounded text-xs font-semibold transition-all"
                    style={{ background: amount === a ? "#34A93E" : "rgba(255,255,255,0.07)", color: amount === a ? "#fff" : "#94a3b8", border: `1px solid ${amount === a ? "#34A93E" : "rgba(255,255,255,0.1)"}` }}>
                    R$ {a.toLocaleString("pt-BR")}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button onClick={handleProcess} disabled={loading || amount < MIN}
                className="w-full py-3.5 rounded font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "#34A93E" }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Processando..." : `Processar R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main modal ── */
export default function DepositModal({ onDeposit, onClose, isMarketing }: Props) {
  const [step, setStep]           = useState<"method" | "form" | "qr">("method");
  const [method, setMethod]       = useState<Method | null>(null);
  const [search, setSearch]       = useState("");
  const [amount, setAmount]       = useState(100);
  const [customAmount, setCustom] = useState("100");
  const [name, setName]           = useState("");
  const [lastName, setLastName]   = useState("");
  const [cpf, setCpf]             = useState("");
  const [promo, setPromo]         = useState("");
  const [agreed, setAgreed]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [qr, setQr]                 = useState<{ qr_code: string; qr_image?: string } | null>(null);
  const [crediting, setCrediting]   = useState(false);

  // isMarketing muda apenas o handleDeposit — o popup é o mesmo

  const filtered    = METHODS.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));
  const recommended = filtered.filter(m => m.recommended);
  const others      = filtered.filter(m => !m.recommended);
  const selectAmount = (v: number) => { setAmount(v); setCustom(String(v)); };

  const handleDeposit = async () => {
    if (!agreed || !name || !cpf || amount < MIN) return;
    setError(""); setLoading(true);
    try {
      // Sempre gera QR Code via BSPay (marketing ou não)
      const res = await fetch("/api/pix-charge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, name: `${name} ${lastName}`.trim(), cpf }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Erro ao gerar PIX"); setLoading(false); return; }
      setQr(d);
      setStep("qr");
    } catch { setError("Erro de conexão"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex flex-col w-full md:w-[420px] md:rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "#1a2236", maxHeight: "95dvh" }}>

        {/* ── Step 1: Method ── */}
        {step === "method" && (
          <>
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
                <X className="w-4 h-4 text-white" />
              </button>
              <span className="font-semibold text-white">Método de pagamento</span>
            </div>
            <div className="px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }}>
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input type="text" placeholder="Pesquisar por forma de pagamento" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                  style={{ fontSize: 16 }} />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-4 pb-6">
              {recommended.length > 0 && (
                <>
                  <div className="text-[11px] font-semibold text-gray-500 tracking-widest mb-2">RECOMENDADO</div>
                  {recommended.map(m => <MethodRow key={m.id} m={m} onSelect={() => { setMethod(m); setStep("form"); }} />)}
                </>
              )}
              {others.length > 0 && (
                <>
                  <div className="text-[11px] font-semibold text-gray-500 tracking-widest mt-4 mb-2">OUTROS MÉTODOS</div>
                  {others.map(m => <MethodRow key={m.id} m={m} onSelect={() => { setMethod(m); setStep("form"); }} />)}
                </>
              )}
            </div>
          </>
        )}

        {/* ── Step 2: Form (original format) ── */}
        {step === "form" && method && (
          <>
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setStep("method")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="font-semibold text-white">{method.name}</span>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-4">
              {/* Amount */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Valor</div>
                <input type="number" value={customAmount}
                  onChange={e => { setCustom(e.target.value); setAmount(parseFloat(e.target.value) || 0); }}
                  className="w-full bg-transparent text-white text-2xl font-bold focus:outline-none"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 6 }} />
                <div className="text-xs text-gray-500 mt-1">Mínimo: R$ {MIN},00</div>
              </div>
              {/* Chips */}
              <div className="grid grid-cols-4 gap-2">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => selectAmount(a)} className="py-2 rounded text-xs font-semibold transition-all"
                    style={{ background: amount === a ? "#34A93E" : "rgba(255,255,255,0.07)", color: amount === a ? "#fff" : "#94a3b8", border: `1px solid ${amount === a ? "#34A93E" : "rgba(255,255,255,0.1)"}` }}>
                    R$ {a.toLocaleString("pt-BR")}
                  </button>
                ))}
              </div>
              {/* Promo */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>PROMOÇÃO</span><span>· Exibir disponíveis (0)</span>
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Insira seu código promocional" value={promo} onChange={e => setPromo(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none px-3 py-2 rounded"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <button className="px-3 py-2 rounded text-sm text-gray-400" style={{ background: "rgba(255,255,255,0.06)" }}>Aplicar</button>
                </div>
                <div className="text-[11px] text-gray-500 mt-1">Um código promocional por depósito</div>
              </div>
              {/* Notice */}
              <div className="text-[11px] text-gray-400 p-3 rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                Nossa plataforma não permite CNPJ, CPF de terceiros e/ou métodos de pagamento de terceiros. 90% dos pagamentos são processados pelo provedor em até 5 minutos.
              </div>
              {/* Name */}
              <div>
                <div className="text-xs text-gray-400 mb-1">Nome</div>
                <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded text-sm text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Sobrenome</div>
                <input type="text" placeholder="Sobrenome" value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded text-sm text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">CPF <span className="text-gray-600">11 dígitos</span></div>
                <input type="text" placeholder="Digite seu CPF" value={cpf} onChange={e => setCpf(e.target.value)}
                  className="w-full px-3 py-2.5 rounded text-sm text-white focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
              {/* Terms */}
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 accent-orange-500" />
                <span className="text-xs text-gray-400">
                  Eu, por meio deste, aceito as <span className="text-orange-500">Termos e Condições</span>
                </span>
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {/* CTA */}
              <button onClick={handleDeposit}
                disabled={!agreed || !name || !cpf || amount < MIN || loading}
                className="w-full py-3.5 rounded font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ background: "#34A93E" }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Gerando PIX..." : `Depositar R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: QR Code ── */}
        {step === "qr" && qr && (
          <>
            <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setStep("form")} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <span className="font-semibold text-white">Pagar com PIX</span>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-5 flex flex-col gap-4 items-center">
              <div className="text-center">
                <div className="text-xs text-gray-400">Valor a pagar</div>
                <div className="text-2xl font-bold text-white mt-1">
                  R$ {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
              {qr.qr_code && (
                <div className="p-3 rounded-xl bg-white">
                  <QRCodeSVG value={qr.qr_code} size={192} />
                </div>
              )}
              {qr.qr_code && (
                <div className="w-full flex flex-col gap-2">
                  <div className="text-xs text-gray-400">PIX Copia e Cola</div>
                  <div className="rounded-lg px-3 py-2 text-[11px] text-gray-300 break-all select-all"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "monospace" }}>
                    {qr.qr_code}
                  </div>
                  <CopyButton text={qr.qr_code} />
                </div>
              )}
              <div className="w-full text-[11px] text-gray-400 p-3 rounded-lg text-center"
                style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>
                Após o pagamento, seu saldo será creditado automaticamente. Não feche esta janela até pagar.
              </div>

              {isMarketing && (
                <button
                  onClick={async () => {
                    setCrediting(true);
                    try {
                      const res = await fetch("/api/marketing-deposit", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount }),
                      });
                      const d = await res.json();
                      if (res.ok) { onDeposit(amount); }
                    } catch {}
                    setCrediting(false);
                  }}
                  disabled={crediting}
                  className="w-full py-3.5 rounded font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: "#34A93E" }}
                >
                  {crediting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {crediting ? "Creditando..." : "Já paguei — Creditar saldo"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MethodRow({ m, onSelect }: { m: Method; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors hover:bg-white/[0.05]"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex-shrink-0">{m.logo}</div>
      <div className="flex-1 text-left">
        <div className="text-sm font-medium text-white">{m.name}</div>
        <div className="text-xs text-gray-500">{m.time}</div>
      </div>
      {m.locked && (
        <div className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400" style={{ background: "rgba(255,255,255,0.06)" }}>
          <Lock className="w-3 h-3" /> Bloqueado
        </div>
      )}
    </button>
  );
}
