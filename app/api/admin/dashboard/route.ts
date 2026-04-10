import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const days = parseInt(new URL(req.url).searchParams.get("days") || "30", 10);
  const nowMs = Date.now();
  const sinceMs = nowMs - days * 86400 * 1000;

  const q = (sql: string, params: any[] = []) => {
    try { return db.prepare(sql).get(...params) as any; }
    catch { return { n: 0 }; }
  };

  // Deposits & Withdrawals
  const totalDeposits    = q("SELECT COALESCE(SUM(amount),0) AS n FROM deposits WHERE status='approved' AND created_at >= ?", [sinceMs]).n;
  const totalWithdrawals = q("SELECT COALESCE(SUM(amount),0) AS n FROM withdrawals WHERE status='approved' AND created_at >= ?", [sinceMs]).n;
  const avgTicket        = q("SELECT COALESCE(AVG(amount),0) AS n FROM deposits WHERE status='approved' AND created_at >= ?", [sinceMs]).n;
  const fluxoLiquido     = totalDeposits - totalWithdrawals;

  // User balances
  const saldoTotal       = q("SELECT COALESCE(SUM(real_balance),0) AS n FROM users").n;
  const bonusTotal       = 0; // No bonus system yet
  const totalUsers       = q("SELECT COUNT(*) AS n FROM users").n;
  const newUsersToday    = q("SELECT COUNT(*) AS n FROM users WHERE created_at >= datetime('now','start of day')").n;

  // Trades in period (real account only for house stats)
  const valorApostado    = q("SELECT COALESCE(SUM(amount),0) AS n FROM trades WHERE account_type='real' AND started_at >= ?", [sinceMs]).n;
  const ganhosPlat       = q("SELECT COALESCE(SUM(ABS(net_profit)),0) AS n FROM trades WHERE account_type='real' AND result='lose' AND started_at >= ?", [sinceMs]).n;
  const perdasPlat       = q("SELECT COALESCE(SUM(net_profit),0) AS n FROM trades WHERE account_type='real' AND result='win' AND started_at >= ?", [sinceMs]).n;
  const resultadoPlat    = ganhosPlat + perdasPlat; // perdasPlat is negative

  // Win/Lose counts (for pie chart)
  const wins  = q("SELECT COUNT(*) AS n FROM trades WHERE account_type='real' AND result='win' AND started_at >= ?", [sinceMs]).n;
  const loses = q("SELECT COUNT(*) AS n FROM trades WHERE account_type='real' AND result='lose' AND started_at >= ?", [sinceMs]).n;

  // Last 7 days chart
  const chart7d = db.prepare(`
    SELECT date(started_at / 1000, 'unixepoch') AS date,
           COALESCE(SUM(CASE WHEN result='win' THEN net_profit ELSE 0 END), 0) AS ganhos,
           COALESCE(SUM(CASE WHEN result='lose' THEN ABS(net_profit) ELSE 0 END), 0) AS perdas
    FROM trades WHERE account_type='real' AND started_at >= ?
    GROUP BY date ORDER BY date
  `).all(nowMs - 7 * 86400 * 1000);

  // Profitable users (deposited vs current balance + winnings)
  const profitableUsers = db.prepare(`
    SELECT u.id, u.first_name || ' ' || u.last_name AS name, u.email,
           u.real_balance,
           COALESCE((SELECT SUM(amount) FROM deposits WHERE user_id=u.id AND status='approved'), 0) AS deposited,
           COALESCE((SELECT SUM(net_profit) FROM trades WHERE user_id=u.id AND account_type='real'), 0) AS net_profit
    FROM users u
    WHERE (SELECT COALESCE(SUM(net_profit),0) FROM trades WHERE user_id=u.id AND account_type='real') > 0
    ORDER BY net_profit DESC
    LIMIT 20
  `).all();

  return NextResponse.json({
    totalDeposits, totalWithdrawals, avgTicket, fluxoLiquido,
    saldoTotal, bonusTotal, totalUsers, newUsersToday,
    valorApostado, ganhosPlat, perdasPlat: Math.abs(perdasPlat), resultadoPlat,
    wins, loses,
    chart7d,
    profitableUsers,
  });
}
