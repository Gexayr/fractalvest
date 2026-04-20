import { Router } from "express";
import { db, holdingsTable, assetsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/portfolio/:userId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, raw));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const holdings = await db.select({
    holding: holdingsTable,
    asset: assetsTable,
  })
    .from(holdingsTable)
    .leftJoin(assetsTable, eq(holdingsTable.assetId, assetsTable.id))
    .where(eq(holdingsTable.userId, raw));

  const holdingsFormatted = holdings.map(({ holding, asset }) => {
    const purchaseValue = parseFloat(holding.totalInvested);
    const currentValue = asset ? parseFloat(asset.pricePerShare) * holding.shares : purchaseValue;
    const profitLoss = currentValue - purchaseValue;
    const profitLossPercent = purchaseValue > 0 ? (profitLoss / purchaseValue) * 100 : 0;

    return {
      assetId: holding.assetId,
      assetName: asset?.name ?? "Unknown",
      assetLocation: asset?.location ?? "",
      assetImageUrl: asset?.imageUrl ?? null,
      shares: holding.shares,
      purchaseValue,
      currentValue,
      profitLoss,
      profitLossPercent,
      pricePerShare: asset ? parseFloat(asset.pricePerShare) : 0,
    };
  });

  const totalInvested = holdingsFormatted.reduce((s, h) => s + h.purchaseValue, 0);
  const currentValue = holdingsFormatted.reduce((s, h) => s + h.currentValue, 0);
  const totalProfitLoss = currentValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  res.json({
    userId: raw,
    totalInvested,
    currentValue,
    totalProfitLoss,
    totalProfitLossPercent,
    holdings: holdingsFormatted,
    walletBalance: parseFloat(user.walletBalance),
  });
});

router.get("/portfolio/:userId/performance", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const period = (req.query.period as string) ?? "1m";

  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case "1w": startDate.setDate(now.getDate() - 7); break;
    case "1m": startDate.setMonth(now.getMonth() - 1); break;
    case "3m": startDate.setMonth(now.getMonth() - 3); break;
    case "6m": startDate.setMonth(now.getMonth() - 6); break;
    case "1y": startDate.setFullYear(now.getFullYear() - 1); break;
    default: startDate = new Date(now.getFullYear() - 5, 0, 1);
  }

  // Generate synthetic performance data from transaction history
  const txs = await db.select({
    tx: transactionsTable,
    assetPrice: assetsTable.pricePerShare,
  })
    .from(transactionsTable)
    .leftJoin(assetsTable, eq(transactionsTable.assetId, assetsTable.id))
    .where(and(eq(transactionsTable.userId, raw)))
    .orderBy(transactionsTable.createdAt);

  // Build running portfolio value over time points
  const points = generatePerformancePoints(txs, startDate, now);

  res.json(points);
});

function generatePerformancePoints(
  txs: Array<{ tx: typeof transactionsTable.$inferSelect; assetPrice: string | null }>,
  startDate: Date,
  endDate: Date,
): Array<{ date: Date; value: number; invested: number }> {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const step = Math.max(1, Math.floor(days / 30));
  const points: Array<{ date: Date; value: number; invested: number }> = [];

  let cumulativeInvested = 0;
  let txIdx = 0;

  for (let d = 0; d <= days; d += step) {
    const date = new Date(startDate.getTime() + d * 24 * 60 * 60 * 1000);
    while (txIdx < txs.length && txs[txIdx].tx.createdAt <= date) {
      const tx = txs[txIdx].tx;
      const amount = parseFloat(tx.totalAmount);
      if (tx.type === "buy") cumulativeInvested += amount;
      else cumulativeInvested -= amount;
      txIdx++;
    }

    // Simulate slight growth
    const growthFactor = 1 + (d / days) * 0.12;
    points.push({
      date,
      value: Math.max(0, cumulativeInvested * growthFactor),
      invested: Math.max(0, cumulativeInvested),
    });
  }

  return points;
}

export default router;
