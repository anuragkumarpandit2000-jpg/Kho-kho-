export interface DailyEntry {
  uid: string;
  name: string;
  date: string;
  running: number;
  sprintRounds: number;
  skillPracticed: string;
  matchPlayed: boolean;
  foulsCommitted: number;
  energyLevel: number;
  sleepHours: number;
  exercise: string;
  exerciseDuration: number;
  practiceAtHome: boolean;
  notes: string;
  dailyScore: number;
  createdAt: unknown;
}

export function calculateDailyScore(entry: Omit<DailyEntry, "dailyScore" | "uid" | "name" | "date" | "createdAt">): number {
  let score = 0;
  if (entry.running > 0) score += 5;
  if (entry.sprintRounds > 0) score += 5;
  if (entry.skillPracticed.trim().length > 0) score += 5;
  if (entry.matchPlayed) score += 5;
  if (entry.practiceAtHome) score += 5;
  if (entry.exercise.trim().length > 0) score += 5;
  if (entry.energyLevel >= 7) score += 5;
  if (entry.sleepHours >= 7) score += 5;
  return score;
}

export function getMotivationalMessage(score: number): string {
  if (score >= 35) return "🔥 Incredible! You're on fire today! Keep pushing!";
  if (score >= 25) return "💪 Great job! You're making solid progress!";
  if (score >= 15) return "👍 Good effort! Push a little harder tomorrow!";
  if (score >= 5) return "📈 Keep going! Every step counts!";
  return "🌱 Start your training — small steps lead to big wins!";
}
