import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/firebase";
import { analyzePlayer, generateSuggestions, identifyBestPerformer, identifyWeakPerformer } from "@/lib/analysis";
import type { DailyEntry } from "@/lib/points";
import type { PlayerStats } from "@/lib/analysis";
import { motion } from "framer-motion";
import { Shield, Users, TrendingUp, AlertTriangle, Star, ChevronDown, ChevronUp } from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface FirestoreUser { uid: string; name: string; totalScore: number; email: string; }

export default function CoachDashboard() {
  const [players, setPlayers] = useState<FirestoreUser[]>([]);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [userSnap, trainSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), orderBy("totalScore", "desc"))),
        getDocs(query(collection(db, "training"), orderBy("date", "desc"))),
      ]);
      const usersData = userSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as FirestoreUser);
      const entriesData = trainSnap.docs.map((d) => d.data() as DailyEntry);
      setPlayers(usersData);
      setAllEntries(entriesData);

      const stats: PlayerStats[] = usersData.map((u) => {
        const pEntries = entriesData.filter((e) => e.uid === u.uid);
        const analysis = analyzePlayer(pEntries);
        return { uid: u.uid, name: u.name, totalScore: u.totalScore, entryCount: pEntries.length, ...analysis };
      });
      setPlayerStats(stats);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}</div>;
  }

  const today = new Date().toISOString().split("T")[0];
  const loggedToday = new Set(allEntries.filter((e) => e.date === today).map((e) => e.uid));
  const skippedToday = players.filter((p) => !loggedToday.has(p.uid));
  const bestPerformer = identifyBestPerformer(playerStats);
  const weakPerformer = identifyWeakPerformer(playerStats);
  const improving = playerStats.filter((p) => p.improving);
  const highFouls = playerStats.filter((p) => p.avgFouls > 3);
  const bestStamina = [...playerStats].sort((a, b) => b.avgRunning - a.avgRunning)[0];

  const leaderboardLabels = players.slice(0, 8).map((p) => p.name.split(" ")[0]);
  const leaderboardScores = players.slice(0, 8).map((p) => p.totalScore);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Shield className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-foreground">Coach Dashboard</h1>
          <p className="text-muted-foreground text-sm">Full team analytics & management</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Players", value: players.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Entries Today", value: loggedToday.size, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Skipped Today", value: skippedToday.length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Improving", value: improving.length, icon: Star, color: "text-primary", bg: "bg-primary/10" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-black text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5 uppercase tracking-wide">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bestPerformer && (
          <div className="bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-2">🥇 Best Performer</p>
            <p className="text-xl font-black text-foreground">{bestPerformer.name}</p>
            <p className="text-muted-foreground text-sm mt-1">{bestPerformer.totalScore} total points • {bestPerformer.consistency}% consistency</p>
          </div>
        )}
        {weakPerformer && (
          <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-red-500 mb-2">⚠️ Needs Attention</p>
            <p className="text-xl font-black text-foreground">{weakPerformer.name}</p>
            <p className="text-muted-foreground text-sm mt-1">{weakPerformer.totalScore} total points • {weakPerformer.entryCount} entries</p>
          </div>
        )}
        {bestStamina && (
          <div className="bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-green-500 mb-2">💪 Best Stamina</p>
            <p className="text-xl font-black text-foreground">{bestStamina.name}</p>
            <p className="text-muted-foreground text-sm mt-1">Avg {bestStamina.avgRunning.toFixed(0)} min/session running</p>
          </div>
        )}
      </div>

      {skippedToday.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <p className="font-black text-red-500 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Skipped Training Today</p>
          <div className="flex flex-wrap gap-2">
            {skippedToday.map((p) => (
              <span key={p.uid} className="bg-red-500/10 text-red-500 text-sm font-bold px-3 py-1 rounded-full">{p.name}</span>
            ))}
          </div>
        </div>
      )}

      {highFouls.length > 0 && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5">
          <p className="font-black text-orange-500 mb-3">🚨 High Foul Rate Players</p>
          <div className="flex flex-wrap gap-2">
            {highFouls.map((p) => (
              <span key={p.uid} className="bg-orange-500/10 text-orange-500 text-sm font-bold px-3 py-1 rounded-full">
                {p.name} ({p.avgFouls.toFixed(1)} avg fouls)
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <h3 className="font-black text-foreground mb-4">📊 Team Score Chart</h3>
        <Bar
          data={{
            labels: leaderboardLabels,
            datasets: [{
              label: "Total Score",
              data: leaderboardScores,
              backgroundColor: "hsl(220, 90%, 60%, 0.7)",
              borderRadius: 8,
            }],
          }}
          options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }}
        />
      </div>

      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-black text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> All Players</h3>
        </div>
        <div className="divide-y divide-border/30">
          {playerStats.map((p, i) => {
            const isExpanded = expandedPlayer === p.uid;
            const playerEntries = allEntries.filter((e) => e.uid === p.uid);
            const suggestions = generateSuggestions(p);
            return (
              <div key={p.uid}>
                <button
                  onClick={() => setExpandedPlayer(isExpanded ? null : p.uid)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="font-bold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.entryCount} entries • {p.consistency}% consistency {p.improving ? "• 📈 Improving" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-black text-primary">{p.totalScore} pts</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-6 pb-5 bg-secondary/10 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                      {[
                        { label: "Avg Running", value: `${p.avgRunning.toFixed(0)} min` },
                        { label: "Avg Sprints", value: p.avgSprints.toFixed(1) },
                        { label: "Avg Sleep", value: `${p.avgSleep.toFixed(1)} hrs` },
                        { label: "Avg Fouls", value: p.avgFouls.toFixed(1) },
                      ].map((s) => (
                        <div key={s.label} className="bg-card rounded-xl p-3 text-center border border-border/30">
                          <p className="text-base font-black text-foreground">{s.value}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Smart Suggestions</p>
                      <ul className="space-y-1">
                        {suggestions.map((s, si) => (
                          <li key={si} className="text-sm text-muted-foreground bg-card rounded-lg px-3 py-2 border border-border/30">{s}</li>
                        ))}
                      </ul>
                    </div>
                    {playerEntries.length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Recent Entries</p>
                        <div className="space-y-1">
                          {playerEntries.slice(0, 5).map((e) => (
                            <div key={e.date} className="flex items-center justify-between bg-card rounded-lg px-3 py-2 text-sm border border-border/30">
                              <span className="text-muted-foreground">{e.date}</span>
                              <div className="flex gap-4 text-xs text-muted-foreground">
                                <span>Run: {e.running}m</span>
                                <span>Sprints: {e.sprintRounds}</span>
                                <span>Fouls: {e.foulsCommitted}</span>
                                <span className="text-primary font-black">+{e.dailyScore}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
