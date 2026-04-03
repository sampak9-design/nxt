import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyToken, COOKIE } from "@/lib/auth";

function getSetting(key: string): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as any;
  return row?.value ?? "";
}

async function getBspayToken(clientId: string, clientSecret: string, sandbox: boolean): Promise<string> {
  const base = sandbox ? "https://sandbox.bspay.co/v2" : "https://api.bspay.co/v2";
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  // Verify user session
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // Load BSPay config
  const clientId     = getSetting("bspay_client_id");
  const clientSecret = getSetting("bspay_client_secret");
  const sandbox      = getSetting("bspay_sandbox") !== "false";

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Gateway PIX não configurado" }, { status: 503 });
  }

  const { amount, name, cpf } = await req.json();
  const num = parseFloat(amount);
  if (!num || num <= 0) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });

  try {
    const accessToken = await getBspayToken(clientId, clientSecret, sandbox);
    const base = sandbox ? "https://sandbox.bspay.co/v2" : "https://api.bspay.co/v2";

    const chargeRes = await fetch(`${base}/pix/qrcode`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: num,
        external_id: `dep_${payload.userId}_${Date.now()}`,
        description: "Depósito ZyroOption",
        payer: { name, document: cpf.replace(/\D/g, "") },
        postbackUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/pix-webhook`,
      }),
    });

    const chargeData = await chargeRes.json();
    if (!chargeRes.ok) {
      return NextResponse.json({ error: chargeData?.message ?? "Erro ao gerar cobrança" }, { status: 400 });
    }

    return NextResponse.json({
      qr_code:    chargeData.qr_code    ?? chargeData.pixCopiaECola ?? chargeData.brCode,
      qr_image:   chargeData.qr_image   ?? chargeData.imagemQrcode,
      txid:       chargeData.txid       ?? chargeData.id,
      expires_at: chargeData.expires_at ?? chargeData.expiracao,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Erro interno" }, { status: 500 });
  }
}
