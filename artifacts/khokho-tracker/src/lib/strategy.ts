import type { PlayerStats } from "./analysis";

export type PlayerRole = "Chaser" | "Runner" | "Flexible";
export type TeamStrategy = "Aggressive" | "Balanced" | "Defensive";

export function suggestRole(stats: PlayerStats): PlayerRole {
  const isSpeedFocused = stats.avgSprints >= 5 && stats.avgRunning >= 20;
  const isStaminaHigh = stats.avgEnergy >= 7 && stats.avgRunning >= 25;
  if (isSpeedFocused && isStaminaHigh) return "Chaser";
  if (isSpeedFocused && !isStaminaHigh) return "Runner";
  return "Flexible";
}

export function suggestStrategy(players: PlayerStats[]): TeamStrategy {
  if (players.length === 0) return "Balanced";
  const avgScore = players.reduce((s, p) => s + p.totalScore, 0) / players.length;
  const highEnergyCount = players.filter((p) => p.avgEnergy >= 7).length;
  const ratio = highEnergyCount / players.length;
  if (avgScore > 100 && ratio > 0.6) return "Aggressive";
  if (avgScore < 50 || ratio < 0.3) return "Defensive";
  return "Balanced";
}

export function getBestChaser(players: PlayerStats[]): PlayerStats | null {
  const chasers = players.filter((p) => p.avgSprints >= 4 && p.avgRunning >= 20);
  if (chasers.length === 0) return players.reduce((b, p) => (p.avgSprints > b.avgSprints ? p : b), players[0]) || null;
  return chasers.reduce((b, p) => (p.totalScore > b.totalScore ? p : b), chasers[0]);
}

export function getBestRunner(players: PlayerStats[]): PlayerStats | null {
  const runners = players.filter((p) => p.avgEnergy >= 6 && p.consistency >= 50);
  if (runners.length === 0) return players.reduce((b, p) => (p.avgEnergy > b.avgEnergy ? p : b), players[0]) || null;
  return runners.reduce((b, p) => (p.consistency > b.consistency ? p : b), runners[0]);
}

export const STRATEGY_DETAILS: Record<TeamStrategy, { description: string; icon: string; color: string }> = {
  Aggressive: {
    description: "Push hard, chase fast, dominate the field with high-energy players leading every round.",
    icon: "⚔️",
    color: "text-red-500",
  },
  Balanced: {
    description: "Mix speed and stamina. Rotate chasers and runners for consistent pressure.",
    icon: "⚖️",
    color: "text-yellow-500",
  },
  Defensive: {
    description: "Focus on conserving energy, minimising fouls, and strategically wearing down opponents.",
    icon: "🛡️",
    color: "text-blue-500",
  },
};
