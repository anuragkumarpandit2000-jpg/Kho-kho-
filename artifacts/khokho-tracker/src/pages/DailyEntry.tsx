import { useState } from "react";
import { addDoc, collection, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { calculateDailyScore, getMotivationalMessage } from "@/lib/points";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ClipboardList, Loader2 } from "lucide-react";

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${value ? "bg-primary" : "bg-border"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-6" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function Slider({ value, onChange, min, max, label }: { value: number; onChange: (v: number) => void; min: number; max: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-sm font-semibold text-muted-foreground">{label}</label>
        <span className="text-sm font-black text-primary">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

export default function DailyEntry() {
  const { user, refreshUser } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [running, setRunning] = useState(0);
  const [sprintRounds, setSprintRounds] = useState(0);
  const [skillPracticed, setSkillPracticed] = useState("");
  const [matchPlayed, setMatchPlayed] = useState(false);
  const [foulsCommitted, setFoulsCommitted] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(7);
  const [sleepHours, setSleepHours] = useState(8);
  const [exercise, setExercise] = useState("");
  const [exerciseDuration, setExerciseDuration] = useState(0);
  const [practiceAtHome, setPracticeAtHome] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const entryData = { running, sprintRounds, skillPracticed, matchPlayed, foulsCommitted, energyLevel, sleepHours, exercise, exerciseDuration, practiceAtHome, notes };
      const daily = calculateDailyScore(entryData);
      await addDoc(collection(db, "training"), {
        uid: user.uid,
        name: user.name,
        date: today,
        ...entryData,
        dailyScore: daily,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), { totalScore: increment(daily) });
      await refreshUser();
      setScore(daily);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-14 h-14 text-primary" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-3xl font-black text-foreground">Entry Saved!</h2>
          <p className="text-muted-foreground mt-2">Today's training logged successfully.</p>
          <div className="mt-6 bg-primary/10 border border-primary/30 rounded-2xl px-8 py-4 inline-block">
            <p className="text-5xl font-black text-primary">+{score}</p>
            <p className="text-sm text-muted-foreground font-semibold mt-1">Points Earned Today</p>
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">{getMotivationalMessage(score)}</p>
          <button
            onClick={() => { setSubmitted(false); setRunning(0); setSprintRounds(0); setSkillPracticed(""); setMatchPlayed(false); setFoulsCommitted(0); setEnergyLevel(7); setSleepHours(8); setExercise(""); setExerciseDuration(0); setPracticeAtHome(false); setNotes(""); }}
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition"
          >
            Log Another Entry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <ClipboardList className="text-primary" />
          Daily Training Entry
        </h1>
        <p className="text-muted-foreground mt-2">Log today's activity and earn points — <span className="font-bold text-primary">{today}</span></p>
      </div>

      <AnimatePresence>
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-black uppercase tracking-wider text-primary">🏃 Training Activity</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Running (minutes) <span className="text-primary font-black">+5 pts</span></label>
                <input type="number" min={0} value={running} onChange={(e) => setRunning(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Sprint Rounds <span className="text-primary font-black">+5 pts</span></label>
                <input type="number" min={0} value={sprintRounds} onChange={(e) => setSprintRounds(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Skill Practiced <span className="text-primary font-black">+5 pts</span></label>
              <input type="text" value={skillPracticed} onChange={(e) => setSkillPracticed(e.target.value)}
                placeholder="e.g. Chasing technique, Ring defense"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Exercise Performed <span className="text-primary font-black">+5 pts</span></label>
              <input type="text" value={exercise} onChange={(e) => setExercise(e.target.value)}
                placeholder="e.g. Push-ups, Squats, Planks"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Exercise Duration (minutes)</label>
              <input type="number" min={0} value={exerciseDuration} onChange={(e) => setExerciseDuration(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition" />
            </div>

            <div className="space-y-4">
              <Toggle value={matchPlayed} onChange={setMatchPlayed} label={`Match Played today? (+5 pts)`} />
              <Toggle value={practiceAtHome} onChange={setPracticeAtHome} label={`Practiced at home? (+5 pts)`} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Fouls Committed</label>
              <input type="number" min={0} value={foulsCommitted} onChange={(e) => setFoulsCommitted(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition" />
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-base font-black uppercase tracking-wider text-primary">💤 Recovery & Wellness</h3>
            <Slider value={energyLevel} onChange={setEnergyLevel} min={1} max={10} label={`Energy Level (1–10) ${energyLevel >= 7 ? "— +5 pts" : ""}`} />
            <Slider value={sleepHours} onChange={setSleepHours} min={0} max={12} label={`Sleep Hours ${sleepHours >= 7 ? "— +5 pts" : ""}`} />
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-black uppercase tracking-wider text-primary mb-4">📝 Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was today's training? Any thoughts..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none"
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Estimated Score</p>
              <p className="text-4xl font-black text-primary">
                +{calculateDailyScore({ running, sprintRounds, skillPracticed, matchPlayed, foulsCommitted, energyLevel, sleepHours, exercise, exerciseDuration, practiceAtHome, notes })}
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-primary text-primary-foreground font-black rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 text-base"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Submit Entry
            </button>
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
