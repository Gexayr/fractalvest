import { Router } from "express";
import { db, assetsTable, assetValuationHistoryTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router = Router();

router.get("/assets", async (req, res): Promise<void> => {
  const { status, type, minPrice, maxPrice } = req.query;
  const conditions = [];

  if (status && typeof status === "string") {
    conditions.push(eq(assetsTable.status, status as "active" | "coming_soon" | "fully_funded" | "closed"));
  }
  if (type && typeof type === "string") {
    conditions.push(eq(assetsTable.propertyType, type));
  }
  if (minPrice) {
    conditions.push(gte(assetsTable.pricePerShare, String(minPrice)));
  }
  if (maxPrice) {
    conditions.push(lte(assetsTable.pricePerShare, String(maxPrice)));
  }

  const assets = conditions.length > 0
    ? await db.select().from(assetsTable).where(and(...conditions))
    : await db.select().from(assetsTable);

  res.json(assets.map(formatAsset));
});

router.get("/assets/featured", async (_req, res): Promise<void> => {
  const assets = await db.select().from(assetsTable)
    .where(eq(assetsTable.status, "active"))
    .limit(6);
  res.json(assets.map(formatAsset));
});

router.get("/assets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, raw));
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json({
    ...formatAsset(asset),
    amenities: asset.amenities,
    documents: asset.documents,
    highlights: asset.highlights,
  });
});

router.get("/assets/:id/valuation-history", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const history = await db.select().from(assetValuationHistoryTable)
    .where(eq(assetValuationHistoryTable.assetId, raw))
    .orderBy(assetValuationHistoryTable.recordedAt);

  res.json(history.map(v => ({
    date: v.recordedAt,
    valuation: parseFloat(v.valuation),
    pricePerShare: parseFloat(v.pricePerShare),
  })));
});

router.post("/assets", requireAdmin, async (req, res): Promise<void> => {
  const { name, description, location, propertyType, totalShares, pricePerShare, expectedReturn, imageUrl } = req.body;

  if (!name || !description || !location || !propertyType || !totalShares || !pricePerShare || !expectedReturn) {
    res.status(400).json({ error: "Required fields missing" });
    return;
  }

  const totalValuation = parseFloat(pricePerShare) * parseInt(totalShares);

  const [asset] = await db.insert(assetsTable).values({
    name,
    description,
    location,
    propertyType,
    totalShares: parseInt(totalShares),
    availableShares: parseInt(totalShares),
    pricePerShare: String(pricePerShare),
    totalValuation: String(totalValuation),
    expectedReturn: String(expectedReturn),
    imageUrl: imageUrl ?? null,
    status: "active",
    amenities: [],
    documents: [],
    highlights: [],
  }).returning();

  res.status(201).json(formatAsset(asset));
});

router.patch("/assets/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, description, location, propertyType, totalShares, pricePerShare, expectedReturn, imageUrl, status } = req.body;

  const updates: Partial<typeof assetsTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (location !== undefined) updates.location = location;
  if (propertyType !== undefined) updates.propertyType = propertyType;
  if (totalShares !== undefined) updates.totalShares = parseInt(totalShares);
  if (pricePerShare !== undefined) updates.pricePerShare = String(pricePerShare);
  if (expectedReturn !== undefined) updates.expectedReturn = String(expectedReturn);
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (status !== undefined) updates.status = status;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [updated] = await db.update(assetsTable).set(updates).where(eq(assetsTable.id, raw)).returning();
  if (!updated) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json(formatAsset(updated));
});

router.delete("/assets/:id", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [deleted] = await db.delete(assetsTable).where(eq(assetsTable.id, raw)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  res.json({ message: "Asset deleted successfully" });
});

function formatAsset(asset: typeof assetsTable.$inferSelect) {
  return {
    id: asset.id,
    name: asset.name,
    description: asset.description,
    location: asset.location,
    propertyType: asset.propertyType,
    totalShares: asset.totalShares,
    availableShares: asset.availableShares,
    pricePerShare: parseFloat(asset.pricePerShare),
    totalValuation: parseFloat(asset.totalValuation),
    expectedReturn: parseFloat(asset.expectedReturn),
    status: asset.status,
    imageUrl: asset.imageUrl,
    createdAt: asset.createdAt,
  };
}

export default router;
