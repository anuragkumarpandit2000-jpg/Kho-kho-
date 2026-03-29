import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { DailyEntry } from "@/lib/points";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { TrendingUp } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const CHART_OPTS = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: "rgba(128,128,128,0.1)" } },
  },
};

interface SpeedEntry {
  date: string;
  timeInSeconds: number;
}

export default function MyProgress() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [speedEntries, setSpeedEntries] = useState<SpeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [speedTime, setSpeedTime] = useState("");
  const [speedSaving, setSpeedSaving] = useState(false);
  const [speedSaved, setSpeedSaved] = useState(false);

  async function loadData() {
    if (!user) return;
    const [trainSnap, speedSnap] = await Promise.all([
      getDocs(query(collection(db, "training"), where("uid", "==", user.uid))),
      getDocs(query(collection(db, "speed"), where("uid", "==", user.uid))),
    ]);
    setEntries(
      trainSnap.docs
        .map((d) => d.data() as DailyEntry)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30)
    );
    setSpeedEntries(
      speedSnap.docs
        .map((d) => d.data() as SpeedEntry)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30)
    );
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [user]);

  async function logSpeed(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !speedTime) return;
    setSpeedSaving(true);
    await addDoc(collection(db, "speed"), {
      uid: user.uid,
      name: user.name,
      date: new Date().toISOString().split("T")[0],
      timeInSeconds: parseFloat(speedTime),
      createdAt: serverTimestamp(),
    });
    setSpeedSaved(true);
    setSpeedTime("");
    setSpeedSaving(false);
    await loadData();
    setTimeout(() => setSpeedSaved(false), 3000);
  }

  const labels = entries.map((e) => e.date.slice(5));
  const scoreData = entries.map((e) => e.dailyScore);
  const runningData = entries.map((e) => e.running);
  const sprintData = entries.map((e) => e.sprintRounds);
  const speedLabels = speedEntries.map((e) => e.date.slice(5));
  const speedData = speedEntries.map((e) => e.timeInSeconds);

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-card rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <TrendingUp className="text-primary" /> My Progress
        </h1>
        <p className="text-muted-foreground mt-2">Track your performance over the last 30 days.</p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border/50 rounded-2xl text-muted-foreground">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">No training data yet</p>
          <p className="text-sm mt-2">Start logging daily entries to see your progress charts.</p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-foreground mb-1">📈 Daily Score Progress</h3>
            <p className="text-xs text-muted-foreground mb-4">Points earned each day</p>
            <Line
              data={{
                labels,
                datasets: [{
                  label: "Daily Score",
                  data: scoreData,
                  borderColor: "hsl(220, 90%, 60%)",
                  backgroundColor: "hsla(220, 90%, 60%, 0.15)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                }],
              }}
              options={CHART_OPTS}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-foreground mb-1">🏃 Running Minutes</h3>
              <p className="text-xs text-muted-foreground mb-4">Daily running duration</p>
              <Bar
                data={{
                  labels,
                  datasets: [{
                    label: "Running (min)",
                    data: runningData,
                    backgroundColor: "rgba(34, 197, 94, 0.7)",
                    borderRadius: 6,
                  }],
                }}
                options={CHART_OPTS}
              />
            </div>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-foreground mb-1">⚡ Sprint Rounds</h3>
              <p className="text-xs text-muted-foreground mb-4">Sprint count per session</p>
              <Bar
                data={{
                  labels,
                  datasets: [{
                    label: "Sprints",
                    data: sprintData,
                    backgroundColor: "rgba(234, 179, 8, 0.7)",
                    borderRadius: 6,
                  }],
                }}
                options={CHART_OPTS}
              />
            </div>
          </div>
        </>
      )}

      <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
        <h3 className="font-black text-foreground mb-1">⏱️ Log 80m Sprint Time</h3>
        <p className="text-xs text-muted-foreground mb-4">Record today's sprint timing (seconds)</p>
        {speedSaved && <p className="text-green-500 font-bold text-sm mb-3">✅ Speed entry saved!</p>}
        <form onSubmit={logSpeed} className="flex gap-3 mb-6">
          <input
            type="number" step="0.01" min="0" value={speedTime}
            onChange={(e) => setSpeedTime(e.target.value)}
            placeholder="e.g. 12.45 seconds"
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          />
          <button type="submit" disabled={speedSaving || !speedTime}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition">
            {speedSaving ? "Saving..." : "Log Time"}
          </button>
        </form>

        {speedEntries.length > 0 && (
          <>
            <h4 className="font-bold text-foreground mb-3 text-sm">📊 Speed Progress (30 days)</h4>
            <Line
              data={{
                labels: speedLabels,
                datasets: [{
                  label: "Time (sec)",
                  data: speedData,
                  borderColor: "rgb(239, 68, 68)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  fill: true,
                  tension: 0.4,
                  pointRadius: 4,
                }],
              }}
              options={{ ...CHART_OPTS, plugins: { ...CHART_OPTS.plugins, tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y}s` } } } }}
            />
            <p className="text-xs text-muted-foreground mt-3 text-center">Lower time = faster sprint 🏃</p>
          </>
        )}
      </div>
    </div>
  );
}
