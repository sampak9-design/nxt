import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { clientId, clientSecret, sandbox } = await req.json();

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Credenciais ausentes" }, { status: 400 });
  }

  const base = sandbox ? "https://sandbox.bspay.co/v2" : "https://api.bspay.co/v2";
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const res = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();

    if (res.ok && data.access_token) {
      return NextResponse.json({ ok: true, message: "Conexão bem-sucedida! Token gerado." });
    }

    return NextResponse.json({ ok: false, message: data?.message ?? data?.error ?? "Credenciais inválidas." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: `Erro ao conectar: ${e.message}` }, { status: 500 });
  }
}
