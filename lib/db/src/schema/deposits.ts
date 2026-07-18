import { pgTable, text, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const depositStatusEnum = pgEnum("deposit_status", [
  "waiting",
  "confirming",
  "confirmed",
  "sending",
  "partially_paid",
  "finished",
  "failed",
  "refunded",
  "expired",
]);

export const depositsTable = pgTable("deposits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("nowpayments"),
  providerPaymentId: text("provider_payment_id").notNull().unique(),
  orderId: text("order_id").notNull().unique(),
  amount: decimal("amount", { precision: 18, scale: 6 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  payCurrency: text("pay_currency"),
  status: depositStatusEnum("status").notNull().default("waiting"),
  invoiceUrl: text("invoice_url").notNull(),
  creditedAt: timestamp("credited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertDepositSchema = createInsertSchema(depositsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type Deposit = typeof depositsTable.$inferSelect;
