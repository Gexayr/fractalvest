import { Router } from "express";
import { db, depositsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { createInvoice, verifyIpnSignature, NowPaymentsError } from "../lib/nowpayments";
import { logger } from "../lib/logger";

const router = Router();

function appBaseUrl(): string {
  const base = process.env.APP_BASE_URL;
  if (!base) {
    throw new Error("APP_BASE_URL must be set to accept crypto deposits");
  }
  return base.replace(/\/$/, "");
}

router.post("/payments/deposits", requireAuth, async (req, res, next): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { amount } = req.body;

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 10) {
      res.status(400).json({ error: "Amount must be a number of at least $10" });
      return;
    }

    const orderId = `fv_${crypto.randomUUID()}`;
    const base = appBaseUrl();

    const invoice = await createInvoice({
      priceAmount: amount,
      priceCurrency: "usd",
      orderId,
      orderDescription: `FractionalVest wallet deposit (${orderId})`,
      ipnCallbackUrl: `${base}/api/payments/nowpayments/ipn`,
      successUrl: `${base}/settings?deposit=success`,
      cancelUrl: `${base}/settings?deposit=cancelled`,
    });

    const [deposit] = await db.insert(depositsTable).values({
      userId,
      provider: "nowpayments",
      providerPaymentId: invoice.id,
      orderId,
      amount: String(amount),
      currency: "usd",
      status: "waiting",
      invoiceUrl: invoice.invoice_url,
    }).returning();

    res.status(201).json(formatDeposit(deposit));
  } catch (err) {
    if (err instanceof NowPaymentsError) {
      logger.error({ status: err.status, body: err.body }, "NOWPayments invoice creation failed");
      res.status(502).json({ error: "Payment provider is currently unavailable" });
      return;
    }
    next(err);
  }
});

router.get("/payments/deposits", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;

  const deposits = await db.select().from(depositsTable)
    .where(eq(depositsTable.userId, userId))
    .orderBy(desc(depositsTable.createdAt))
    .limit(20);

  res.json(deposits.map(formatDeposit));
});

router.get("/payments/deposits/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user!.userId;

  const [deposit] = await db.select().from(depositsTable)
    .where(and(eq(depositsTable.id, raw), eq(depositsTable.userId, userId)));

  if (!deposit) {
    res.status(404).json({ error: "Deposit not found" });
    return;
  }

  res.json(formatDeposit(deposit));
});

// NOWPayments IPN webhook — not authenticated with a JWT; instead the request
// body is verified against the x-nowpayments-sig HMAC signature header.
router.post("/payments/nowpayments/ipn", async (req, res, next): Promise<void> => {
  try {
    const signature = req.header("x-nowpayments-sig");
    if (!verifyIpnSignature(req.body, signature)) {
      logger.warn("Rejected NOWPayments IPN with invalid signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const { order_id, payment_id, payment_status, pay_currency } = req.body ?? {};

    if (!order_id || !payment_status) {
      res.status(400).json({ error: "Malformed IPN payload" });
      return;
    }

    const [deposit] = await db.select().from(depositsTable).where(eq(depositsTable.orderId, order_id));
    if (!deposit) {
      logger.warn({ order_id }, "Received NOWPayments IPN for unknown order");
      res.status(200).json({ received: true });
      return;
    }

    await db.update(depositsTable)
      .set({
        status: payment_status,
        providerPaymentId: payment_id ? String(payment_id) : deposit.providerPaymentId,
        payCurrency: pay_currency ?? deposit.payCurrency,
      })
      .where(eq(depositsTable.id, deposit.id));

    if (payment_status === "finished" && !deposit.creditedAt) {
      // Guard against double-crediting on duplicate/retried IPN deliveries.
      const [claimed] = await db.update(depositsTable)
        .set({ creditedAt: new Date() })
        .where(and(eq(depositsTable.id, deposit.id), isNull(depositsTable.creditedAt)))
        .returning();

      if (claimed) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, deposit.userId));
        if (user) {
          const newBalance = parseFloat(user.walletBalance) + parseFloat(deposit.amount);
          await db.update(usersTable).set({ walletBalance: String(newBalance) }).where(eq(usersTable.id, user.id));

          await db.insert(notificationsTable).values({
            userId: user.id,
            type: "transaction",
            title: "Deposit Confirmed",
            message: `Your deposit of $${parseFloat(deposit.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })} has been credited to your wallet.`,
            read: false,
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

function formatDeposit(deposit: typeof depositsTable.$inferSelect) {
  return {
    id: deposit.id,
    amount: parseFloat(deposit.amount),
    currency: deposit.currency,
    payCurrency: deposit.payCurrency,
    status: deposit.status,
    invoiceUrl: deposit.invoiceUrl,
    createdAt: deposit.createdAt,
  };
}

export default router;
