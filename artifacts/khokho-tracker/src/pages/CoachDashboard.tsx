import { useEffect, useState, useCallback } from "react";
import {
  collection, getDocs, doc, deleteDoc, updateDoc, writeBatch, query, where
} from "firebase/firestore";
import { db } from "@/firebase";
import { analyzePlayer, generateSuggestions, identifyBestPerformer, identifyWeakPerformer } from "@/lib/analysis";
import type { DailyEntry } from "@/lib/points";
import type { PlayerStats } from "@/lib/analysis";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, TrendingUp, AlertTriangle, Star, ChevronDown, ChevronUp,
  Trash2, RefreshCw, Plus, Minus, CheckCircle, RotateCcw
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

interface FirestoreUser { uid: string; name: string; totalScore: number; email: string; specialty?: string; photoBase64?: string; }
interface EntryWithId extends DailyEntry { docId: string; }

export default function CoachDashboard() {
  const [players, setPlayers] = useState<FirestoreUser[]>([]);
  const [allEntries, setAllEntries] = useState<EntryWithId[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<string | null>(null);
  const [savingPoints, setSavingPoints] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const loadData = useCallback(async () => {
    const [userSnap, trainSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "training")),
    ]);
    const usersData = userSnap.docs
      .map((d) => ({ uid: d.id, ...d.data() }) as FirestoreUser)
      .sort((a, b) => b.totalScore - a.totalScore);
    const entriesData = trainSnap.docs
      .map((d) => ({ docId: d.id, ...d.data() }) as EntryWithId)
      .sort((a, b) => b.date.localeCompare(a.date));
    setPlayers(usersData);
    setAllEntries(entriesData);
    const stats: PlayerStats[] = usersData.map((u) => {
      const pEntries = entriesData.filter((e) => e.uid === u.uid);
      const analysis = analyzePlayer(pEntries);
      return { uid: u.uid, name: u.name, totalScore: u.totalScore, entryCount: pEntries.length, ...analysis };
    });
    setPlayerStats(stats);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Delete a single training entry
  async function deleteEntry(entry: EntryWithId) {
    setDeletingEntry(entry.docId);
    await deleteDoc(doc(db, "training", entry.docId));
    const remaining = allEntries.filter((e) => e.docId !== entry.docId);
    const playerRemaining = remaining.filter((e) => e.uid === entry.uid);
    const newScore = playerRemaining.reduce((sum, e) => sum + (e.dailyScore || 0), 0);
    await updateDoc(doc(db, "users", entry.uid), { totalScore: newScore });
    setDeletingEntry(null);
    showFeedback(`✅ Entry deleted. New score: ${newScore} pts`);
    await loadData();
  }

  // Manually set player's total points
  async function applyPoints(uid: string, mode: "set" | "add" | "subtract") {
    const val = parseInt(pointsInput[uid] || "0");
    if (isNaN(val)) return;
    setSavingPoints(uid);
    const player = players.find((p) => p.uid === uid);
    let newScore = val;
    if (mode === "add") newScore = (player?.totalScore || 0) + val;
    if (mode === "subtract") newScore = Math.max(0, (player?.totalScore || 0) - val);
    await updateDoc(doc(db, "users", uid), { totalScore: newScore });
    setSavingPoints(null);
    setPointsInput((prev) => ({ ...prev, [uid]: "" }));
    showFeedback(`✅ ${player?.name}'s points updated to ${newScore}`);
    await loadData();
  }

  // Reset ALL points and delete ALL training entries
  async function resetAll() {
    setResetting(true);
    const batch = writeBatch(db);
    allEntries.forEach((e) => {
      batch.delete(doc(db, "training", e.docId));
    });
    players.forEach((p) => {
      batch.update(doc(db, "users", p.uid), { totalScore: 0 });
    });
    await batch.commit();
    setResetting(false);
    setResetConfirm(false);
    showFeedback("🔄 All points reset to 0. Fresh start!");
    await loadData();
  }

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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Coach Dashboard</h1>
            <p className="text-muted-foreground text-sm">Full team analytics & management</p>
          </div>
        </div>
        {/* Reset Button */}
        {!resetConfirm ? (
          <button
            onClick={() => setResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-sm font-bold hover:bg-red-500/20 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset All Points
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-500 font-bold">Sure? This deletes all data!</span>
            <button
              onClick={resetAll}
              disabled={resetting}
              className="px-3 py-2 bg-red-500 text-white rounded-xl text-sm font-black hover:bg-red-600 transition disabled:opacity-50"
            >
              {resetting ? "Resetting..." : "Yes, Reset"}
            </button>
            <button
              onClick={() => setResetConfirm(false)}
              className="px-3 py-2 bg-secondary rounded-xl text-sm font-bold text-muted-foreground hover:bg-secondary/80 transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-bold text-green-600 dark:text-green-400">{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Cards */}
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

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bestPerformer && (
          <div className="bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-yellow-500 mb-2">🥇 Best Performer</p>
            <p className="text-xl font-black text-foreground">{bestPerformer.name}</p>
            <p className="text-muted-foreground text-sm mt-1">{bestPerformer.totalScore} pts • {bestPerformer.consistency}% consistency</p>
          </div>
        )}
        {weakPerformer && (
          <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-wider text-red-500 mb-2">⚠️ Needs Attention</p>
            <p className="text-xl font-black text-foreground">{weakPerformer.name}</p>
            <p className="text-muted-foreground text-sm mt-1">{weakPerformer.totalScore} pts • {weakPerformer.entryCount} entries</p>
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

      {/* Chart */}
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

      {/* All Players — Full Detail */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border/50">
          <h3 className="font-black text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> All Players — Live Data</h3>
        </div>
        <div className="divide-y divide-border/30">
          {playerStats.map((p, i) => {
            const isExpanded = expandedPlayer === p.uid;
            const playerEntries = allEntries.filter((e) => e.uid === p.uid);
            const suggestions = generateSuggestions(p);
            const playerInfo = players.find((pl) => pl.uid === p.uid);
            return (
              <div key={p.uid}>
                <button
                  onClick={() => setExpandedPlayer(isExpanded ? null : p.uid)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center">{i + 1}</span>
                    {playerInfo?.photoBase64 ? (
                      <img src={playerInfo.photoBase64} alt={p.name} className="w-9 h-9 rounded-full object-cover border-2 border-border/50" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-black text-sm">{p.name[0]}</span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground">{p.name}</p>
                        {playerInfo?.specialty && (
                          <span className="text-xs bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-bold px-2 py-0.5 rounded-full">
                            ⭐ {playerInfo.specialty}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.entryCount} entries • {p.consistency}% consistency {p.improving ? "• 📈 Improving" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-primary">{p.totalScore} pts</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 bg-secondary/10 space-y-5 pt-3">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

                        {/* Points Control */}
                        <div className="bg-card border border-border/40 rounded-xl p-4 space-y-3">
                          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Coach Points Control
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="number"
                              min="0"
                              value={pointsInput[p.uid] || ""}
                              onChange={(e) => setPointsInput((prev) => ({ ...prev, [p.uid]: e.target.value }))}
                              placeholder="Points value"
                              className="flex-1 min-w-[100px] bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                              onClick={() => applyPoints(p.uid, "add")}
                              disabled={savingPoints === p.uid}
                              className="flex items-center gap-1 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-sm font-bold hover:bg-green-500/20 transition"
                            >
                              <Plus className="w-4 h-4" /> Add
                            </button>
                            <button
                              onClick={() => applyPoints(p.uid, "subtract")}
                              disabled={savingPoints === p.uid}
                              className="flex items-center gap-1 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500/20 transition"
                            >
                              <Minus className="w-4 h-4" /> Remove
                            </button>
                            <button
                              onClick={() => applyPoints(p.uid, "set")}
                              disabled={savingPoints === p.uid}
                              className="flex items-center gap-1 px-3 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition"
                            >
                              <RefreshCw className="w-4 h-4" /> Set
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground">Current: <strong>{p.totalScore} pts</strong> — Add/Remove adjusts, Set overrides directly.</p>
                        </div>

                        {/* Suggestions */}
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Smart Suggestions</p>
                          <ul className="space-y-1">
                            {suggestions.map((s, si) => (
                              <li key={si} className="text-sm text-muted-foreground bg-card rounded-lg px-3 py-2 border border-border/30">{s}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Training Entries with Delete */}
                        {playerEntries.length > 0 && (
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">All Training Entries</p>
                            <div className="space-y-1.5">
                              {playerEntries.map((e) => (
                                <div key={e.docId} className="flex items-center justify-between bg-card rounded-lg px-3 py-2.5 text-sm border border-border/30 gap-2">
                                  <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                                    <span className="text-muted-foreground font-semibold flex-shrink-0">{e.date}</span>
                                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                                      <span>Run: {e.running}m</span>
                                      <span>Sprints: {e.sprintRounds}</span>
                                      <span>Sleep: {e.sleepHours}h</span>
                                      <span>Fouls: {e.foulsCommitted}</span>
                                    </div>
                                    <span className="text-primary font-black text-xs">+{e.dailyScore} pts</span>
                                  </div>
                                  <button
                                    onClick={() => deleteEntry(e)}
                                    disabled={deletingEntry === e.docId}
                                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition disabled:opacity-40"
                                    title="Delete this entry"
                                  >
                                    {deletingEntry === e.docId ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
