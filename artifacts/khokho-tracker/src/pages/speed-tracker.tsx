import { useState } from "react";
import { usePlayers, useSpeed, useCreateSpeed } from "@/hooks/use-kho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Timer, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { format } from "date-fns";

export default function SpeedTracker() {
  const { data: players } = usePlayers();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const { data: speeds, isLoading: loadingSpeeds } = useSpeed(selectedPlayer || undefined);
  const { mutate: logSpeed, isPending } = useCreateSpeed();

  const [time, setTime] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAdd = () => {
    if (!selectedPlayer || !time || !date) return;
    logSpeed(
      { playerId: selectedPlayer, timeInSeconds: parseFloat(time), date },
      { onSuccess: () => setTime("") }
    );
  };

  // Stats calculation
  const chartData = (speeds || []).map(s => ({
    date: format(new Date(s.date), 'MMM dd'),
    time: s.timeInSeconds,
    fullDate: s.date
  }));

  const bestTime = chartData.length > 0 ? Math.min(...chartData.map(d => d.time)) : 0;
  const avgTime = chartData.length > 0 ? chartData.reduce((a, b) => a + b.time, 0) / chartData.length : 0;
  
  // Trend insight logic
  let insight = "Not enough data";
  let TrendIcon = Minus;
  let trendColor = "text-muted-foreground";

  if (chartData.length >= 3) {
    const last3 = chartData.slice(-3);
    const trend = last3[0].time - last3[2].time; // positive = time went down (improving)
    
    if (trend > 0.5) {
      insight = "Improving trend!";
      TrendIcon = TrendingDown; // down is good for time
      trendColor = "text-green-500";
    } else if (trend < -0.5) {
      insight = "Slowing down. Needs work.";
      TrendIcon = TrendingUp;
      trendColor = "text-destructive";
    } else {
      insight = "Performance stable.";
      TrendIcon = Minus;
      trendColor = "text-primary";
    }
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black">Speed Tracker</h1>
        <p className="text-muted-foreground mt-1">Track 80m sprint times and monitor progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: Input & Stats */}
        <div className="space-y-6">
          <Card className="bg-card rounded-2xl border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="text-primary" /> Log Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Select Athlete</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="bg-muted border-0 h-12 rounded-xl">
                    <SelectValue placeholder="Choose player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPlayer && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Date</label>
                      <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted border-0 h-12 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Time (Sec)</label>
                      <Input type="number" step="0.1" placeholder="e.g. 11.5" value={time} onChange={e => setTime(e.target.value)} className="bg-muted border-0 h-12 rounded-xl font-mono text-lg" />
                    </div>
                  </div>
                  <Button onClick={handleAdd} disabled={isPending || !time} className="w-full h-12 rounded-xl text-lg font-bold hover-elevate shadow-lg shadow-primary/20">
                    {isPending ? "Saving..." : "Save Time"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {selectedPlayer && chartData.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/50 border-0 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Personal Best</p>
                  <p className="text-3xl font-black text-foreground mt-1">{bestTime.toFixed(1)}s</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50 border-0 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Average Time</p>
                  <p className="text-3xl font-black text-foreground mt-1">{avgTime.toFixed(1)}s</p>
                </CardContent>
              </Card>
              <Card className="col-span-2 bg-card border-border rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-muted ${trendColor}`}>
                    <TrendIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Trend</p>
                    <p className="text-lg font-bold text-foreground leading-tight">{insight}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* RIGHT COL: Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-card rounded-2xl border-border/50 shadow-lg h-full min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg">Performance Graph (80m Sprint)</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              {!selectedPlayer ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  Select a player to view history
                </div>
              ) : chartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  No speed records logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `${v}s`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontWeight: 'bold' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <ReferenceLine y={avgTime} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Line 
                      type="monotone" 
                      dataKey="time" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={4}
                      dot={{ r: 6, fill: 'hsl(var(--background))', stroke: 'hsl(var(--primary))', strokeWidth: 3 }}
                      activeDot={{ r: 8, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
