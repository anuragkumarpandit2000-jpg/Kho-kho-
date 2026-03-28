import { useState } from "react";
import { usePlayers, useTraining, useCreateTraining } from "@/hooks/use-kho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Calendar, Flame } from "lucide-react";
import { format, subDays } from "date-fns";

export default function TrainingTracker() {
  const { data: players } = usePlayers();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const { data: logs, isLoading } = useTraining(selectedPlayer || undefined);
  const { mutate: addLog, isPending } = useCreateTraining();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [running, setRunning] = useState("");
  const [sprints, setSprints] = useState("");
  const [practice, setPractice] = useState("");

  const handleAdd = () => {
    if (!selectedPlayer || !date) return;
    addLog({
      playerId: selectedPlayer,
      date,
      runningMinutes: Number(running) || 0,
      sprintRounds: Number(sprints) || 0,
      practiceDuration: Number(practice) || 0
    }, {
      onSuccess: () => {
        setRunning(""); setSprints(""); setPractice("");
      }
    });
  };

  // Weekly stats
  const last7DaysLogs = logs?.filter(l => new Date(l.date) >= subDays(new Date(), 7)) || [];
  const weeklyRunning = last7DaysLogs.reduce((a, b) => a + b.runningMinutes, 0);
  const weeklySprints = last7DaysLogs.reduce((a, b) => a + b.sprintRounds, 0);
  const weeklyPractice = last7DaysLogs.reduce((a, b) => a + b.practiceDuration, 0);
  
  const uniqueDays = new Set(last7DaysLogs.map(l => l.date)).size;
  const consistency = Math.round((uniqueDays / 7) * 100);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black">Training Regimen</h1>
        <p className="text-muted-foreground mt-1">Log daily workouts and measure consistency.</p>
      </div>

      <Card className="bg-card border-border rounded-2xl">
        <CardContent className="p-6">
          <div className="max-w-xs mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Viewing Player</label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="bg-muted border-0 h-12 rounded-xl">
                <SelectValue placeholder="Select athlete" />
              </SelectTrigger>
              <SelectContent>
                {players?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlayer && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Date</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted border-0 h-12 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Running (Min)</label>
                <Input type="number" placeholder="e.g. 30" value={running} onChange={e => setRunning(e.target.value)} className="bg-muted border-0 h-12 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Sprint Rounds</label>
                <Input type="number" placeholder="e.g. 10" value={sprints} onChange={e => setSprints(e.target.value)} className="bg-muted border-0 h-12 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Kho Practice (Min)</label>
                <Input type="number" placeholder="e.g. 60" value={practice} onChange={e => setPractice(e.target.value)} className="bg-muted border-0 h-12 rounded-xl" />
              </div>
              <Button onClick={handleAdd} disabled={isPending} className="h-12 md:col-span-4 rounded-xl font-bold mt-2">
                Log Training Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPlayer && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-gradient-to-b from-primary/10 to-transparent border-primary/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-primary flex items-center gap-2">
                  <Flame className="w-5 h-5" /> 7-Day Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="60" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                    <circle cx="64" cy="64" r="60" stroke="hsl(var(--primary))" strokeWidth="8" fill="none" strokeDasharray="377" strokeDashoffset={377 - (377 * consistency) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-4xl font-black text-foreground">{consistency}%</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-2 text-center divide-x divide-border">
                  <div>
                    <p className="text-xl font-bold text-foreground">{weeklyRunning}m</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Running</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{weeklySprints}</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Sprints</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{weeklyPractice}m</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Practice</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4">Recent Sessions</h3>
            <div className="space-y-3">
              {logs?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  No training data logged yet.
                </div>
              ) : (
                logs?.slice(0, 5).map(log => (
                  <Card key={log.id} className="bg-card border-border rounded-xl hover-elevate">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-muted p-3 rounded-lg text-primary">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{format(new Date(log.date), 'EEEE, MMM do')}</p>
                          <p className="text-sm text-muted-foreground flex gap-3 mt-1">
                            <span>🏃 {log.runningMinutes}m</span>
                            <span>⚡ {log.sprintRounds} rounds</span>
                            <span>🎯 {log.practiceDuration}m</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">
                          {log.runningMinutes + log.practiceDuration}<span className="text-sm">m</span>
                        </div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Time</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
