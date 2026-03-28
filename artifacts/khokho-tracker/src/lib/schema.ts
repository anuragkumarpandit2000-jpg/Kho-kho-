import { z } from "zod";

export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["Runner", "Chaser"]),
  specialSkill: z.string().min(1, "Required"),
  strengthLevel: z.coerce.number().min(1).max(10),
  weaknessNotes: z.string().optional(),
  createdAt: z.string(),
});

export type Player = z.infer<typeof playerSchema>;

export const speedEntrySchema = z.object({
  id: z.string(),
  playerId: z.string(),
  date: z.string(),
  timeInSeconds: z.coerce.number().min(5, "Impossible time").max(60, "Too slow"),
});

export type SpeedEntry = z.infer<typeof speedEntrySchema>;

export const trainingLogSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  date: z.string(),
  runningMinutes: z.coerce.number().min(0),
  sprintRounds: z.coerce.number().min(0),
  practiceDuration: z.coerce.number().min(0),
});

export type TrainingLog = z.infer<typeof trainingLogSchema>;

export const matchRecordSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  date: z.string(),
  totalOuts: z.coerce.number().min(0),
  foulsCommitted: z.coerce.number().min(0),
  successfulChases: z.coerce.number().min(0),
});

export type MatchRecord = z.infer<typeof matchRecordSchema>;
