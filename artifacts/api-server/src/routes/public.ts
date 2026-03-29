import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, trainingLogsTable, speedEntriesTable } from "@workspace/db/schema";
import { eq, desc, asc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/public/players", async (req, res) => {
  try {
    const players = await db.select().from(playersTable).orderBy(asc(playersTable.displayName));

    const result = await Promise.all(players.map(async (p) => {
      const [lastLog] = await db.select().from(trainingLogsTable)
        .where(eq(trainingLogsTable.playerId, p.id))
        .orderBy(desc(trainingLogsTable.date))
        .limit(1);

      const speedEntries = await db.select().from(speedEntriesTable)
        .where(eq(speedEntriesTable.playerId, p.id))
        .orderBy(asc(speedEntriesTable.date));

      const bestSpeed = speedEntries.length > 0
        ? Math.min(...speedEntries.map(e => e.timeInSeconds))
        : null;

      const allLogs = await db.select().from(trainingLogsTable)
        .where(eq(trainingLogsTable.playerId, p.id))
        .orderBy(desc(trainingLogsTable.date));

      let streak = 0;
      const today = new Date();
      for (let i = 0; i < allLogs.length; i++) {
        const logDate = new Date(allLogs[i].date);
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        if (logDate.toISOString().split("T")[0] === expectedDate.toISOString().split("T")[0]) {
          streak++;
        } else {
          break;
        }
      }

      return {
        id: p.id,
        displayName: p.displayName,
        role: p.role,
        specialSkill: p.specialSkill,
        isCoach: p.isCoach,
        createdAt: p.createdAt.toISOString(),
        lastTrainingDate: lastLog?.date ?? null,
        totalTrainingDays: allLogs.length,
        trainingStreakDays: streak,
        bestSpeedTime: bestSpeed,
        latestEnergyLevel: lastLog?.energyLevel ?? null,
      };
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get public players");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/public/players/:playerId", async (req, res) => {
  try {
    const [player] = await db.select().from(playersTable)
      .where(eq(playersTable.id, req.params.playerId));

    if (!player) {
      res.status(404).json({ error: "Player not found" });
      return;
    }

    const trainingLogs = await db.select().from(trainingLogsTable)
      .where(eq(trainingLogsTable.playerId, player.id))
      .orderBy(desc(trainingLogsTable.date));

    const speedEntries = await db.select().from(speedEntriesTable)
      .where(eq(speedEntriesTable.playerId, player.id))
      .orderBy(asc(speedEntriesTable.date));

    const bestSpeed = speedEntries.length > 0
      ? Math.min(...speedEntries.map(e => e.timeInSeconds))
      : null;

    const totalTraining = trainingLogs.length;
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < trainingLogs.length; i++) {
      const logDate = new Date(trainingLogs[i].date);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      if (logDate.toISOString().split("T")[0] === expectedDate.toISOString().split("T")[0]) {
        streak++;
      } else {
        break;
      }
    }

    res.json({
      player: {
        id: player.id,
        displayName: player.displayName,
        role: player.role,
        specialSkill: player.specialSkill,
        isCoach: player.isCoach,
        createdAt: player.createdAt.toISOString(),
        totalTrainingDays: totalTraining,
        trainingStreakDays: streak,
        bestSpeedTime: bestSpeed,
      },
      trainingLogs: trainingLogs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })),
      speedEntries: speedEntries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get public player detail");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
