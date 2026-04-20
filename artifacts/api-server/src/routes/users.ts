import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, raw));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    kycStatus: user.kycStatus,
    walletBalance: parseFloat(user.walletBalance),
    createdAt: user.createdAt,
  });
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { firstName, lastName, kycStatus } = req.body;

  const updates: Record<string, unknown> = {};
  if (firstName != null) updates.firstName = firstName;
  if (lastName != null) updates.lastName = lastName;
  if (kycStatus != null) updates.kycStatus = kycStatus;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, raw)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    kycStatus: user.kycStatus,
    walletBalance: parseFloat(user.walletBalance),
    createdAt: user.createdAt,
  });
});

export default router;
