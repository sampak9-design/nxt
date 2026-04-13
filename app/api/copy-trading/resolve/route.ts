import { NextResponse } from "next/server";
import db from "@/lib/db";

// GET /api/copy-trading/resolve — resolves expired copy trades
// Called periodically or on page load
export async function GET() {
  const now = Date.now();

  // Find unresolved copy trades that have expired
  const expired = db.prepare(`
    SELECT id, user_id, account_type, direction, amount, payout, entry_price, expires_at
    FROM trades
    WHERE is_copy = 1 AND result IS NULL AND expires_at <= ?
  `).all(now) as any[];

  if (expired.length === 0) return NextResponse.json({ resolved: 0 });

  let resolved = 0;
  for (const t of expired) {
    // Get current price for the asset to determine win/lose
    // Since we don't have live price here, use the entry_price with small random variation
    // In production this should use the actual market price at expiry
    const variation = (Math.random() - 0.5) * 0.002;
    const exitPrice = +(t.entry_price * (1 + variation)).toFixed(5);

    const won = t.direction === "up" ? exitPrice > t.entry_price : exitPrice < t.entry_price;
    const result = won ? "win" : "lose";
    const netProfit = won ? +(t.amount * (t.payout / 100)).toFixed(2) : -t.amount;

    db.prepare(
      "UPDATE trades SET exit_price = ?, result = ?, net_profit = ?, resolved_at = ? WHERE id = ?"
    ).run(exitPrice, result, netProfit, now, t.id);

    // Update balance
    if (won) {
      // Return amount + profit
      db.prepare("UPDATE users SET real_balance = real_balance + ? WHERE id = ?")
        .run(t.amount + netProfit, t.user_id);
    }
    // If lost, balance was already deducted at trade creation

    resolved++;
  }

  return NextResponse.json({ resolved });
}
