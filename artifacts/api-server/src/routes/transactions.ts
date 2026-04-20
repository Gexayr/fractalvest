import { Router } from "express";
import { db, transactionsTable, assetsTable, usersTable, holdingsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const { userId, assetId, type, limit = "20", offset = "0" } = req.query;
  const currentUserId = req.user!.userId;

  const conditions = [eq(transactionsTable.userId, (userId as string) ?? currentUserId)];

  if (assetId && typeof assetId === "string") {
    conditions.push(eq(transactionsTable.assetId, assetId));
  }
  if (type && typeof type === "string") {
    conditions.push(eq(transactionsTable.type, type as "buy" | "sell"));
  }

  const txs = await db.select({
    tx: transactionsTable,
    assetName: assetsTable.name,
  })
    .from(transactionsTable)
    .leftJoin(assetsTable, eq(transactionsTable.assetId, assetsTable.id))
    .where(and(...conditions))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(parseInt(limit as string))
    .offset(parseInt(offset as string));

  res.json(txs.map(({ tx, assetName }) => formatTransaction(tx, assetName ?? "")));
});

router.get("/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [result] = await db.select({
    tx: transactionsTable,
    assetName: assetsTable.name,
  })
    .from(transactionsTable)
    .leftJoin(assetsTable, eq(transactionsTable.assetId, assetsTable.id))
    .where(eq(transactionsTable.id, raw));

  if (!result) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(formatTransaction(result.tx, result.assetName ?? ""));
});

router.post("/transactions", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const { assetId, type, shares } = req.body;

  if (!assetId || !type || !shares || shares < 1) {
    res.status(400).json({ error: "Invalid transaction data" });
    return;
  }

  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, assetId));
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const totalAmount = parseFloat(asset.pricePerShare) * shares;

  if (type === "buy") {
    if (asset.availableShares < shares) {
      res.status(400).json({ error: "Not enough available shares" });
      return;
    }
    if (parseFloat(user.walletBalance) < totalAmount) {
      res.status(400).json({ error: "Insufficient wallet balance" });
      return;
    }

    // Deduct wallet balance
    const newBalance = parseFloat(user.walletBalance) - totalAmount;
    await db.update(usersTable).set({ walletBalance: String(newBalance) }).where(eq(usersTable.id, userId));

    // Update asset available shares
    await db.update(assetsTable)
      .set({ availableShares: asset.availableShares - shares })
      .where(eq(assetsTable.id, assetId));

    // Update holding
    const [existing] = await db.select().from(holdingsTable)
      .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.assetId, assetId)));

    if (existing) {
      await db.update(holdingsTable)
        .set({
          shares: existing.shares + shares,
          totalInvested: String(parseFloat(existing.totalInvested) + totalAmount),
        })
        .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.assetId, assetId)));
    } else {
      await db.insert(holdingsTable).values({
        userId,
        assetId,
        shares,
        totalInvested: String(totalAmount),
      });
    }
  } else if (type === "sell") {
    const [holding] = await db.select().from(holdingsTable)
      .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.assetId, assetId)));

    if (!holding || holding.shares < shares) {
      res.status(400).json({ error: "Not enough shares to sell" });
      return;
    }

    // Add wallet balance
    const newBalance = parseFloat(user.walletBalance) + totalAmount;
    await db.update(usersTable).set({ walletBalance: String(newBalance) }).where(eq(usersTable.id, userId));

    // Update asset available shares
    await db.update(assetsTable)
      .set({ availableShares: asset.availableShares + shares })
      .where(eq(assetsTable.id, assetId));

    // Update holding
    const newShares = holding.shares - shares;
    const proportionSold = shares / holding.shares;
    const investedReduced = parseFloat(holding.totalInvested) * proportionSold;

    if (newShares === 0) {
      await db.delete(holdingsTable)
        .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.assetId, assetId)));
    } else {
      await db.update(holdingsTable)
        .set({
          shares: newShares,
          totalInvested: String(parseFloat(holding.totalInvested) - investedReduced),
        })
        .where(and(eq(holdingsTable.userId, userId), eq(holdingsTable.assetId, assetId)));
    }
  } else {
    res.status(400).json({ error: "Invalid transaction type" });
    return;
  }

  const [tx] = await db.insert(transactionsTable).values({
    userId,
    assetId,
    type,
    shares,
    pricePerShare: asset.pricePerShare,
    totalAmount: String(totalAmount),
    status: "completed",
  }).returning();

  // Create notification
  await db.insert(notificationsTable).values({
    userId,
    type: "transaction",
    title: `${type === "buy" ? "Purchase" : "Sale"} Confirmed`,
    message: `You ${type === "buy" ? "purchased" : "sold"} ${shares} share${shares > 1 ? "s" : ""} of ${asset.name} for $${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
    read: false,
  });

  res.status(201).json(formatTransaction(tx, asset.name));
});

function formatTransaction(
  tx: typeof transactionsTable.$inferSelect,
  assetName: string
) {
  return {
    id: tx.id,
    userId: tx.userId,
    assetId: tx.assetId,
    assetName,
    type: tx.type,
    shares: tx.shares,
    pricePerShare: parseFloat(tx.pricePerShare),
    totalAmount: parseFloat(tx.totalAmount),
    status: tx.status,
    createdAt: tx.createdAt,
  };
}

export default router;
