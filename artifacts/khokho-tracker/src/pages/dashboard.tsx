import { usePlayers, useSpeed, useMatches, useLoadDemoData } from "@/hooks/use-kho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Activity, Users, FastForward, Flame, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: players, isLoading: playersLoading } = usePlayers();
  const { data: speeds, isLoading: speedLoading } = useSpeed();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { mutate: loadDemo, isPending: loadingDemo } = useLoadDemoData();

  const isLoading = playersLoading || speedLoading || matchesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  // Calculate Stats
  const totalPlayers = players?.length || 0;
  
  let bestSpeed = 999;
  let fastestPlayerId = "";
  speeds?.forEach(s => {
    if (s.timeInSeconds < bestSpeed) {
      bestSpeed = s.timeInSeconds;
      fastestPlayerId = s.playerId;
    }
  });
  const fastestPlayer = players?.find(p => p.id === fastestPlayerId);

  // Determine top performer from matches
  let topOuts = -1;
  let topPerformerId = "";
  matches?.forEach(m => {
    if (m.totalOuts > topOuts) {
      topOuts = m.totalOuts;
      topPerformerId = m.playerId;
    }
  });
  const topPerformer = players?.find(p => p.id === topPerformerId);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground">Team Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">Overview of your squad's performance.</p>
        </div>
        
        {totalPlayers === 0 && (
          <Button 
            onClick={() => loadDemo()} 
            disabled={loadingDemo}
            className="bg-primary text-primary-foreground hover-elevate rounded-xl px-6"
          >
            {loadingDemo ? "Loading..." : "Load Demo Data"}
          </Button>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card border-border/50 shadow-lg shadow-black/5 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Users className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Active Roster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-foreground">{totalPlayers}</div>
              <p className="text-sm text-primary font-semibold mt-2 flex items-center gap-1">
                <Activity className="w-4 h-4" /> Ready for action
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-lg shadow-primary/5 rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FastForward className="w-24 h-24 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-primary uppercase tracking-wider">Record 80m Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-foreground">
                {bestSpeed === 999 ? "--" : `${bestSpeed.toFixed(1)}s`}
              </div>
              <p className="text-sm text-muted-foreground mt-2 font-medium">
                By {fastestPlayer ? fastestPlayer.name : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border/50 shadow-lg shadow-black/5 rounded-2xl overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="w-24 h-24 text-accent" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Matches Played</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-foreground">{matches?.length || 0}</div>
              <p className="text-sm text-accent font-semibold mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Gaining experience
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* HIGHLIGHT SECTION */}
      {topPerformer && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-r from-card to-card border-l-4 border-l-primary rounded-2xl shadow-xl overflow-hidden">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="bg-primary/20 p-6 rounded-full relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
                <Flame className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <Badge className="bg-primary hover:bg-primary text-primary-foreground mb-3 px-3 py-1 text-xs uppercase font-bold tracking-widest no-default-hover-elevate">MVP of the Week</Badge>
                <h2 className="text-3xl font-black text-foreground">{topPerformer.name}</h2>
                <p className="text-muted-foreground mt-2 text-lg">Incredible performance with <strong className="text-foreground">{topOuts}</strong> total outs in a single match. Keep pushing the limits!</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* RANKINGS PREVIEW */}
      {players && players.length > 0 && (
        <div className="pt-6">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="text-primary" /> Player Roster Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.slice(0, 6).map((p, i) => (
              <div key={p.id} className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 hover-elevate">
                <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-black text-xl">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{p.name}</h4>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{p.role} • STR: {p.strengthLevel}/10</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
