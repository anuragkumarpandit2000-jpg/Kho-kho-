import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { DailyEntry } from "@/lib/points";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, CalendarDays, TrendingUp, CheckCircle, XCircle, Flame, Shield } from "lucide-react";

// ─── Date range: March 30 → April 27, 2026 ──────────────────────────────────
function buildDays() {
  const days: { date: string; label: string }[] = [];
  // March 30–31
  for (let d = 30; d <= 31; d++) {
    days.push({ date: `2026-03-${String(d).padStart(2, "0")}`, label: `${d} Mar` });
  }
  // April 1–27
  for (let d = 1; d <= 27; d++) {
    days.push({ date: `2026-04-${String(d).padStart(2, "0")}`, label: `${d} Apr` });
  }
  return days; // 29 days total, last = April 27
}
const DAYS = buildDays();
const LAST_IDX = DAYS.length - 1; // index 28 = April 27 → trophy

type DayStatus = "completed" | "missed" | "";

interface DayData {
  status: DayStatus;
  isGood: boolean;
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

function DayBox({ idx, dayInfo, data, isToday, isFuture, onClick }: {
  idx: number;
  dayInfo: { date: string; label: string };
  data: DayData;
  isToday: boolean;
  isFuture: boolean;
  onClick: () => void;
}) {
  const isTrophy = idx === LAST_IDX;

  let bgClass = "bg-secondary/40 border-border/40 hover:border-border";
  let textClass = "text-muted-foreground";
  let icon = null;

  if (data.status === "completed") {
    bgClass = "bg-green-500/15 border-green-500/40 shadow-green-500/10 shadow-md";
    textClass = "text-green-600 dark:text-green-400";
    icon = <CheckCircle className="w-4 h-4 text-green-500" />;
  } else if (data.status === "missed") {
    bgClass = "bg-red-500/15 border-red-500/40 shadow-red-500/10 shadow-md";
    textClass = "text-red-500";
    icon = <XCircle className="w-4 h-4 text-red-500" />;
  }

  if (isToday && data.status === "") {
    bgClass = "bg-primary/15 border-primary/50 ring-2 ring-primary/30";
    textClass = "text-primary font-black";
  }

  const [datePart, month] = dayInfo.label.split(" ");

  return (
    <motion.button
      whileHover={!isFuture ? { scale: 1.08, y: -2 } : {}}
      whileTap={!isFuture ? { scale: 0.94 } : {}}
      onClick={!isFuture ? onClick : undefined}
      disabled={isFuture}
      className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 transition-all duration-200 aspect-square
        ${bgClass} ${isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span className={`text-sm font-black leading-none ${textClass}`}>{datePart}</span>
      <span className={`text-[9px] font-bold uppercase tracking-wider ${textClass} opacity-70`}>{month}</span>

      {isTrophy && data.status === "" ? (
        <Trophy className={`w-4 h-4 mt-0.5 ${isToday ? "text-primary" : "text-yellow-500"}`} />
      ) : icon ? (
        <div className="mt-0.5">{icon}</div>
      ) : null}

      {isToday && (
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-primary rounded-full animate-pulse border-2 border-background" />
      )}
    </motion.button>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function ConsistencyTracker() {
  const { user } = useAuth();
  return (
    <div className="space-y-12">
      <PlayerView />
      {user?.isCoach && <CoachView />}
    </div>
  );
}

// ─── Player view ──────────────────────────────────────────────────────────────

function PlayerView() {
  const { user } = useAuth();
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split("T")[0];

  const loadData = useCallback(async () => {
    if (!user) return;

    const trainSnap = await getDocs(collection(db, "training"));
    const entries: Record<string, DailyEntry> = {};
    trainSnap.docs.forEach((d) => {
      const e = d.data() as DailyEntry;
      if (e.uid === user.uid) entries[e.date] = e;
    });

    const conRef = doc(db, "consistency", user.uid);
    const conSnap = await getDoc(conRef);
    const saved: Record<string, DayStatus> = conSnap.exists() ? (conSnap.data() as Record<string, DayStatus>) : {};

    const result: Record<string, DayData> = {};
    DAYS.forEach(({ date }) => {
      result[date] = {
        status: saved[date] ?? "",
        isGood: isGoodPerformance(entries[date]),
      };
    });
    setDays(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleClick(date: string) {
    if (!user) return;
    const d = days[date];
    let next: DayStatus;

    if (d.isGood) {
      if (d.status === "") next = "completed";
      else if (d.status === "completed") next = "missed";
      else next = "";
    } else {
      if (d.status === "") next = "missed";
      else next = "";
    }

    const updated = { ...days, [date]: { ...d, status: next } };
    setDays(updated);

    const saveData: Record<string, DayStatus> = {};
    Object.entries(updated).forEach(([k, v]) => { saveData[k] = v.status; });
    await setDoc(doc(db, "consistency", user.uid), saveData, { merge: true });
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
        <div className="grid grid-cols-6 gap-2">
          {[...Array(29)].map((_, i) => <div key={i} className="aspect-square bg-card rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <CalendarDays className="text-primary" /> 30-Day Tracker
        </h1>
        <p className="text-muted-foreground mt-2">Mar 30 – Apr 27, 2026 — Tap each day to mark your training.</p>
      </div>

      {/* Stats */}
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
            <TrendingUp className="w-4 h-4 text-primary" /> Progress
          </span>
          <span className="text-sm font-black text-primary">{completedDays} / {DAYS.length} days</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completedDays / DAYS.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
          />
        </div>
        <AnimatePresence>
          {markedDays > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 border ${msg.bg}`}>
              <Flame className={`w-4 h-4 ${msg.color}`} />
              <span className={`text-sm font-bold ${msg.color}`}>{msg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500/50 inline-block" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/50 inline-block" /> Missed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-secondary inline-block border border-border" /> Unmarked</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary inline-block" /> Today</span>
        <span className="flex items-center gap-1.5"><Trophy className="w-3 h-3 text-yellow-500" /> Goal day</span>
      </div>

      {/* Grid */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-6 gap-2">
          {DAYS.map((dayInfo, idx) => {
            const isFuture = dayInfo.date > todayStr;
            return (
              <DayBox
                key={dayInfo.date}
                idx={idx}
                dayInfo={dayInfo}
                data={days[dayInfo.date] ?? { status: "", isGood: false }}
                isToday={dayInfo.date === todayStr}
                isFuture={isFuture}
                onClick={() => handleClick(dayInfo.date)}
              />
            );
          })}
        </div>
      </div>

      {/* Performance conditions */}
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
          Good performance days: tap to cycle ✅ → ❌ → blank. Poor/no data: tap to mark ❌ → blank only.
        </p>
      </div>
    </div>
  );
}

// ─── Coach view ───────────────────────────────────────────────────────────────

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
        const completed = Object.values(con).filter((v) => v === "completed").length;
        const missed = Object.values(con).filter((v) => v === "missed").length;
        const total = completed + missed;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { uid: u.uid, name: u.name, completed, missed, pct };
      });

      setPlayerData(result.sort((a, b) => b.pct - a.pct));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="border-t border-border/50 pt-8">
        <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Shield className="text-primary w-6 h-6" /> All Players — April Consistency
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Coach view — Mar 30 to Apr 27, 2026.</p>
      </div>

      {playerData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">No data yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="divide-y divide-border/30">
            {playerData.map((p, i) => {
              const msg = getConsistencyMsg(p.pct);
              return (
                <motion.div key={p.uid} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="px-6 py-4">
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
                    <div className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-700"
                      style={{ width: `${(p.completed / DAYS.length) * 100}%` }} />
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
