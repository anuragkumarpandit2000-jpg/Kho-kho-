import { usePlayers, useSpeed } from "@/hooks/use-kho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Sword, Navigation, Users, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Strategy() {
  const { data: players, isLoading: pLoad } = usePlayers();
  const { data: speeds, isLoading: sLoad } = useSpeed();

  const isLoading = pLoad || sLoad;

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Calculate average speeds
  const playerSpeeds: Record<string, number> = {};
  speeds?.forEach(s => {
    if (!playerSpeeds[s.playerId]) playerSpeeds[s.playerId] = [];
    playerSpeeds[s.playerId].push(s.timeInSeconds);
  });

  const getAvgSpeed = (id: string) => {
    const times = playerSpeeds[id];
    if (!times || times.length === 0) return 999;
    return times.reduce((a, b) => a + b, 0) / times.length;
  };

  // Logic: Best Chaser (highest strength, lowest speed)
  const chasers = players?.filter(p => p.role === "Chaser") || [];
  chasers.sort((a, b) => {
    const scoreA = (a.strengthLevel * 2) - getAvgSpeed(a.id);
    const scoreB = (b.strengthLevel * 2) - getAvgSpeed(b.id);
    return scoreB - scoreA;
  });

  // Logic: Best Runner (highest strength, lowest speed)
  const runners = players?.filter(p => p.role === "Runner") || [];
  runners.sort((a, b) => {
    const scoreA = (a.strengthLevel * 2) - getAvgSpeed(a.id);
    const scoreB = (b.strengthLevel * 2) - getAvgSpeed(b.id);
    return scoreB - scoreA;
  });

  const top3Chasers = chasers.slice(0, 3);
  const top3Runners = runners.slice(0, 3);

  // Overall strategy
  const activePlayers = [...top3Chasers, ...top3Runners];
  const avgStrength = activePlayers.length ? activePlayers.reduce((acc, p) => acc + p.strengthLevel, 0) / activePlayers.length : 0;
  
  let strategyType = "Balanced Play";
  let strategyDesc = "Maintain a steady pace. Wait for opponent errors.";
  if (avgStrength >= 7.5) {
    strategyType = "Aggressive Attack";
    strategyDesc = "Utilize high strength for rapid pole dives and relentless chasing. Pressure the runners constantly.";
  } else if (avgStrength < 6 && activePlayers.length > 0) {
    strategyType = "Defensive Evasion";
    strategyDesc = "Focus on stamina conservation. Runners should use zigzag patterns to tire out chasers.";
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black uppercase">Tactical Generator</h1>
        <p className="text-muted-foreground mt-1 text-lg">AI-driven lineup based on tracked metrics.</p>
      </div>

      {(!players || players.length < 3) ? (
        <Card className="bg-destructive/10 border-destructive/20 text-destructive p-6 text-center rounded-2xl">
          <p className="font-bold text-lg">Not enough players. Add at least 3 players to generate a strategy.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="relative rounded-3xl overflow-hidden border border-border shadow-2xl">
              <img src={`${import.meta.env.BASE_URL}images/strategy-bg.png`} alt="Field" className="absolute inset-0 w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
              
              <div className="relative z-10 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Navigation className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-black text-foreground">Optimal Formation</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ATTACK SQUAD */}
                  <Card className="bg-background/60 backdrop-blur-md border-primary/30 rounded-2xl glow-primary">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-primary flex items-center gap-2 text-xl"><Sword className="w-5 h-5"/> Attack Line (Chasers)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {top3Chasers.length === 0 ? <p className="text-muted-foreground text-sm">No chasers available</p> : 
                        top3Chasers.map((p, i) => (
                          <div key={p.id} className="flex justify-between items-center bg-card/80 p-3 rounded-xl border border-border/50">
                            <span className="font-bold text-foreground">{i+1}. {p.name}</span>
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-bold">{p.specialSkill}</span>
                          </div>
                        ))
                      }
                    </CardContent>
                  </Card>

                  {/* DEFENSE SQUAD */}
                  <Card className="bg-background/60 backdrop-blur-md border-accent/30 rounded-2xl glow-accent">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-accent flex items-center gap-2 text-xl"><Shield className="w-5 h-5"/> Defense Line (Runners)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {top3Runners.length === 0 ? <p className="text-muted-foreground text-sm">No runners available</p> : 
                        top3Runners.map((p, i) => (
                          <div key={p.id} className="flex justify-between items-center bg-card/80 p-3 rounded-xl border border-border/50">
                            <span className="font-bold text-foreground">{i+1}. {p.name}</span>
                            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded font-bold">{p.specialSkill}</span>
                          </div>
                        ))
                      }
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-card border-border rounded-2xl h-full">
              <CardContent className="p-8 flex flex-col justify-center h-full text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-2">Recommended Approach</h3>
                <h2 className="text-4xl font-black text-foreground leading-tight mb-4">{strategyType}</h2>
                <p className="text-lg text-muted-foreground mb-8">{strategyDesc}</p>
                
                <div className="bg-muted p-4 rounded-xl text-left">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Squad Avg Strength</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-foreground">{avgStrength.toFixed(1)}</span>
                    <span className="text-muted-foreground mb-1">/ 10</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
