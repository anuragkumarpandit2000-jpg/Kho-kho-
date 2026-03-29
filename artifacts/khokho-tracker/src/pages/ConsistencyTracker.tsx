import { useEffect, useState, useCallback } from "react";
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { DailyEntry } from "@/lib/points";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, CalendarDays, TrendingUp, CheckCircle, XCircle, Flame } from "lucide-react";

const YEAR = 2026;
const MONTH = 4; // April
const TOTAL_DAYS = 30;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateKey(day: number) {
  return `${YEAR}-${pad(MONTH)}-${pad(day)}`;
}

type DayStatus = "completed" | "missed" | "";

interface DayData {
  status: DayStatus;
  isGood: boolean;
  hasEntry: boolean;
}

function isGoodPerformance(entry: DailyEntry | undefined): boolean {
  if (!entry) return false;
  return entry.running >= 10 && entry.sprintRounds >= 4 && entry.skillPracticed.trim().length > 0;
}

function getConsistencyMsg(pct: number) {
  if (pct >= 80) return { text: "Excellent consistency 🔥", color: "text-green-500", bg: "bg-green-500/10 border-green-500/20" };
  if (pct >= 50) return { text: "Good, keep improving 👍", color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/20" };
  return { text: "Needs improvement ⚠️", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" };
}

function DayBox({
  day, data, isToday, isFuture, onClick,
}: {
  day: number; data: DayData; isToday: boolean; isFuture: boolean; onClick: () => void;
}) {
  const isTrophy = day === 30;

  let bgClass = "bg-secondary/40 border-border/40 hover:border-border";
  let textClass = "text-muted-foreground";
  let icon = null;

  if (data.status === "completed") {
    bgClass = "bg-green-500/15 border-green-500/40 shadow-green-500/10 shadow-md";
    textClass = "text-green-600 dark:text-green-400";
    icon = <CheckCircle className="w-5 h-5 text-green-500" />;
  } else if (data.status === "missed") {
    bgClass = "bg-red-500/15 border-red-500/40 shadow-red-500/10 shadow-md";
    textClass = "text-red-500";
    icon = <XCircle className="w-5 h-5 text-red-500" />;
  }

  if (isToday && data.status === "") {
    bgClass = "bg-primary/15 border-primary/50 ring-2 ring-primary/30";
    textClass = "text-primary font-black";
  }

  return (
    <motion.button
      whileHover={!isFuture ? { scale: 1.06, y: -2 } : {}}
      whileTap={!isFuture ? { scale: 0.95 } : {}}
      onClick={!isFuture ? onClick : undefined}
      disabled={isFuture}
      className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all duration-200 aspect-square
        ${bgClass} ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`text-xs font-bold ${textClass}`}>{day}</span>
      {isTrophy && data.status !== "completed" && data.status !== "missed" ? (
        <Trophy className={`w-5 h-5 ${isToday ? "text-primary" : "text-muted-foreground/50"}`} />
      ) : icon ? (
        icon
      ) : (
        <span className="text-xs text-muted-foreground/40">Apr</span>
      )}
      {isToday && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full animate-pulse" />
      )}
    </motion.button>
  );
}

// ─── Player's own tracker ───────────────────────────────────────────────────

export default function ConsistencyTracker() {
  const { user } = useAuth();

  if (user?.isCoach) return <CoachView />;
  return <PlayerView />;
}

