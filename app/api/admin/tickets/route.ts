import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/admin/tickets — list all tickets
export async function GET() {
  const tickets = db.prepare(`
    SELECT t.*,
      u.first_name || ' ' || u.last_name as user_name,
      u.email,
      (SELECT message FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT sender FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_sender,
      (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = t.id) as message_count
    FROM tickets t
    JOIN users u ON u.id = t.user_id
    ORDER BY
      CASE t.status WHEN 'open' THEN 0 WHEN 'answered' THEN 1 ELSE 2 END,
      t.updated_at DESC
  `).all();

  return NextResponse.json({ tickets });
}

// POST /api/admin/tickets — admin actions
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Get messages for a ticket
  if (body.action === "messages") {
    const messages = db.prepare("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC").all(body.ticketId);
    return NextResponse.json({ messages });
  }

  // Admin reply
  if (body.action === "reply") {
    const { ticketId, message } = body;
    if (!ticketId || !message?.trim()) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const now = Date.now();
    db.prepare("INSERT INTO ticket_messages (ticket_id, sender, message, created_at) VALUES (?, 'admin', ?, ?)").run(ticketId, message.trim(), now);
    db.prepare("UPDATE tickets SET updated_at = ?, status = 'answered' WHERE id = ?").run(now, ticketId);

    return NextResponse.json({ ok: true });
  }

  // Close ticket
  if (body.action === "close") {
    db.prepare("UPDATE tickets SET status = 'closed', updated_at = ? WHERE id = ?").run(Date.now(), body.ticketId);
    return NextResponse.json({ ok: true });
  }

  // Reopen ticket
  if (body.action === "reopen") {
    db.prepare("UPDATE tickets SET status = 'open', updated_at = ? WHERE id = ?").run(Date.now(), body.ticketId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
