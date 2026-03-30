import { useEffect, useState, useCallback } from "react";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { analyzePlayer, generateSuggestions } from "@/lib/analysis";
import { getMotivationalMessage } from "@/lib/points";
import type { DailyEntry } from "@/lib/points";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Activity, Trophy, Zap, ClipboardList, TrendingUp, Star, Trash2, RefreshCw } from "lucide-react";

interface EntryWithId extends DailyEntry { docId: string; }

export default function PlayerDashboard() {
  const { user, refreshUser } = useAuth();
  const [entries, setEntries] = useState<EntryWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMsg, setDeleteMsg] = useState("");

  const loadEntries = useCallback(async () => {
    if (!user) return;
    const q = query(collection(db, "training"), where("uid", "==", user.uid));
    const snap = await getDocs(q);
    const all = snap.docs
      .map((d) => ({ docId: d.id, ...d.data() }) as EntryWithId)
      .sort((a, b) => b.date.localeCompare(a.date));
    setEntries(all);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  async function handleDelete(entry: EntryWithId) {
    if (!user) return;
    setDeletingId(entry.docId);
    await deleteDoc(doc(db, "training", entry.docId));
    const remaining = entries.filter((e) => e.docId !== entry.docId);
    const newScore = remaining.reduce((sum, e) => sum + (e.dailyScore || 0), 0);
    await updateDoc(doc(db, "users", user.uid), { totalScore: newScore });
    await refreshUser();
    setEntries(remaining);
    setDeletingId(null);
    setDeleteMsg("Entry deleted successfully.");
    setTimeout(() => setDeleteMsg(""), 3000);
  }

  const stats = analyzePlayer(entries);
  const suggestions = generateSuggestions(stats);
  const recentEntry = entries[0];
  const todayStr = new Date().toISOString().split("T")[0];
  const loggedToday = recentEntry?.date === todayStr;

  const statCards = [
    { label: "Total Score", value: user?.totalScore ?? 0, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Consistency", value: `${stats.consistency}%`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Avg Energy", value: stats.avgEnergy.toFixed(1), icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Entries Logged", value: entries.length, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-foreground">
            Hey, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-muted-foreground mt-1">{getMotivationalMessage(recentEntry?.dailyScore ?? 0)}</p>
        </div>
        {!loggedToday ? (
          <Link href="/entry">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-6 py-3 bg-primary text-primary-foreground font-black rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-primary/30">
              <ClipboardList className="w-4 h-4" /> Log Today's Training
            </motion.button>
          </Link>
        ) : (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2">
            ✅ Today's entry logged!
          </div>
        )}
      </div>

      {/* Delete success message */}
      <AnimatePresence>
        {deleteMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400">
            ✅ {deleteMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-black text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5 uppercase tracking-wide">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {stats.improving && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center gap-4">
          <Star className="w-8 h-8 text-primary flex-shrink-0" />
          <div>
            <p className="font-black text-foreground">You're Improving! 🚀</p>
            <p className="text-sm text-muted-foreground">Your scores are trending up. Keep going!</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Smart suggestions */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" /> Smart Suggestions
          </h3>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground bg-secondary/50 rounded-xl px-4 py-2.5 font-medium">{s}</li>
            ))}
          </ul>
        </div>

        {/* Performance summary */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
          <h3 className="font-black text-foreground mb-4">📊 Performance Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Avg Running", value: `${stats.avgRunning.toFixed(0)} min` },
              { label: "Avg Sprints", value: stats.avgSprints.toFixed(1) },
              { label: "Avg Sleep", value: `${stats.avgSleep.toFixed(1)} hrs` },
              { label: "Avg Fouls", value: stats.avgFouls.toFixed(1) },
            ].map((item) => (
              <div key={item.label} className="text-center bg-secondary/30 rounded-xl p-4">
                <p className="text-xl font-black text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All entries with delete */}
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-black text-foreground">My Training Entries</h3>
          <span className="ml-auto text-xs text-muted-foreground font-semibold">{entries.length} total</span>
        </div>
        {entries.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">No entries yet.</p>
            <Link href="/entry">
              <button className="mt-3 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition">
                Log First Entry
              </button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {entries.map((entry) => (
              <motion.div
                key={entry.docId}
                layout
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{entry.date}</span>
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>🏃 {entry.running}m</span>
                      <span>⚡ {entry.sprintRounds} sprints</span>
                      <span>😴 {entry.sleepHours}h sleep</span>
                      {entry.matchPlayed && <span>🏟️ Match</span>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.skillPracticed || "No skill logged"}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black text-primary">+{entry.dailyScore} pts</span>
                  <button
                    onClick={() => handleDelete(entry)}
                    disabled={deletingId === entry.docId}
                    title="Delete entry"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition disabled:opacity-40"
                  >
                    {deletingId === entry.docId
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
