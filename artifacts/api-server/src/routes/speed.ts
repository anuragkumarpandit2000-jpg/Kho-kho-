import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { speedEntriesTable, playersTable } from "@workspace/db/schema";
import { eq, asc, and, gte } from "drizzle-orm";
import { GetMySpeedEntriesResponse, SubmitSpeedEntryBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/speed", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, req.user.id));
    if (!player) {
      res.json([]);
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const entries = await db.select().from(speedEntriesTable)
      .where(and(eq(speedEntriesTable.playerId, player.id), gte(speedEntriesTable.date, dateStr)))
      .orderBy(asc(speedEntriesTable.date));

    const data = GetMySpeedEntriesResponse.parse(entries.map(e => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })));
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get speed entries");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/speed", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SubmitSpeedEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    let [player] = await db.select().from(playersTable).where(eq(playersTable.userId, req.user.id));
    if (!player) {
      [player] = await db.insert(playersTable).values({
        userId: req.user.id,
        displayName: `${req.user.firstName ?? ""} ${req.user.lastName ?? ""}`.trim() || "Player",
        role: "Runner",
        specialSkill: "",
        isCoach: false,
      }).returning();
    }

    const [entry] = await db.insert(speedEntriesTable).values({
      playerId: player.id,
      date: parsed.data.date,
      timeInSeconds: parsed.data.timeInSeconds,
    }).returning();

    res.status(201).json({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit speed entry");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
