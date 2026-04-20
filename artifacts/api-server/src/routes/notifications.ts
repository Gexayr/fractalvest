import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const notes = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt));

  res.json(notes.map(n => ({
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt,
  })));
});

router.patch("/notifications/:id/read", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const userId = req.user!.userId;

  const [note] = await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, raw))
    .returning();

  if (!note) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json({
    id: note.id,
    userId: note.userId,
    type: note.type,
    title: note.title,
    message: note.message,
    read: note.read,
    createdAt: note.createdAt,
  });
});

router.patch("/notifications/read-all", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, userId));

  res.json({ message: "All notifications marked as read" });
});

export default router;