function PlayerView() {
  const { user } = useAuth();
  const [days, setDays] = useState<Record<number, DayData>>({});
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const todayDay = today.getMonth() + 1 === MONTH && today.getFullYear() === YEAR ? today.getDate() : -1;

  const loadData = useCallback(async () => {
    if (!user) return;
    // Load training entries for April
    const trainSnap = await getDocs(
      query(collection(db, "training"), where("uid", "==", user.uid))
    );
    const entries: Record<string, DailyEntry> = {};
    trainSnap.docs.forEach((d) => {
      const e = d.data() as DailyEntry;
      entries[e.date] = e;
    });

    // Load saved consistency statuses
    const conRef = doc(db, "consistency", user.uid);
    const conSnap = await getDoc(conRef);
    const saved: Record<string, DayStatus> = conSnap.exists() ? conSnap.data() as Record<string, DayStatus> : {};

    const result: Record<number, DayData> = {};
    for (let d = 1; d <= TOTAL_DAYS; d++) {
      const key = dateKey(d);
      const entry = entries[key];
      const good = isGoodPerformance(entry);
      result[d] = {
        status: saved[key] ?? "",
        isGood: good,
        hasEntry: !!entry,
      };
    }
    setDays(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleClick(day: number) {
    if (!user) return;
    const d = days[day];
    let next: DayStatus;

    if (d.isGood) {
      // Good: grey → completed → missed → grey
      if (d.status === "") next = "completed";
      else if (d.status === "completed") next = "missed";
      else next = "";
    } else {
      // Poor: grey → missed → grey
      if (d.status === "") next = "missed";
      else next = "";
    }

    const updated = { ...days, [day]: { ...d, status: next } };
    setDays(updated);

    // Save to Firestore
    const conRef = doc(db, "consistency", user.uid);
    const saveData: Record<string, DayStatus> = {};
    Object.entries(updated).forEach(([k, v]) => {
      saveData[dateKey(Number(k))] = v.status;
    });
    await setDoc(conRef, saveData, { merge: true });
  }

  const completedDays = Object.values(days).filter((d) => d.status === "completed").length;
  const missedDays = Object.values(days).filter((d) => d.status === "missed").length;
  const markedDays = completedDays + missedDays;
  const pct = markedDays > 0 ? Math.round((completedDays / markedDays) * 100) : 0;
  const msg = getConsistencyMsg(pct);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-card rounded-xl animate-pulse" />
        <div className="grid grid-cols-6 gap-3">
          {[...Array(30)].map((_, i) => <div key={i} className="aspect-square bg-card rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <CalendarDays className="text-primary" /> 30-Day Tracker
        </h1>
        <p className="text-muted-foreground mt-2">April 2026 — Click each day to mark your training status.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-green-500">{completedDays}</p>
          <p className="text-xs font-bold text-green-500/70 uppercase tracking-wider mt-1">Completed</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-red-500">{missedDays}</p>
          <p className="text-xs font-bold text-red-500/70 uppercase tracking-wider mt-1">Missed</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-primary">{pct}%</p>
          <p className="text-xs font-bold text-primary/70 uppercase tracking-wider mt-1">Consistency</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> April Progress
          </span>
          <span className="text-sm font-black text-primary">{completedDays} / {TOTAL_DAYS} days</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedDays / TOTAL_DAYS) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
          />
        </div>

        {markedDays > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${msg.bg}`}
            >
              <Flame className={`w-4 h-4 ${msg.color}`} />
              <span className={`text-sm font-bold ${msg.color}`}>{msg.text}</span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500/50 inline-block" /> Completed (Good performance)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/50 inline-block" /> Missed / Poor performance</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-secondary inline-block border border-border" /> Not marked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Today</span>
      </div>

      {/* 30-Day Grid */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-6 gap-3">
          {[...Array(TOTAL_DAYS)].map((_, i) => {
            const day = i + 1;
            const isFuture = todayDay > 0 && day > todayDay;
            return (
              <DayBox
                key={day}
                day={day}
                data={days[day] ?? { status: "", isGood: false, hasEntry: false }}
                isToday={day === todayDay}
                isFuture={isFuture}
                onClick={() => handleClick(day)}
              />
            );
          })}
        </div>
      </div>

      {/* Performance Conditions Reminder */}
      <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <h3 className="font-black text-foreground mb-3 text-sm uppercase tracking-wider">✅ Good Performance = </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Running", condition: "≥ 10 minutes", icon: "🏃" },
            { label: "Sprint Rounds", condition: "≥ 4 rounds", icon: "⚡" },
            { label: "Skill Practice", condition: "Done (any)", icon: "🎯" },
          ].map((item) => (
            <div key={item.label} className="bg-secondary/40 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <div>
                <p className="text-xs font-black text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.condition}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Days with <strong>good performance data</strong> can be marked ✅ or ❌. Days with poor/no data can only be marked ❌.
        </p>
      </div>
    </div>
  );
}

// ─── Coach view — see all players' trackers ─────────────────────────────────

function CoachView() {
  const [playerData, setPlayerData] = useState<
    { uid: string; name: string; completed: number; missed: number; pct: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [userSnap, conSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "consistency")),
      ]);

      const users = userSnap.docs.map((d) => ({ uid: d.id, name: (d.data() as { name: string }).name }));
      const conMap: Record<string, Record<string, DayStatus>> = {};
      conSnap.docs.forEach((d) => { conMap[d.id] = d.data() as Record<string, DayStatus>; });

      const result = users.map((u) => {
        const con = conMap[u.uid] ?? {};
        const vals = Object.values(con);
        const completed = vals.filter((v) => v === "completed").length;
        const missed = vals.filter((v) => v === "missed").length;
        const total = completed + missed;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { uid: u.uid, name: u.name, completed, missed, pct };
      });

      setPlayerData(result.sort((a, b) => b.pct - a.pct));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <CalendarDays className="text-primary" /> Players' April Trackers
        </h1>
        <p className="text-muted-foreground mt-2">Overview of all players' 30-day consistency for April 2026.</p>
      </div>

      {playerData.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">No data yet</p>
          <p className="text-sm mt-2">Players need to start marking their tracker.</p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border/50">
            <h3 className="font-black text-foreground">April 2026 — Consistency Rankings</h3>
          </div>
          <div className="divide-y divide-border/30">
            {playerData.map((p, i) => {
              const msg = getConsistencyMsg(p.pct);
              return (
                <motion.div
                  key={p.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-6 py-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{i + 1}</span>
                      <p className="font-bold text-foreground">{p.name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-green-500 font-bold">✅ {p.completed}</span>
                      <span className="text-xs text-red-500 font-bold">❌ {p.missed}</span>
                      <span className={`text-sm font-black ${msg.color}`}>{p.pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${(p.completed / TOTAL_DAYS) * 100}%` }}
                    />
                  </div>
                  <p className={`text-xs font-semibold mt-1.5 ${msg.color}`}>{msg.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
