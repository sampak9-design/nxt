import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET — list all rooms with stats
export async function GET() {
  const rooms = db.prepare(`
    SELECT r.*,
      u.first_name || ' ' || u.last_name as trader_name,
      (SELECT COUNT(*) FROM copy_followers WHERE room_id = r.id AND status = 'active') as followers,
      (SELECT COUNT(*) FROM copy_followers WHERE room_id = r.id AND status = 'pending') as pending_followers,
      (SELECT COUNT(*) FROM trades WHERE user_id = r.trader_id AND result IS NOT NULL) as total_trades,
      (SELECT COUNT(*) FROM trades WHERE user_id = r.trader_id AND result = 'win') as wins
    FROM copy_rooms r
    JOIN users u ON u.id = r.trader_id
    ORDER BY r.created_at DESC
  `).all();

  return NextResponse.json({ rooms });
}

// POST — create, update, delete, toggle
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "create") {
    const { name, description, trader_id, price, max_pct } = body;
    if (!name || !trader_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const now = Date.now();
    const result = db.prepare(
      "INSERT INTO copy_rooms (name, description, trader_id, price, max_pct, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(name, description || "", trader_id, price || 0, max_pct || 10, now);
    return NextResponse.json({ id: result.lastInsertRowid });
  }

  if (body.action === "update") {
    const { id, name, description, price, max_pct } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    db.prepare("UPDATE copy_rooms SET name = ?, description = ?, price = ?, max_pct = ? WHERE id = ?")
      .run(name, description || "", price || 0, max_pct || 10, id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "toggle") {
    const room = db.prepare("SELECT is_active FROM copy_rooms WHERE id = ?").get(body.id) as any;
    if (!room) return NextResponse.json({ error: "Not found" }, { status: 404 });
    db.prepare("UPDATE copy_rooms SET is_active = ? WHERE id = ?").run(room.is_active ? 0 : 1, body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete") {
    db.prepare("DELETE FROM copy_followers WHERE room_id = ?").run(body.id);
    db.prepare("DELETE FROM copy_rooms WHERE id = ?").run(body.id);
    return NextResponse.json({ ok: true });
  }

  // List followers for a room
  if (body.action === "followers") {
    const followers = db.prepare(`
      SELECT cf.*, u.first_name || ' ' || u.last_name as user_name, u.email
      FROM copy_followers cf
      JOIN users u ON u.id = cf.user_id
      WHERE cf.room_id = ?
      ORDER BY cf.followed_at DESC
    `).all(body.roomId);
    return NextResponse.json({ followers });
  }

  // Approve follower
  if (body.action === "approve_follower") {
    db.prepare("UPDATE copy_followers SET status = 'active' WHERE id = ?").run(body.followerId);
    return NextResponse.json({ ok: true });
  }

  // Reject follower
  if (body.action === "reject_follower") {
    db.prepare("UPDATE copy_followers SET status = 'cancelled' WHERE id = ?").run(body.followerId);
    return NextResponse.json({ ok: true });
  }

  // List marketing users (for trader selection)
  if (body.action === "traders") {
    const traders = db.prepare(
      "SELECT id, first_name || ' ' || last_name as name, email FROM users WHERE is_marketing = 1 ORDER BY first_name"
    ).all();
    return NextResponse.json({ traders });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
