import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, trainingLogsTable, speedEntriesTable } from "@workspace/db/schema";
import { eq, desc, asc, gte } from "drizzle-orm";

const router: IRouter = Router();

async function requireCoach(req: any, res: any): Promise<boolean> {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, req.user.id));
  if (!player?.isCoach) {
    res.status(403).json({ error: "Coach access required" });
    return false;
  }
  return true;
}

router.get("/coach/players", async (req, res) => {
  if (!(await requireCoach(req, res))) return;

  try {
    const players = await db.select().from(playersTable).orderBy(asc(playersTable.displayName));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

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

      // Calculate streak (consecutive days with training)
      const allLogs = await db.select({ date: trainingLogsTable.date }).from(trainingLogsTable)
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
        userId: p.userId,
        displayName: p.displayName,
        role: p.role,
        specialSkill: p.specialSkill,
        isCoach: p.isCoach,
        createdAt: p.createdAt.toISOString(),
        lastTrainingDate: lastLog?.date ?? null,
        trainingStreakDays: streak,
        bestSpeedTime: bestSpeed,
        latestEnergyLevel: lastLog ? (await db.select({ energyLevel: trainingLogsTable.energyLevel })
          .from(trainingLogsTable)
          .where(eq(trainingLogsTable.playerId, p.id))
          .orderBy(desc(trainingLogsTable.date))
          .limit(1))[0]?.energyLevel ?? null : null,
      };
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get all players");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coach/players/:playerId/training", async (req, res) => {
  if (!(await requireCoach(req, res))) return;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const logs = await db.select().from(trainingLogsTable)
      .where(eq(trainingLogsTable.playerId, req.params.playerId))
      .orderBy(desc(trainingLogsTable.date));

    res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to get player training");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coach/players/:playerId/speed", async (req, res) => {
  if (!(await requireCoach(req, res))) return;

  try {
    const entries = await db.select().from(speedEntriesTable)
      .where(eq(speedEntriesTable.playerId, req.params.playerId))
      .orderBy(asc(speedEntriesTable.date));

    res.json(entries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })));
  } catch (err) {
    req.log.error({ err }, "Failed to get player speed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coach/leaderboard", async (req, res) => {
  if (!(await requireCoach(req, res))) return;

  try {
    const players = await db.select().from(playersTable).where(eq(playersTable.isCoach, false));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split("T")[0];

    const entries = await Promise.all(players.map(async (p) => {
      const speedEntries = await db.select().from(speedEntriesTable)
        .where(eq(speedEntriesTable.playerId, p.id))
        .orderBy(asc(speedEntriesTable.date));

      const trainingCount = (await db.select({ date: trainingLogsTable.date })
        .from(trainingLogsTable)
        .where(eq(trainingLogsTable.playerId, p.id))).length;

      const bestSpeed = speedEntries.length > 0
        ? Math.min(...speedEntries.map(e => e.timeInSeconds))
        : null;

      const consistencyScore = Math.min(100, Math.round((trainingCount / 30) * 100));

      return {
        playerId: p.id,
        displayName: p.displayName,
        role: p.role,
        speedScore: bestSpeed,
        consistencyScore,
        totalTrainingDays: trainingCount,
      };
    }));

    const speedLeaderboard = [...entries]
      .filter(e => e.speedScore !== null)
      .sort((a, b) => (a.speedScore ?? Infinity) - (b.speedScore ?? Infinity));

    const consistencyLeaderboard = [...entries]
      .sort((a, b) => b.consistencyScore - a.consistencyScore);

    res.json({ speed: speedLeaderboard, consistency: consistencyLeaderboard });
  } catch (err) {
    req.log.error({ err }, "Failed to get leaderboard");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
