import { Router } from "express";
import { db, holdingsTable, assetsTable, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/dashboard/summary", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const holdings = await db.select({
    holding: holdingsTable,
    asset: assetsTable,
  })
    .from(holdingsTable)
    .leftJoin(assetsTable, eq(holdingsTable.assetId, assetsTable.id))
    .where(eq(holdingsTable.userId, userId));

  const totalInvested = holdings.reduce((s, { holding }) => s + parseFloat(holding.totalInvested), 0);
  const portfolioValue = holdings.reduce((s, { holding, asset }) => {
    const price = asset ? parseFloat(asset.pricePerShare) : 0;
    return s + price * holding.shares;
  }, 0);

  const totalReturn = portfolioValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  res.json({
    totalInvested,
    portfolioValue,
    totalReturn,
    totalReturnPercent,
    totalAssets: holdings.length,
    walletBalance: parseFloat(user.walletBalance),
    activeHoldings: holdings.filter(h => h.holding.shares > 0).length,
  });
});

router.get("/dashboard/market-overview", async (_req, res): Promise<void> => {
  const assets = await db.select().from(assetsTable);
  const usersCount = await db.select({ count: count() }).from(usersTable);

  const totalMarketCap = assets.reduce((s, a) => s + parseFloat(a.totalValuation), 0);
  const avgExpectedReturn = assets.length > 0
    ? assets.reduce((s, a) => s + parseFloat(a.expectedReturn), 0) / assets.length
    : 0;

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const newAssets = assets.filter(a => new Date(a.createdAt) >= oneMonthAgo).length;

  res.json({
    totalAssets: assets.length,
    totalMarketCap,
    avgExpectedReturn,
    activeInvestors: usersCount[0]?.count ?? 0,
    newAssetsThisMonth: newAssets,
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const limit = parseInt((req.query.limit as string) ?? "10");

  const txs = await db.select({
    tx: transactionsTable,
    assetName: assetsTable.name,
  })
    .from(transactionsTable)
    .leftJoin(assetsTable, eq(transactionsTable.assetId, assetsTable.id))
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit);

  res.json(txs.map(({ tx, assetName }) => ({
    id: tx.id,
    type: tx.type,
    assetName: assetName ?? null,
    amount: parseFloat(tx.totalAmount),
    shares: tx.shares,
    status: tx.status,
    createdAt: tx.createdAt,
  })));
});

export default router;
