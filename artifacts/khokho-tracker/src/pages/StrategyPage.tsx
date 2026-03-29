import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { analyzePlayer } from "@/lib/analysis";
import { suggestRole, suggestStrategy, getBestChaser, getBestRunner, STRATEGY_DETAILS } from "@/lib/strategy";
import type { PlayerStats } from "@/lib/analysis";
import type { DailyEntry } from "@/lib/points";
import { motion } from "framer-motion";
import { Lightbulb, Shield, Zap, Users } from "lucide-react";

interface FirestoreUser { uid: string; name: string; totalScore: number; }

export default function StrategyPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [userSnap, trainSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "training")),
      ]);
      const users = userSnap.docs
        .map((d) => ({ uid: d.id, ...d.data() }) as FirestoreUser)
        .sort((a, b) => b.totalScore - a.totalScore);
      const entries = trainSnap.docs.map((d) => d.data() as DailyEntry);
      const stats: PlayerStats[] = users.map((u) => {
        const pEntries = entries.filter((e) => e.uid === u.uid);
        const analysis = analyzePlayer(pEntries);
        return { uid: u.uid, name: u.name, totalScore: u.totalScore, entryCount: pEntries.length, ...analysis };
      });
      setPlayerStats(stats);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}</div>;
  }

  const strategy = suggestStrategy(playerStats);
  const bestChaser = getBestChaser(playerStats);
  const bestRunner = getBestRunner(playerStats);
  const stratDetail = STRATEGY_DETAILS[strategy];

  const withRoles = playerStats.map((p) => ({ ...p, role: suggestRole(p) }));

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Lightbulb className="text-primary" /> Strategy Generator
        </h1>
        <p className="text-muted-foreground mt-2">AI-logic based team formation suggestions from training data.</p>
      </div>

      {playerStats.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">Not enough data</p>
          <p className="text-sm mt-2">Players need to log training sessions for strategy analysis.</p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-card to-card border border-primary/20 rounded-3xl p-8 text-center shadow-xl"
          >
            <p className="text-6xl mb-4">{stratDetail.icon}</p>
            <h2 className={`text-4xl font-black ${stratDetail.color}`}>{strategy} Strategy</h2>
            <p className="text-muted-foreground mt-3 text-base max-w-lg mx-auto">{stratDetail.description}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestChaser && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="bg-card border border-red-500/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-red-500">Recommended Chaser</p>
                    <p className="text-xl font-black text-foreground">{bestChaser.name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Avg Sprints: <span className="font-bold text-foreground">{bestChaser.avgSprints.toFixed(1)}</span></p>
                  <p>Avg Running: <span className="font-bold text-foreground">{bestChaser.avgRunning.toFixed(0)} min</span></p>
                  <p>Total Score: <span className="font-bold text-primary">{bestChaser.totalScore} pts</span></p>
                </div>
                <div className="mt-4 bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-500">Why Chaser?</p>
                  <p className="text-xs text-muted-foreground mt-1">High sprint rate + strong stamina = perfect for aggressive chasing.</p>
                </div>
              </motion.div>
            )}

            {bestRunner && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-card border border-blue-500/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-500">Recommended Runner</p>
                    <p className="text-xl font-black text-foreground">{bestRunner.name}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Energy Level: <span className="font-bold text-foreground">{bestRunner.avgEnergy.toFixed(1)}/10</span></p>
                  <p>Consistency: <span className="font-bold text-foreground">{bestRunner.consistency}%</span></p>
                  <p>Total Score: <span className="font-bold text-primary">{bestRunner.totalScore} pts</span></p>
                </div>
                <div className="mt-4 bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-500">Why Runner?</p>
                  <p className="text-xs text-muted-foreground mt-1">High energy consistency = reliable running with sustained pressure.</p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border/50">
              <h3 className="font-black text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Suggested Team Roles</h3>
            </div>
            <div className="divide-y divide-border/30">
              {withRoles.map((p, i) => (
                <div key={p.uid} className="flex items-center justify-between px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">{i + 1}</span>
                    <p className="font-semibold text-foreground">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${
                      p.role === "Chaser" ? "bg-red-500/10 text-red-500" :
                      p.role === "Runner" ? "bg-blue-500/10 text-blue-500" :
                      "bg-secondary text-muted-foreground"
                    }`}>{p.role}</span>
                    <span className="text-sm font-bold text-primary">{p.totalScore} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-black text-foreground mb-4">📋 Strategy Logic Reference</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-secondary/30 rounded-xl p-4">
                <span className="text-xl">⚔️</span>
                <div>
                  <p className="font-bold text-foreground text-sm">Chaser Rule</p>
                  <p className="text-xs text-muted-foreground mt-0.5">IF sprint rounds ≥ 5 AND running ≥ 20 min AND stamina high → <strong>Chaser</strong></p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-secondary/30 rounded-xl p-4">
                <span className="text-xl">🏃</span>
                <div>
                  <p className="font-bold text-foreground text-sm">Runner Rule</p>
                  <p className="text-xs text-muted-foreground mt-0.5">IF energy ≥ 6 AND consistency ≥ 50% → <strong>Runner</strong></p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-secondary/30 rounded-xl p-4">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="font-bold text-foreground text-sm">Team Strategy Rule</p>
                  <p className="text-xs text-muted-foreground mt-0.5">High avg score + 60%+ high-energy → <strong>Aggressive</strong> | Low scores → <strong>Defensive</strong> | Otherwise → <strong>Balanced</strong></p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
