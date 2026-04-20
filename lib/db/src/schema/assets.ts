import { pgTable, text, timestamp, decimal, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetStatusEnum = pgEnum("asset_status", ["active", "coming_soon", "fully_funded", "closed"]);

export const assetsTable = pgTable("assets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  propertyType: text("property_type").notNull(),
  totalShares: integer("total_shares").notNull(),
  availableShares: integer("available_shares").notNull(),
  pricePerShare: decimal("price_per_share", { precision: 18, scale: 6 }).notNull(),
  totalValuation: decimal("total_valuation", { precision: 18, scale: 6 }).notNull(),
  expectedReturn: decimal("expected_return", { precision: 18, scale: 6 }).notNull(),
  status: assetStatusEnum("status").notNull().default("active"),
  imageUrl: text("image_url"),
  amenities: text("amenities").array().notNull().default([]),
  documents: text("documents").array().notNull().default([]),
  highlights: text("highlights").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;

export const assetValuationHistoryTable = pgTable("asset_valuation_history", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assetId: text("asset_id").notNull().references(() => assetsTable.id, { onDelete: "cascade" }),
  valuation: decimal("valuation", { precision: 18, scale: 6 }).notNull(),
  pricePerShare: decimal("price_per_share", { precision: 18, scale: 6 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAssetValuationSchema = createInsertSchema(assetValuationHistoryTable).omit({ id: true });
export type InsertAssetValuation = z.infer<typeof insertAssetValuationSchema>;
export type AssetValuation = typeof assetValuationHistoryTable.$inferSelect;
