import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";
import db from "@/lib/db";

async function getUserId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId ?? null;
}

// GET /api/tickets — list user's tickets
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id AND sender = 'admin'
       AND created_at > COALESCE((SELECT MAX(created_at) FROM ticket_messages WHERE ticket_id = t.id AND sender = 'user'), 0)
      ) as unread_admin
    FROM tickets t WHERE t.user_id = ? ORDER BY t.updated_at DESC
  `).all(userId);

  return NextResponse.json({ tickets });
}

// POST /api/tickets — create ticket or send message
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Create new ticket
  if (body.action === "create") {
    const subject = (body.subject || "Suporte").trim().slice(0, 200);
    const message = (body.message || "").trim();
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const now = Date.now();
    const result = db.prepare("INSERT INTO tickets (user_id, subject, created_at, updated_at) VALUES (?, ?, ?, ?)").run(userId, subject, now, now);
    const ticketId = result.lastInsertRowid;
    db.prepare("INSERT INTO ticket_messages (ticket_id, sender, message, created_at) VALUES (?, 'user', ?, ?)").run(ticketId, message, now);

    return NextResponse.json({ ticketId });
  }

  // Send message to existing ticket
  if (body.action === "message") {
    const ticketId = body.ticketId;
    const message = (body.message || "").trim();
    if (!ticketId || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const ticket = db.prepare("SELECT id FROM tickets WHERE id = ? AND user_id = ?").get(ticketId, userId) as any;
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = Date.now();
    db.prepare("INSERT INTO ticket_messages (ticket_id, sender, message, created_at) VALUES (?, 'user', ?, ?)").run(ticketId, message, now);
    db.prepare("UPDATE tickets SET updated_at = ?, status = 'open' WHERE id = ?").run(now, ticketId);

    return NextResponse.json({ ok: true });
  }

  // Get messages for a ticket
  if (body.action === "messages") {
    const ticketId = body.ticketId;
    const ticket = db.prepare("SELECT id FROM tickets WHERE id = ? AND user_id = ?").get(ticketId, userId) as any;
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = db.prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC").all(ticketId);
    return NextResponse.json({ messages });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
