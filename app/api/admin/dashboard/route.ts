import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  // KPIs
  const activeUsers = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as any).n;
  const totalDeposited = (db.prepare("SELECT COALESCE(SUM(real_balance), 0) AS n FROM users").get() as any).n;
  const totalTrades = (db.prepare("SELECT COUNT(*) AS n FROM trades").get() as any).n;

  // Revenue: sum of losses (net_profit < 0 means house earned)
  const revenue = (db.prepare("SELECT COALESCE(SUM(ABS(net_profit)), 0) AS n FROM trades WHERE result = 'lose'").get() as any).n;

  // Pending counts
  const pendingKyc = (db.prepare("SELECT COUNT(*) AS n FROM kyc_documents WHERE status = 'pending'").get() as any).n;

  // Recent trades (last 10)
  const recentTrades = db.prepare(`
    SELECT t.id, t.asset_name AS asset, t.direction, t.amount, t.result,
           t.net_profit AS profit, u.first_name || ' ' || u.last_name AS userName
    FROM trades t
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.resolved_at DESC
    LIMIT 10
  `).all();

  // Top users by total deposited (real_balance + what they traded)
  const topUsers = db.prepare(`
    SELECT id, first_name || ' ' || last_name AS name,
           real_balance + COALESCE((SELECT SUM(amount) FROM trades WHERE user_id = users.id AND account_type = 'real'), 0) AS totalDeposited
    FROM users
    ORDER BY totalDeposited DESC
    LIMIT 5
  `).all();

  // Chart: last 14 days of trade activity
  const chart = db.prepare(`
    SELECT date(resolved_at / 1000, 'unixepoch') AS date,
           COALESCE(SUM(CASE WHEN result = 'lose' THEN amount ELSE 0 END), 0) AS deposits,
           COALESCE(SUM(CASE WHEN result = 'win' THEN net_profit ELSE 0 END), 0) AS payouts,
           COALESCE(SUM(CASE WHEN result = 'lose' THEN ABS(net_profit) ELSE 0 END), 0) AS revenue,
           COUNT(*) AS trades
    FROM trades
    WHERE resolved_at > (strftime('%s', 'now') - 14 * 86400) * 1000
    GROUP BY date
    ORDER BY date
  `).all();

  return NextResponse.json({
    active_users: activeUsers,
    total_deposited: totalDeposited,
    revenue,
    total_trades: totalTrades,
    pending_deposits: 0,
    pending_withdrawals: 0,
    pending_kyc: pendingKyc,
    open_disputes: 0,
    chart,
    top_users: topUsers,
    recent_trades: recentTrades,
  });
}
