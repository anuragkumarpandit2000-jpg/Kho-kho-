import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Trophy,
  Users,
  Star,
  Activity,
  Flame,
  Timer,
  Dumbbell,
  ChevronRight,
  ArrowLeft,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PublicPlayer {
  id: string;
  userId: string;
  displayName: string;
  role: string;
  specialSkill: string;
  isCoach: boolean;
  totalTrainingDays: number;
  trainingStreakDays: number;
  bestSpeedTime: number | null;
  latestEnergyLevel: string | null;
  lastTrainingDate: string | null;
}

interface SpeedEntry {
  id: string;
  date: string;
  timeInSeconds: number;
}

interface PlayerDetail {
  player: PublicPlayer;
  speedEntries: SpeedEntry[];
}

interface ScoredPlayer extends PublicPlayer {
  score: number;
  trend: "improving" | "declining" | "stable";
  breakdown: {
    consistency: number;
    speed: number;
    streak: number;
    energy: number;
  };
  speedTrend: number[];
}

function calcScore(p: PublicPlayer, speedEntries: SpeedEntry[]): ScoredPlayer {
  const consistency = Math.min(40, Math.round((p.totalTrainingDays / 30) * 40));

  let speedScore = 0;
  if (p.bestSpeedTime !== null) {
    const best = p.bestSpeedTime;
    const MIN_SPEED = 9;
    const MAX_SPEED = 20;
    const normalized = Math.max(0, Math.min(1, (MAX_SPEED - best) / (MAX_SPEED - MIN_SPEED)));
    speedScore = Math.round(normalized * 30);
  }

  const streak = Math.min(20, Math.round((p.trainingStreakDays / 30) * 20));

  const energyMap: Record<string, number> = { High: 10, Medium: 6, Low: 3 };
  const energy = p.latestEnergyLevel ? (energyMap[p.latestEnergyLevel] ?? 0) : 0;

  const score = Math.min(100, consistency + speedScore + streak + energy);

  let trend: "improving" | "declining" | "stable" = "stable";
  const recentSpeeds = speedEntries.slice(-6).map((e) => e.timeInSeconds);
  if (recentSpeeds.length >= 3) {
    const first = recentSpeeds.slice(0, Math.ceil(recentSpeeds.length / 2));
    const last = recentSpeeds.slice(Math.floor(recentSpeeds.length / 2));
    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgLast = last.reduce((a, b) => a + b, 0) / last.length;
    if (avgLast < avgFirst - 0.3) trend = "improving";
    else if (avgLast > avgFirst + 0.3) trend = "declining";
  } else if (p.trainingStreakDays >= 3) {
    trend = "improving";
  } else if (p.trainingStreakDays === 0 && p.totalTrainingDays > 0) {
    trend = "declining";
  }

  const speedTrend = speedEntries.slice(-10).map((e) => e.timeInSeconds);

  return {
    ...p,
    score,
    trend,
    breakdown: { consistency, speed: speedScore, streak, energy },
    speedTrend,
  };
}

function trendColor(trend: ScoredPlayer["trend"]) {
  return trend === "improving" ? "#22c55e" : trend === "declining" ? "#ef4444" : "#3b82f6";
}

function trendBg(trend: ScoredPlayer["trend"]) {
  return trend === "improving"
    ? "bg-green-500/15 text-green-500"
    : trend === "declining"
      ? "bg-red-500/15 text-red-500"
      : "bg-blue-500/15 text-blue-500";
}

function TrendIcon({ trend }: { trend: ScoredPlayer["trend"] }) {
  if (trend === "improving") return <TrendingUp className="w-3.5 h-3.5" />;
  if (trend === "declining") return <TrendingDown className="w-3.5 h-3.5" />;
  return <Minus className="w-3.5 h-3.5" />;
}

function scoreGrade(score: number) {
  if (score >= 90) return { label: "Elite", color: "text-yellow-500" };
  if (score >= 75) return { label: "Advanced", color: "text-green-500" };
  if (score >= 55) return { label: "Intermediate", color: "text-blue-500" };
  if (score >= 30) return { label: "Beginner", color: "text-orange-500" };
  return { label: "New", color: "text-muted-foreground" };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScoredPlayer }>;
}

function CustomBarTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const grade = scoreGrade(p.score);
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl min-w-[180px]">
      <p className="font-bold text-foreground mb-1">{p.displayName}</p>
      <p className={`text-2xl font-black mb-2 ${grade.color}`}>{p.score}%</p>
      <p className={`text-xs font-semibold mb-2 ${grade.color}`}>{grade.label}</p>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span>Consistency</span><span className="font-bold text-foreground">{p.breakdown.consistency}/40</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Speed</span><span className="font-bold text-foreground">{p.breakdown.speed}/30</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Streak</span><span className="font-bold text-foreground">{p.breakdown.streak}/20</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Energy</span><span className="font-bold text-foreground">{p.breakdown.energy}/10</span>
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-2 text-xs font-semibold px-2 py-1 rounded-full w-fit ${trendBg(p.trend)}`}>
        <TrendIcon trend={p.trend} />
        {p.trend.charAt(0).toUpperCase() + p.trend.slice(1)}
      </div>
    </div>
  );
}

function PlayerDetailPanel({ player, onClose }: { player: ScoredPlayer; onClose: () => void }) {
  const grade = scoreGrade(player.score);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (player.score / 100) * circumference;

  const speedData = player.speedTrend.map((t, i) => ({ i: i + 1, time: t }));

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="space-y-6"
    >
      <button onClick={onClose} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Team Overview
      </button>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex flex-col items-center gap-3">
          <svg width="120" height="120" className="transform -rotate-90">
            <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="10" fill="none" className="text-muted/30" />
            <circle
              cx="60" cy="60" r="52"
              stroke={trendColor(player.trend)}
              strokeWidth="10" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="-mt-[88px] flex flex-col items-center z-10">
            <span className="text-3xl font-black" style={{ color: trendColor(player.trend) }}>{player.score}%</span>
            <span className={`text-xs font-bold ${grade.color}`}>{grade.label}</span>
          </div>
          <div style={{ marginTop: "52px" }} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-bold">{player.displayName}</h2>
            <Badge className={`border-0 text-xs ${trendBg(player.trend)}`}>
              <TrendIcon trend={player.trend} />
              <span className="ml-1">{player.trend}</span>
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mb-4">{player.role}{player.specialSkill ? ` · ${player.specialSkill}` : ""}</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Consistency", value: player.breakdown.consistency, max: 40, icon: Dumbbell, color: "#3b82f6" },
              { label: "Speed Score", value: player.breakdown.speed, max: 30, icon: Timer, color: "#f97316" },
              { label: "Streak Bonus", value: player.breakdown.streak, max: 20, icon: Flame, color: "#ef4444" },
              { label: "Energy Bonus", value: player.breakdown.energy, max: 10, icon: Activity, color: "#22c55e" },
            ].map(s => (
              <div key={s.label} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                  <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-xs text-muted-foreground">/{s.max}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(s.value / s.max) * 100}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Card className="border-border/40">
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-orange-500">{player.bestSpeedTime ? `${player.bestSpeedTime.toFixed(2)}s` : "—"}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Best 80m Sprint</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-blue-500">{player.totalTrainingDays}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Training Days</p>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="pt-4 pb-3">
            <p className="text-xl font-bold text-red-500">{player.trainingStreakDays}d</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Current Streak</p>
          </CardContent>
        </Card>
      </div>

      {speedData.length > 1 && (
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Timer className="w-4 h-4 text-orange-500" />
              Sprint Speed Trend (last {speedData.length} entries)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
              <Info className="w-3 h-3" /> Lower time = faster runner (improving)
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={speedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="i" tick={{ fontSize: 10 }} stroke="none" />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} stroke="none" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(v: number) => [`${v.toFixed(2)}s`, "Time"]}
                />
                <Line
                  type="monotone" dataKey="time"
                  stroke={trendColor(player.trend)}
                  strokeWidth={2.5} dot={{ r: 4, fill: trendColor(player.trend) }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default function YourLevel() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<ScoredPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const listRes = await fetch("/api/public/players", { credentials: "include" });
      if (!listRes.ok) throw new Error("Failed to load players");
      const list: PublicPlayer[] = await listRes.json();

      const detailed = await Promise.all(
        list.map(async (p) => {
          try {
            const detailRes = await fetch(`/api/public/players/${p.id}`, { credentials: "include" });
            if (!detailRes.ok) return calcScore(p, []);
            const d = await detailRes.json();
            return calcScore(p, d.speedEntries ?? []);
          } catch {
            return calcScore(p, []);
          }
        })
      );

      const sorted = detailed.sort((a, b) => b.score - a.score);
      setPlayers(sorted);
      setLastUpdated(new Date());
    } catch {
      setError("Could not load player data. Make sure you are connected.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const selectedPlayer = players.find((p) => p.id === selected);
  const teamAvg = players.length > 0 ? Math.round(players.reduce((a, b) => a + b.score, 0) / players.length) : 0;
  const topPlayer = players[0] ?? null;
  const myPlayer = players.find((p) => p.displayName === user?.firstName || p.userId === user?.id);

  const chartData = players.map((p) => ({
    ...p,
    name: p.displayName.split(" ")[0],
    fullName: p.displayName,
  }));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight">Your Level</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Performance scores across the team — updated live
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading && players.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading performance data...</p>
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      ) : players.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No players yet</p>
          <p className="text-sm mt-1">Sign up and log training to appear on the leaderboard</p>
        </div>
      ) : selectedPlayer ? (
        <PlayerDetailPanel player={selectedPlayer} onClose={() => setSelected(null)} />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="border-border/40 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs font-bold text-yellow-500 uppercase tracking-wide">Top Performer</span>
                </div>
                <p className="text-xl font-bold truncate">{topPlayer?.displayName ?? "—"}</p>
                <p className="text-3xl font-black text-yellow-500">{topPlayer?.score ?? 0}%</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">Team Average</span>
                </div>
                <p className="text-sm text-muted-foreground mb-0.5">{players.length} players</p>
                <p className="text-3xl font-black text-blue-500">{teamAvg}%</p>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-gradient-to-br from-primary/10 to-violet-500/10 border-primary/20">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">Your Score</span>
                </div>
                {myPlayer ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-0.5">#{players.indexOf(myPlayer) + 1} in team</p>
                    <p className="text-3xl font-black text-primary">{myPlayer.score}%</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-0.5">Not found</p>
                    <p className="text-lg font-bold text-muted-foreground">Set up profile</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-primary" />
                  Team Performance Overview
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-normal">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Improving</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Declining</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Stable</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Click a bar to see detailed breakdown for that player
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }} onClick={(d) => { if (d?.activePayload?.[0]) setSelected(d.activePayload[0].payload.id); }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    stroke="none"
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    stroke="none"
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <ReferenceLine y={teamAvg} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5}
                    label={{ value: `Avg ${teamAvg}%`, position: "insideTopRight", fontSize: 10, fill: "#94a3b8" }}
                  />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60} cursor="pointer">
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={trendColor(entry.trend)}
                        opacity={selected === entry.id ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Player Rank List */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Player Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {players.map((p, rank) => {
                const grade = scoreGrade(p.score);
                const isMe = p.id === myPlayer?.id;
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rank * 0.04 }}
                    onClick={() => setSelected(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group text-left ${isMe ? "ring-1 ring-primary/40 bg-primary/5" : ""}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${rank === 0 ? "bg-yellow-500 text-white" : rank === 1 ? "bg-zinc-400 text-white" : rank === 2 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"}`}>
                      {rank + 1}
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{p.displayName}</span>
                        {isMe && <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">You</Badge>}
                        <span className={`text-[10px] font-bold ${grade.color}`}>{grade.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{p.role}</span>
                        <span className="text-xs text-muted-foreground">{p.totalTrainingDays}d trained</span>
                        {p.trainingStreakDays > 0 && (
                          <span className="text-xs text-red-500 flex items-center gap-0.5">
                            <Flame className="w-3 h-3" />{p.trainingStreakDays}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-lg" style={{ color: trendColor(p.trend) }}>{p.score}%</p>
                        <div className={`flex items-center gap-0.5 text-[10px] font-semibold justify-end ${trendBg(p.trend).split(" ")[1]}`}>
                          <TrendIcon trend={p.trend} />
                          <span>{p.trend}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </motion.button>
                );
              })}
            </CardContent>
          </Card>

          {/* Score Formula Info */}
          <Card className="border-border/30 bg-muted/20">
            <CardContent className="pt-5">
              <div className="flex items-start gap-2 mb-3">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm font-semibold text-muted-foreground">How scores are calculated</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: "Consistency", detail: "Training frequency (last 30 days)", max: "40 pts", color: "#3b82f6" },
                  { label: "Speed", detail: "Best 80m sprint time (normalized)", max: "30 pts", color: "#f97316" },
                  { label: "Streak Bonus", detail: "Consecutive training days", max: "20 pts", color: "#ef4444" },
                  { label: "Energy Bonus", detail: "Latest session energy level", max: "10 pts", color: "#22c55e" },
                ].map(f => (
                  <div key={f.label} className="bg-muted/40 rounded-lg p-2.5">
                    <p className="font-bold mb-0.5" style={{ color: f.color }}>{f.label}</p>
                    <p className="text-muted-foreground leading-relaxed">{f.detail}</p>
                    <p className="font-semibold mt-1" style={{ color: f.color }}>{f.max}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
