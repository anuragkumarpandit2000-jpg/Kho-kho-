import { useState } from "react";
import { usePlayers, useMatches, useCreateMatch } from "@/hooks/use-kho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, AlertTriangle, Crosshair, Swords } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Matches() {
  const { data: players } = usePlayers();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const { data: matches } = useMatches(selectedPlayer || undefined);
  const { mutate: logMatch, isPending } = useCreateMatch();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [outs, setOuts] = useState("");
  const [fouls, setFouls] = useState("");
  const [chases, setChases] = useState("");

  const handleAdd = () => {
    if (!selectedPlayer || !date) return;
    logMatch({
      playerId: selectedPlayer,
      date,
      totalOuts: Number(outs) || 0,
      foulsCommitted: Number(fouls) || 0,
      successfulChases: Number(chases) || 0
    }, {
      onSuccess: () => {
        setOuts(""); setFouls(""); setChases("");
      }
    });
  };

  const getSuggestion = (match: any) => {
    if (match.foulsCommitted > 3) return { text: "Too many fouls. Work on control and timing.", type: "destructive" };
    if (match.totalOuts === 0) return { text: "Needs aggressive pole dives and sudden sprints.", type: "warning" };
    if (match.successfulChases > 5) return { text: "Excellent stamina and endurance shown!", type: "success" };
    return { text: "Solid baseline performance.", type: "default" };
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-4xl font-black">Match Analysis</h1>
        <p className="text-muted-foreground mt-1">Record in-game stats and get tactical feedback.</p>
      </div>

      <Card className="bg-card border-border rounded-2xl">
        <CardContent className="p-6">
           <div className="max-w-xs mb-6">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Player Context</label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger className="bg-muted border-0 h-12 rounded-xl">
                <SelectValue placeholder="All Matches / Select Player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- View All Team Matches --</SelectItem>
                {players?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(selectedPlayer && selectedPlayer !== 'all') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-muted/50 p-4 rounded-xl border border-border">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Date</label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-background border-0 h-12 rounded-xl" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Total Outs</label>
                <Input type="number" placeholder="e.g. 3" value={outs} onChange={e => setOuts(e.target.value)} className="bg-background border-0 h-12 rounded-xl font-black text-lg" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Fouls</label>
                <Input type="number" placeholder="e.g. 1" value={fouls} onChange={e => setFouls(e.target.value)} className="bg-background border-0 h-12 rounded-xl font-black text-lg" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Successful Chases</label>
                <Input type="number" placeholder="e.g. 4" value={chases} onChange={e => setChases(e.target.value)} className="bg-background border-0 h-12 rounded-xl font-black text-lg" />
              </div>
              <Button onClick={handleAdd} disabled={isPending} className="h-12 md:col-span-4 rounded-xl font-bold mt-2">
                Save Match Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {(!matches || matches.length === 0) ? (
          <div className="py-12 text-center text-muted-foreground bg-card border-2 border-dashed border-border rounded-2xl">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold">No match records found.</p>
          </div>
        ) : (
          matches.map(match => {
            const player = players?.find(p => p.id === match.playerId);
            const sug = getSuggestion(match);
            
            return (
              <Card key={match.id} className="bg-card border-border overflow-hidden hover-elevate rounded-2xl transition-all">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 md:w-64 bg-muted/30 border-b md:border-b-0 md:border-r border-border flex flex-col justify-center">
                    <p className="text-sm font-bold text-muted-foreground uppercase">{format(new Date(match.date), 'MMM do, yyyy')}</p>
                    <h3 className="text-2xl font-black text-foreground mt-1">{player?.name || "Unknown"}</h3>
                    <Badge variant="outline" className="mt-2 w-fit">{player?.role || "Athlete"}</Badge>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Crosshair className="w-3 h-3"/> Outs</span>
                        <span className="text-3xl font-black text-primary">{match.totalOuts}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Fouls</span>
                        <span className="text-3xl font-black text-destructive">{match.foulsCommitted}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1"><Swords className="w-3 h-3"/> Chases</span>
                        <span className="text-3xl font-black text-accent">{match.successfulChases}</span>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border text-sm font-medium ${
                      sug.type === 'destructive' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                      sug.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                      sug.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                      'bg-muted text-foreground border-border'
                    }`}>
                      <strong>Coach's Note:</strong> {sug.text}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  );
}
