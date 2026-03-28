import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { GetMyProfileResponse, UpdateMyProfileBody, UpdateMyProfileResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/players/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  try {
    const [player] = await db.select().from(playersTable).where(eq(playersTable.userId, userId));
    if (!player) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    const data = GetMyProfileResponse.parse({
      ...player,
      createdAt: player.createdAt.toISOString(),
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to get player profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/players/me", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const userId = req.user.id;

  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    let [player] = await db.select().from(playersTable).where(eq(playersTable.userId, userId));

    if (!player) {
      // Create profile if it doesn't exist yet
      [player] = await db.insert(playersTable).values({
        userId,
        displayName: parsed.data.displayName ?? (`${req.user.firstName ?? ""} ${req.user.lastName ?? ""}`.trim() || "Player"),
        role: parsed.data.role ?? "Runner",
        specialSkill: parsed.data.specialSkill ?? "",
        isCoach: false,
      }).returning();
    } else {
      [player] = await db.update(playersTable)
        .set({
          ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),
          ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
          ...(parsed.data.specialSkill !== undefined ? { specialSkill: parsed.data.specialSkill } : {}),
        })
        .where(eq(playersTable.userId, userId))
        .returning();
    }

    const data = UpdateMyProfileResponse.parse({
      ...player,
      createdAt: player.createdAt.toISOString(),
    });
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Failed to update player profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
