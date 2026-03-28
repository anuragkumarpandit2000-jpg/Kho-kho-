import { pgTable, text, integer, boolean, real, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingLogsTable = pgTable("training_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  playerId: text("player_id").notNull(),
  date: date("date").notNull(),
  runningMinutes: integer("running_minutes").notNull().default(0),
  sprintRounds: integer("sprint_rounds").notNull().default(0),
  skillPracticed: boolean("skill_practiced").notNull().default(false),
  skillName: text("skill_name"),
  matchPlayed: boolean("match_played").notNull().default(false),
  foulsCommitted: integer("fouls_committed").notNull().default(0),
  energyLevel: integer("energy_level").notNull().default(5),
  sleepHours: real("sleep_hours").notNull().default(7),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrainingLogSchema = createInsertSchema(trainingLogsTable).omit({ id: true, createdAt: true });
export type InsertTrainingLog = z.infer<typeof insertTrainingLogSchema>;
export type TrainingLog = typeof trainingLogsTable.$inferSelect;
