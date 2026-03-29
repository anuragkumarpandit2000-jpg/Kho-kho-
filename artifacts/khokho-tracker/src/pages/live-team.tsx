import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Timer, Dumbbell, Flame, Trophy, Activity, RefreshCw, ChevronRight, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PublicPlayer {
  id: string;
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

interface TrainingLog {
  id: string;
  date: string;
  drillType: string;
  durationMinutes: number;
  energyLevel: string;
  notes: string;
}

interface SpeedEntry {
  id: string;
  date: string;
  timeInSeconds: number;
  notes: string;
}

interface PlayerDetail {
  player: PublicPlayer & { createdAt: string };
  trainingLogs: TrainingLog[];
  speedEntries: SpeedEntry[];
}

function speedLabel(s: number | null) {
  if (s === null) return "—";
  return `${s.toFixed(2)}s`;
}

function energyColor(e: string | null) {
  if (!e) return "bg-muted text-muted-foreground";
  const m: Record<string, string> = {
    High: "bg-green-500/20 text-green-600 dark:text-green-400",
    Medium: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    Low: "bg-red-500/20 text-red-600 dark:text-red-400",
  };
  return m[e] ?? "bg-muted text-muted-foreground";
}

function roleColor(role: string) {
  const m: Record<string, string> = {
    Runner: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    Chaser: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
    Coach: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  };
  return m[role] ?? "bg-muted text-muted-foreground";
}

export default function LiveTeam() {
  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function fetchPlayers() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/players");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setPlayers(data);
    } catch {
      setError("Could not load team data. Make sure Team Tracker is running.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/public/players/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => { fetchPlayers(); }, []);

  useEffect(() => {
    if (selected) fetchDetail(selected);
    else setDetail(null);
  }, [selected]);

  if (selected) {
    const player = players.find(p => p.id === selected);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Team
          </Button>
        </div>

        {player && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
                {player.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{player.displayName}</h2>
                  {player.isCoach && <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-0">Coach</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`border-0 ${roleColor(player.role)}`}>{player.role}</Badge>
                  {player.specialSkill && <Badge className="border-0 bg-muted text-muted-foreground">{player.specialSkill}</Badge>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Best 80m Sprint", value: speedLabel(player.bestSpeedTime), icon: Timer, color: "text-orange-500" },
                { label: "Training Days", value: String(player.totalTrainingDays), icon: Dumbbell, color: "text-blue-500" },
                { label: "Current Streak", value: `${player.trainingStreakDays}d`, icon: Flame, color: "text-red-500" },
                { label: "Energy", value: player.latestEnergyLevel ?? "—", icon: Activity, color: "text-green-500" },
              ].map(s => (
                <Card key={s.label} className="border-border/50">
                  <CardContent className="pt-4">
                    <div className={`mb-1 ${s.color}`}><s.icon className="w-5 h-5" /></div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {detailLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : detail ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Timer className="w-4 h-4 text-orange-500" /> Speed History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detail.speedEntries.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No speed entries yet</p>
                ) : (
                  <div className="space-y-2">
                    {[...detail.speedEntries].reverse().slice(0, 10).map((e, i) => (
                      <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{e.date}</p>
                          {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${i === 0 ? "text-orange-500" : ""}`}>{e.timeInSeconds.toFixed(2)}s</span>
                          {i === 0 && detail.speedEntries.length > 1 && (
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="w-4 h-4 text-blue-500" /> Training Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detail.trainingLogs.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No training logs yet</p>
                ) : (
                  <div className="space-y-2">
                    {detail.trainingLogs.slice(0, 10).map(log => (
                      <div key={log.id} className="py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{log.date}</p>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${energyColor(log.energyLevel)}`}>{log.energyLevel}</span>
                            <span className="text-xs text-muted-foreground">{log.durationMinutes}min</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{log.drillType}{log.notes ? ` — ${log.notes}` : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Team</h1>
          <p className="text-muted-foreground mt-1">All players from Kho-Kho Team Tracker — live data</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPlayers} disabled={loading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium mb-1">{error}</p>
            <p className="text-muted-foreground text-sm">Sign up players in the Team Tracker app, then refresh.</p>
          </CardContent>
        </Card>
      ) : players.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">No players yet</p>
          <p className="text-sm mt-1">Ask players to sign up in Kho-Kho Team Tracker</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelected(p.id)}
                >
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                          {p.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{p.displayName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(p.role)}`}>{p.role}</span>
                            {p.isCoach && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium">Coach</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="text-center p-2 bg-muted/40 rounded-lg">
                        <p className="text-sm font-bold text-orange-500">{speedLabel(p.bestSpeedTime)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Best Speed</p>
                      </div>
                      <div className="text-center p-2 bg-muted/40 rounded-lg">
                        <p className="text-sm font-bold text-blue-500">{p.totalTrainingDays}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Sessions</p>
                      </div>
                      <div className="text-center p-2 bg-muted/40 rounded-lg">
                        <p className="text-sm font-bold text-red-500">{p.trainingStreakDays}d</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Streak</p>
                      </div>
                    </div>

                    {p.specialSkill && (
                      <p className="text-xs text-muted-foreground mt-3 bg-muted/30 rounded-lg px-2 py-1">
                        <Trophy className="w-3 h-3 inline mr-1 text-yellow-500" />
                        {p.specialSkill}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
