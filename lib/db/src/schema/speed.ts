import { pgTable, text, real, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const speedEntriesTable = pgTable("speed_entries", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  playerId: text("player_id").notNull(),
  date: date("date").notNull(),
  timeInSeconds: real("time_in_seconds").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSpeedEntrySchema = createInsertSchema(speedEntriesTable).omit({ id: true, createdAt: true });
export type InsertSpeedEntry = z.infer<typeof insertSpeedEntrySchema>;
export type SpeedEntry = typeof speedEntriesTable.$inferSelect;
