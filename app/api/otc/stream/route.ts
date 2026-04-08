import { NextRequest } from "next/server";
import { isOtc, subscribe, type StreamMsg } from "@/lib/otc/deriv-proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/otc/stream?symbol=EURUSD-OTC
// Server-Sent Events: streams every tick (with manipulation applied) for the
// given OTC asset until the client disconnects.
export async function GET(req: NextRequest) {
  const symbol = new URL(req.url).searchParams.get("symbol") || "";
  if (!isOtc(symbol)) {
    return new Response("Unknown OTC symbol", { status: 400 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (msg: StreamMsg) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(msg)}\n\n`));
        } catch {}
      };

      // Initial comment so the connection opens immediately
      controller.enqueue(encoder.encode(`: connected\n\n`));

      unsubscribe = subscribe(symbol, send);

      // Heartbeat every 15s to keep proxies/firewalls from killing the conn
      heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch {}
      }, 15_000);

      // Cleanup when client aborts
      req.signal.addEventListener("abort", () => {
        if (unsubscribe) unsubscribe();
        if (heartbeat) clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
