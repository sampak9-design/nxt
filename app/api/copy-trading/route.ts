import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";
import db from "@/lib/db";

async function getUserId(req: NextRequest): Promise<number | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.userId ?? null;
}

// GET — list rooms for user (with follow status)
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rooms = db.prepare(`
    SELECT r.*,
      u.first_name || ' ' || u.last_name as trader_name,
      (SELECT COUNT(*) FROM copy_followers WHERE room_id = r.id AND status = 'active') as followers,
      (SELECT COUNT(*) FROM trades WHERE user_id = r.trader_id AND result IS NOT NULL) as total_trades,
      (SELECT COUNT(*) FROM trades WHERE user_id = r.trader_id AND result = 'win') as wins,
      (SELECT status FROM copy_followers WHERE room_id = r.id AND user_id = ?) as follow_status
    FROM copy_rooms r
    JOIN users u ON u.id = r.trader_id
    WHERE r.is_active = 1
    ORDER BY r.created_at DESC
  `).all(userId);

  return NextResponse.json({ rooms });
}

// POST — follow/unfollow
export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "follow") {
    const room = db.prepare("SELECT id, price FROM copy_rooms WHERE id = ? AND is_active = 1").get(body.roomId) as any;
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    // Check if already following/pending
    const existing = db.prepare("SELECT id, status FROM copy_followers WHERE room_id = ? AND user_id = ?").get(body.roomId, userId) as any;
    if (existing) {
      if (existing.status === "active") return NextResponse.json({ ok: true, status: "active" });
      if (existing.status === "pending") return NextResponse.json({ ok: true, status: "pending" });
      db.prepare("UPDATE copy_followers SET status = 'pending', followed_at = ? WHERE id = ?").run(Date.now(), existing.id);
    } else {
      db.prepare("INSERT INTO copy_followers (room_id, user_id, status, followed_at) VALUES (?, ?, 'pending', ?)").run(body.roomId, userId, Date.now());
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "unfollow") {
    db.prepare("UPDATE copy_followers SET status = 'cancelled' WHERE room_id = ? AND user_id = ?").run(body.roomId, userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
