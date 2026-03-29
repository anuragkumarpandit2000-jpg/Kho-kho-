import type { DailyEntry } from "./points";

export interface PlayerStats {
  uid: string;
  name: string;
  totalScore: number;
  avgEnergy: number;
  avgSleep: number;
  avgRunning: number;
  avgSprints: number;
  avgFouls: number;
  entryCount: number;
  consistency: number;
  improving: boolean;
}

export function analyzePlayer(entries: DailyEntry[]): {
  avgEnergy: number;
  avgSleep: number;
  avgRunning: number;
  avgSprints: number;
  avgFouls: number;
  consistency: number;
  improving: boolean;
} {
  if (entries.length === 0) {
    return { avgEnergy: 0, avgSleep: 0, avgRunning: 0, avgSprints: 0, avgFouls: 0, consistency: 0, improving: false };
  }
  const n = entries.length;
  const avgEnergy = entries.reduce((s, e) => s + e.energyLevel, 0) / n;
  const avgSleep = entries.reduce((s, e) => s + e.sleepHours, 0) / n;
  const avgRunning = entries.reduce((s, e) => s + e.running, 0) / n;
  const avgSprints = entries.reduce((s, e) => s + e.sprintRounds, 0) / n;
  const avgFouls = entries.reduce((s, e) => s + e.foulsCommitted, 0) / n;
  const daysInLastMonth = 30;
  const consistency = Math.min(100, Math.round((n / daysInLastMonth) * 100));
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let improving = false;
  if (sorted.length >= 4) {
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half).reduce((s, e) => s + e.dailyScore, 0) / half;
    const secondHalf = sorted.slice(half).reduce((s, e) => s + e.dailyScore, 0) / (sorted.length - half);
    improving = secondHalf > firstHalf;
  }
  return { avgEnergy, avgSleep, avgRunning, avgSprints, avgFouls, consistency, improving };
}

export function generateSuggestions(stats: ReturnType<typeof analyzePlayer>): string[] {
  const suggestions: string[] = [];
  if (stats.avgRunning < 15) suggestions.push("⚡ Improve stamina — increase daily running minutes.");
  if (stats.avgFouls > 3) suggestions.push("🚨 Work on discipline — reduce fouls in matches.");
  if (stats.consistency >= 80 && stats.improving) suggestions.push("🌟 Excellent progress! You're consistently improving.");
  if (stats.consistency < 50) suggestions.push("📅 Low consistency — try to log daily training every day.");
  if (stats.avgSleep < 7) suggestions.push("😴 Get more sleep — aim for 7–8 hours for better recovery.");
  if (stats.avgEnergy < 5) suggestions.push("🔋 Energy is low — focus on nutrition and rest.");
  if (stats.avgSprints < 3) suggestions.push("🏃 Add more sprint rounds to build explosive speed.");
  if (suggestions.length === 0) suggestions.push("✅ Great all-round performance! Keep maintaining this level.");
  return suggestions;
}

export function identifyBestPerformer(players: PlayerStats[]): PlayerStats | null {
  if (players.length === 0) return null;
  return players.reduce((best, p) => (p.totalScore > best.totalScore ? p : best), players[0]);
}

export function identifyWeakPerformer(players: PlayerStats[]): PlayerStats | null {
  if (players.length === 0) return null;
  return players.reduce((worst, p) => (p.totalScore < worst.totalScore ? p : worst), players[0]);
}
