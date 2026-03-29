import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardPlayer {
  uid: string;
  name: string;
  totalScore: number;
  email?: string;
}

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = [
  "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
  "from-slate-400/20 to-slate-400/5 border-slate-400/30",
  "from-orange-600/20 to-orange-600/5 border-orange-600/30",
];

export default function Leaderboard() {
  const { user } = useAuth();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(query(collection(db, "users"), orderBy("totalScore", "desc")));
      setPlayers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as LeaderboardPlayer));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card rounded-2xl animate-pulse" />)}</div>;
  }

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black text-foreground flex items-center gap-3">
          <Trophy className="text-yellow-500" /> Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">Rankings based on total training points earned.</p>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-xl font-bold">No players yet</p>
          <p className="text-sm mt-2">Register and log training to appear on the leaderboard!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {top3.map((p, i) => (
              <motion.div
                key={p.uid}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-gradient-to-b ${MEDAL_COLORS[i]} border rounded-2xl p-6 text-center shadow-md ${i === 0 ? "sm:order-2" : i === 1 ? "sm:order-1" : "sm:order-3"}`}
              >
                <p className="text-4xl mb-2">{MEDALS[i]}</p>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">#{i + 1}</p>
                <p className={`text-xl font-black text-foreground mt-1 ${p.uid === user?.uid ? "text-primary" : ""}`}>
                  {p.name} {p.uid === user?.uid ? "(You)" : ""}
                </p>
                <p className="text-3xl font-black text-foreground mt-3">{p.totalScore}</p>
                <p className="text-xs text-muted-foreground font-semibold">Total Points</p>
              </motion.div>
            ))}
          </div>

          {rest.length > 0 && (
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border/50">
                <h3 className="font-black text-foreground flex items-center gap-2">
                  <Medal className="w-5 h-5 text-primary" /> All Rankings
                </h3>
              </div>
              <div className="divide-y divide-border/30">
                {players.map((p, i) => (
                  <motion.div
                    key={p.uid}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition ${p.uid === user?.uid ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 text-sm font-black text-muted-foreground text-center">
                        {i < 3 ? MEDALS[i] : `#${i + 1}`}
                      </span>
                      <div>
                        <p className={`font-bold text-foreground ${p.uid === user?.uid ? "text-primary" : ""}`}>
                          {p.name} {p.uid === user?.uid ? "(You)" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-foreground">{p.totalScore}</p>
                      <p className="text-xs text-muted-foreground">pts</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
