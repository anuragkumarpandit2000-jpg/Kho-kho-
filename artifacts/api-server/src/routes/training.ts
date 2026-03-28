import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trainingLogsTable, playersTable } from "@workspace/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { GetMyTrainingLogsResponse, SubmitTrainingLogBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/training", async (req, res) => {
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

    const logs = await db.select().from(trainingLogsTable)
      .where(and(eq(trainingLogsTable.playerId, player.id), gte(trainingLogsTable.date, dateStr)))
      .orderBy(desc(trainingLogsTable.date));

    const data = GetMyTrainingLogsResponse.parse(logs.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })));
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get training logs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/training", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = SubmitTrainingLogBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    let [player] = await db.select().from(playersTable).where(eq(playersTable.userId, req.user.id));
    if (!player) {
      // Auto-create profile on first submission
      [player] = await db.insert(playersTable).values({
        userId: req.user.id,
        displayName: `${req.user.firstName ?? ""} ${req.user.lastName ?? ""}`.trim() || "Player",
        role: "Runner",
        specialSkill: "",
        isCoach: false,
      }).returning();
    }

    const [log] = await db.insert(trainingLogsTable).values({
      playerId: player.id,
      date: parsed.data.date,
      runningMinutes: parsed.data.runningMinutes,
      sprintRounds: parsed.data.sprintRounds,
      skillPracticed: parsed.data.skillPracticed,
      skillName: parsed.data.skillName ?? null,
      matchPlayed: parsed.data.matchPlayed,
      foulsCommitted: parsed.data.foulsCommitted,
      energyLevel: parsed.data.energyLevel,
      sleepHours: parsed.data.sleepHours,
      notes: parsed.data.notes ?? null,
    }).returning();

    res.status(201).json({
      ...log,
      createdAt: log.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit training log");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
